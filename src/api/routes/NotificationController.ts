import { Controller, Route, Post, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import NotificationService from "../../services/notificationService";
import { getAuthenticatedUserId, type AuthenticatedRequest } from "../../interfaces/express";
import { ApiResponse } from "../../dto";
import type {
  PushTokenRegisterRequest,
  PushTokenRegisterResponse,
} from "../../dto";

@Service()
@Tags("8. Notification - 푸시 알림 및 디바이스 토큰")
@Route("notifications")
export class NotificationController extends Controller {
  private notificationService = Container.get(NotificationService);

  /**
   * 모바일 앱 디바이스의 FCM 푸시 알림 토큰을 등록하여 탐사 결과 알림을 발송받습니다.
   * @summary FCM 디바이스 푸시 토큰 등록
   */
  @Post("push-token")
  @Security("jwt")
  public async registerPushToken(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody: PushTokenRegisterRequest
  ): Promise<ApiResponse<PushTokenRegisterResponse>> {
    const userId = getAuthenticatedUserId(request);
    this.setStatus(200);
    const result = await this.notificationService.registerPushToken(userId, requestBody);
    return ApiResponse.success(result, "푸시 토큰 등록이 완료되었습니다.");
  }
}

