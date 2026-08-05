import { Controller, Route, Post, Body, Security, Request } from "tsoa";
import { Service } from "typedi";

export interface PushTokenRegisterApiRequest {
  pushToken: string;
  deviceOs?: "IOS" | "ANDROID";
}

export interface PushTokenRegisterApiResponse {
  success: boolean;
  message: string;
}

@Service()
@Route("notifications")
export class NotificationController extends Controller {
  /**
   * [3.5] FCM/APNs 푸시 토큰 등록 API
   */
  @Post("push-token")
  @Security("jwt")
  public async registerPushToken(
    @Request() request: any,
    @Body() body: PushTokenRegisterApiRequest
  ): Promise<PushTokenRegisterApiResponse> {
    return {
      success: true,
      message: "푸시 토큰이 성공적으로 등록되었습니다.",
    };
  }
}
