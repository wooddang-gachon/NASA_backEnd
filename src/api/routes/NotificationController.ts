import { Controller, Route, Post, Body, Security, Request } from "tsoa";
import { Service } from "typedi";
import type { PushTokenRegisterRequest, PushTokenRegisterResponse } from "../../interfaces";

@Service()
@Route("notifications")
export class NotificationController extends Controller {

  /**
   * Push Notification 디바이스 토큰 등록 (FCM/APNs)
   */
  @Post("push-token")
  @Security("jwt")
  public async registerPushToken(
    @Request() request: any,
    @Body() requestBody: PushTokenRegisterRequest
  ): Promise<PushTokenRegisterResponse> {
    const userId = request.currentUser?.userId || 1;
    // TODO: 백엔드 DB/Notification Service에 디바이스 토큰 저장
    return {
      success: true,
      message: "푸시 알림 디바이스 토큰이 성공적으로 등록되었습니다.",
    };
  }
}
