import { Route, Post, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import QuickLogService from "../../services/quickLogService";
import type { AuthenticatedRequest } from "../../interfaces/express";
import {
  QuickLogApiRequest,
  QuickLogApiResponse,
  ApiResponse,
} from "../../dto";
import { BaseController } from "./BaseController";
@Service()
@Tags("3. QuickLog - 1-Tap 웰니스 퀵기록")
@Route("quick-log")
export class QuickLogController extends BaseController {
  private quickLogService = Container.get(QuickLogService);

  /**
   * 수분 섭취, 기분/감정, 일기 작성, 운동 완료 등 데일리 웰니스 항목을 1-Tap으로 원터치 기록하고 우주 연료(Fuel)를 적립합니다.
   * @param request
   * @param requestBody
   * @summary 1-Tap 웰니스 퀵기록 생성
   */
  @Post("")
  @Security("jwt")
  public async createQuickLog(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody: QuickLogApiRequest,
  ): Promise<ApiResponse<QuickLogApiResponse>> {
    const result = await this.quickLogService.createQuickLog(
      this.getUserId(request),
      requestBody,
    );
    return this.success(
      result.data,
      "퀵기록이 성공적으로 등록되었습니다.",
      201,
    );
  }
}
