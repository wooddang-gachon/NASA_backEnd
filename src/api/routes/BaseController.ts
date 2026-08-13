import { Controller } from "tsoa";
import { ApiResponse } from "../../dto";
import {
  getAuthenticatedUserId,
  type AuthenticatedRequest,
} from "../../interfaces/express";

export abstract class BaseController extends Controller {
  /**
   * 성공 응답 객체 생성 및 HTTP 상태 코드 설정 헬퍼
   * @param data
   * @param message
   * @param statusCode
   */
  protected success<T>(
    data: T,
    message?: string,
    statusCode: number = 200,
  ): ApiResponse<T> {
    if (statusCode !== 200) {
      this.setStatus(statusCode);
    }
    return ApiResponse.success(data, message, statusCode);
  }

  /**
   * 인증된 요청 객체에서 유저 ID 추출 헬퍼
   * @param request
   */
  protected getUserId(request: AuthenticatedRequest): number {
    return getAuthenticatedUserId(request);
  }
}
