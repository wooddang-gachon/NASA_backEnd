export interface PushTokenRegisterRequest {
  /**
   * 클라이언트 앱에서 FCM/APNs SDK를 통해 발급받은 디바이스 토큰
   * @example "fcm_device_token_sample_12345"
   */
  deviceToken: string;

  /**
   * 기기 운영체제 타입 (IOS | ANDROID | WEB)
   * @example "IOS"
   */
  deviceType?: "IOS" | "ANDROID" | "WEB";
}

export interface PushTokenRegisterResponse {
  userId?: number;
  deviceToken?: string;
  success?: boolean;
  message?: string;
}

export interface SendPushNotificationRequest {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, string>;
}
