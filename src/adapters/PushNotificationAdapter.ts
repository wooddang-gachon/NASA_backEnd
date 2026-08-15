import { Service } from "typedi";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";
import Logger from "@/loaders/logger";

@Service()
export default class PushNotificationAdapter {
  constructor() {
    this.initFirebaseAdmin();
  }

  private initFirebaseAdmin() {
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

  /**
   * FCM 멀티캐스트 푸시 알림 발송을 요청합니다.
   * @param deviceTokens 푸시를 보낼 디바이스 토큰 목록
   * @param title 알림 제목
   * @param body 알림 내용
   * @param data 부가 데이터
   */
  public async sendMulticast(
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
        `[PushNotificationAdapter] [FCM Multicast] Processing batch #${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} tokens)`,
      );

      if (getApps().length > 0) {
        try {
          const messaging = getMessaging();
          const response = await messaging.sendEachForMulticast({
            tokens: chunk,
            notification: { title, body },
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
