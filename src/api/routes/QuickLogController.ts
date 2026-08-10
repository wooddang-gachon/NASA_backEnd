import { Controller, Route, Post, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import QuickLogService from "../../services/quickLogService";
import { getAuthenticatedUserId, type AuthenticatedRequest } from "../../interfaces/express";
import { QuickLogApiRequest, QuickLogApiResponse } from "../../dto";
import { ApiResponse } from "../../dto";

@Service()
@Tags("3. QuickLog - 1-Tap 웰니스 퀵기록")
@Route("quick-log")
export class QuickLogController extends Controller {
  private quickLogService = Container.get(QuickLogService);

  /**
   * 수분 섭취, 기분/감정, 일기 작성, 운동 완료 등 데일리 웰니스 항목을 1-Tap으로 원터치 기록하고 우주 연료(Fuel)를 적립합니다.
   * @summary 1-Tap 웰니스 퀵기록 생성
   */
  @Post("")
  @Security("jwt")
  public async createQuickLog(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody: QuickLogApiRequest
  ): Promise<ApiResponse<QuickLogApiResponse>> {
    if (requestBody.category === "WATER" && (requestBody.amount === undefined || requestBody.amount < 0)) {
      this.setStatus(400);
      return ApiResponse.error("수분 섭취량은 0 이상이어야 합니다.", 400) as any;
    }
    const userId = getAuthenticatedUserId(request);
    this.setStatus(201);
    const result = await this.quickLogService.createQuickLog(userId, requestBody);
    return ApiResponse.success(result.data, "퀵기록이 성공적으로 등록되었습니다.", 201);
  }
}

