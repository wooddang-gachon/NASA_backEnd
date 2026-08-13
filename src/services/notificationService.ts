import { Service } from "typedi";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";

import Logger from "@/loaders/logger";
import NotificationRepository from "@/repositories/NotificationRepository";
import { Inject } from "typedi";
import type {
  PushTokenRegisterRequest,
  PushTokenRegisterResponse,
  SendPushNotificationRequest,
} from "@/dto";

// Firebase Admin SDK 초기화 헬퍼
/**
 * Firebase Admin SDK 초기화
 */
function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  try {
    const certPath = path.join(
      process.cwd(),
      "src",
      "config",
      "firebase-service-account.json",
    );
    if (fs.existsSync(certPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(certPath, "utf-8"));
      initializeApp({
        credential: cert(serviceAccount),
      });
      Logger.info(
        "🔥 [Firebase] Firebase Admin SDK successfully initialized with service account (nasa-alarm).",
      );
    } else {
      Logger.warn(
        "⚠️ [Firebase] firebase-service-account.json file not found. Running in sandbox/fallback mode.",
      );
    }
  } catch (error) {
    Logger.error(
      `🔥 [Firebase] Failed to initialize Firebase Admin SDK: ${error}`,
    );
  }
}

@Service()
export default class NotificationService {
  @Inject(() => NotificationRepository)
  private notificationRepository!: NotificationRepository;

  constructor() {
    initFirebaseAdmin();
  }

  /**
   * [RPT-003] 디바이스 푸시 토큰 등록 및 갱신 (Up-sert)
   * @param userId 사용자 ID
   * @param data 토큰 등록 요청 데이터
   * @returns 푸시 토큰 등록 응답
   */
  public async registerPushToken(
    userId: number,
    data: PushTokenRegisterRequest,
  ): Promise<PushTokenRegisterResponse> {
    const deviceType = data.deviceType || "IOS";

    await this.notificationRepository.upsertPushToken(
      userId,
      data.deviceToken,
      deviceType,
    );

    Logger.info(
      `[NotificationService] Registered push token for userId=${userId} (${deviceType})`,
    );

    return {
      success: true,
      message: "디바이스 푸시 토큰이 성공적으로 등록되었습니다.",
    };
  }

  /**
   * [RPT-003] 별여행 탐사 및 리포트 완료 단일 사용자 푸시 알림 발송
   * @param request 푸시 알림 발송 요청 데이터
   * @returns 발송 성공 여부
   */
  public async sendPushNotification(
    request: SendPushNotificationRequest,
  ): Promise<boolean> {
    const tokens = await this.notificationRepository.findActivePushTokens(
      request.userId,
    );

    if (tokens.length === 0) {
      Logger.warn(
        `[NotificationService] No active push token found for userId=${request.userId}`,
      );
      return false;
    }

    const deviceTokens = tokens.map((t) => t.device_token);
    const result = await this.sendMulticastPushNotification(
      deviceTokens,
      request.title,
      request.body,
      request.data,
    );

    return result.successCount > 0;
  }

  /**
   * [RPT-003] 대량 묶음 FCM 멀티캐스트 푸시 알림 발송 (최대 500개 청크 분할 전송)
   * @param deviceTokens 디바이스 토큰 배열
   * @param title 알림 제목
   * @param body 알림 내용
   * @param data 추가 데이터 (옵션)
   * @returns 발송 결과 통계
   */
  public async sendMulticastPushNotification(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (deviceTokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const CHUNK_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < deviceTokens.length; i += CHUNK_SIZE) {
      const chunk = deviceTokens.slice(i, i + CHUNK_SIZE);
      Logger.info(
        `[NotificationService] [FCM Multicast] Processing batch #${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} tokens)`,
      );

      if (getApps().length > 0) {
        try {
          const messaging = getMessaging();
          const response = await messaging.sendEachForMulticast({
            tokens: chunk,
            notification: {
              title,
              body,
            },
            data,
          });
          totalSuccess += response.successCount;
          totalFailure += response.failureCount;
          Logger.info(
            ` -> [FCM Dispatch Success] Batch Success: ${response.successCount}, Failures: ${response.failureCount}`,
          );
        } catch (err) {
          Logger.error(` -> [FCM Dispatch Failed]: ${err}`);
          totalFailure += chunk.length;
        }
      } else {
        totalSuccess += chunk.length;
        Logger.info(
          ` -> [FCM Sandbox] Dispatched simulated payload for ${chunk.length} devices.`,
        );
      }
    }

    return {
      successCount: totalSuccess,
      failureCount: totalFailure,
    };
  }
}
