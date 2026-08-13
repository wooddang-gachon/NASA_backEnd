import { Route, Post, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import NotificationService from "../../services/notificationService";
import type { AuthenticatedRequest } from "../../interfaces/express";
import { ApiResponse } from "../../dto";
import { BaseController } from "./BaseController";
import type {
  PushTokenRegisterRequest,
  PushTokenRegisterResponse,
} from "../../dto";

@Service()
@Tags("8. Notification - 푸시 알림 및 디바이스 토큰")
@Route("notifications")
export class NotificationController extends BaseController {
  private notificationService = Container.get(NotificationService);

  /**
   * 모바일 앱 디바이스의 FCM 푸시 알림 토큰을 등록하여 탐사 결과 알림을 발송받습니다.
   * @param request
   * @param requestBody
   * @summary FCM 디바이스 푸시 토큰 등록
   */
  @Post("push-token")
  @Security("jwt")
  public async registerPushToken(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody: PushTokenRegisterRequest,
  ): Promise<ApiResponse<PushTokenRegisterResponse>> {
    const result = await this.notificationService.registerPushToken(
      this.getUserId(request),
      requestBody,
    );
    return this.success(result, "푸시 토큰 등록이 완료되었습니다.");
  }
}
