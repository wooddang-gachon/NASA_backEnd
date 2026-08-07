import { Controller, Route, Post, Get, Path, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import TravelService from "../../services/travelService";
import { getAuthenticatedUserId, type AuthenticatedRequest } from "../../interfaces/express";
import { ApiResponse } from "../../dto";

import {
  PlanetTravelStartApiRequest,
  PlanetTravelStartApiResponse,
  TravelStateInfoResponse,
  DashboardSummaryInfo,
  TravelResultDetailInfo,
} from "../../dto";
import { toTravelResultDetailInfo } from "../../mappers";

@Service()
@Tags("6. PlanetTravel - 별여행 게이미피케이션 탐사 & 진단서")
@Route("")
export class TravelController extends Controller {
  private travelService = Container.get(TravelService);

  /**
   * 보유한 우주 연료(Fuel)를 소모하여 선택한 행성으로 별여행을 출발하고, AI 탐사 결과(travelResult) 진단서를 실시간 동기 생성합니다.
   * @summary 별여행 탐사 출발 및 AI 탐사결과 생성
   */
  @Post("planet-travel/start")
  @Security("jwt")
  public async startPlanetTravel(
    @Request() request: AuthenticatedRequest,
    @Body() body: PlanetTravelStartApiRequest
  ): Promise<ApiResponse<PlanetTravelStartApiResponse>> {
    const userId = getAuthenticatedUserId(request);
    this.setStatus(200);
    const result = await this.travelService.startPlanetTravel(userId, body);
    return ApiResponse.success(result.data as PlanetTravelStartApiResponse, "별여행 탐사가 성공적으로 시작되었습니다.");
  }

  /**
   * 우주여행 현황 조회
   * @summary 우주여행 현황 조회
   */
  @Get("planet-travel/state")
  @Security("jwt")
  public async getTravelState(@Request() request: AuthenticatedRequest): Promise<ApiResponse<TravelStateInfoResponse>> {
    const userId = getAuthenticatedUserId(request);
    const result = await this.travelService.getTravelState(userId);
    return ApiResponse.success(result, "우주여행 현황 조회가 완료되었습니다.");
  }

  /**
   * 행성 탐사 완료 후 생성된 AI 별여행 탐사 결과 진단서(travelResult)의 상세 보고서 내용을 조회합니다.
   * @summary AI 별여행 탐사 결과 진단서 상세 조회
   */
  @Get("travel-results/{travelResultId}")
  @Security("jwt")
  public async getTravelResult(
    @Path() travelResultId: string,
    @Request() request: AuthenticatedRequest
  ): Promise<ApiResponse<TravelResultDetailInfo>> {
    const userId = getAuthenticatedUserId(request);
    const result = await this.travelService.getTravelResultById(travelResultId, userId);
    const data = toTravelResultDetailInfo(result);
    return ApiResponse.success(data, "진단서 상세 조회가 완료되었습니다.");
  }

  /**
   * AI 별여행 탐사 결과 진단서 상세 조회 (호환용 라우트)
   * @summary 보고서 상세 조회 (호환용)
   */
  @Get("reports/{reportId}")
  @Security("jwt")
  public async getReport(
    @Path() reportId: string,
    @Request() request: AuthenticatedRequest
  ): Promise<ApiResponse<TravelResultDetailInfo>> {
    return await this.getTravelResult(reportId, request);
  }

  /**
   * 주간 칼로리 섭취 추이 및 3대 영양소 밸런스 비율 통계 대시보드를 조회합니다.
   * @summary 웰니스 종합 대시보드 통계 조회
   */
  @Get("dashboard/summary")
  @Security("jwt")
  public async getDashboardSummary(
    @Request() request: AuthenticatedRequest
  ): Promise<ApiResponse<DashboardSummaryInfo>> {
    const userId = getAuthenticatedUserId(request);
    const dashboard = await this.travelService.getDashboard(userId, "WEEKLY");
    return ApiResponse.success(dashboard, "대시보드 통계 조회가 완료되었습니다.");
  }
}
