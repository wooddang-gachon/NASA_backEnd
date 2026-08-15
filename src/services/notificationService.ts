import { Service } from "typedi";
import PushNotificationAdapter from "@/adapters/PushNotificationAdapter";

import Logger from "@/loaders/logger";
import NotificationRepository from "@/repositories/NotificationRepository";
import { Inject } from "typedi";
import type {
  PushTokenRegisterRequest,
  PushTokenRegisterResponse,
  SendPushNotificationRequest,
} from "@/dto";

@Service()
export default class NotificationService {
  @Inject(() => NotificationRepository)
  private notificationRepository!: NotificationRepository;

  @Inject(() => PushNotificationAdapter)
  private pushAdapter!: PushNotificationAdapter;

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
    return this.pushAdapter.sendMulticast(deviceTokens, title, body, data);
  }
}
