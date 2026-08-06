import { Controller, Route, Post, Body, Security, Request } from "tsoa";
import { Service, Container } from "typedi";
import NotificationService from "../../services/notificationService";
import type {
  PushTokenRegisterRequest,
  PushTokenRegisterResponse,
} from "../../interfaces";

@Service()
@Route("notifications")
export class NotificationController extends Controller {
  private notificationService = Container.get(NotificationService);

  /**
   * [3.6 / RPT-003] 디바이스 푸시 토큰 등록 API (리포트 생성 완료 알림용)
   */
  @Post("push-token")
  @Security("jwt")
  public async registerPushToken(
    @Request() request: any,
    @Body() requestBody: PushTokenRegisterRequest
  ): Promise<PushTokenRegisterResponse> {
    const userId = request.currentUser?.userId || 1;
    this.setStatus(200);
    return await this.notificationService.registerPushToken(userId, requestBody);
  }
}
