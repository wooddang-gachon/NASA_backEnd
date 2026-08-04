export interface PushTokenRegisterRequest {
  /**
   * 푸시 알림 발송 디바이스 토큰 (FCM/APNs)
   * @example "fcm_device_token_example_12345"
   */
  deviceToken: string;

  /**
   * 클라이언트 플랫폼 타입
   * @example "IOS"
   */
  platform: "IOS" | "ANDROID";
}

export interface PushTokenRegisterResponse {
  success: boolean;
  message: string;
}
