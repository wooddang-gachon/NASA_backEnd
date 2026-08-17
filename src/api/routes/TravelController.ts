import { Route, Post, Get, Path, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import TravelService from "../../services/travelService";
import type { AuthenticatedRequest } from "../../interfaces/express";
import { ApiResponse } from "../../dto";
import { BaseController } from "./BaseController";
import {
  DashboardSummaryInfo,
  StarTravelStateResponse,
  StarTravelDepartRequest,
  StarTravelDepartResponse,
  StarTravelArriveRequest,
  StarTravelArriveResponse,
  UnifiedPlanetReportResponse,
  MonthlyRetroReportResponse,
} from "../../dto";

@Service()
@Tags("6. PlanetTravel - 별여행 게이미피케이션 탐사 & 진단서")
@Route("")
export class TravelController extends BaseController {
  private travelService = Container.get(TravelService);

  /**
   * Star Travel 현재 상태 조회 (전역 Fuel, 4대 행성별 거리/상태, 출발 가능 행성 목록)
   * @param request
   * @summary 우주여행 현황 및 Two-Gauge 게이지 조회
   */
  @Get("planet-travel/state")
  @Security("jwt")
  public async getTravelState(
    @Request() request: AuthenticatedRequest,
  ): Promise<ApiResponse<StarTravelStateResponse>> {
    const result = await this.travelService.getStarTravelState(
      this.getUserId(request),
    );
    return this.success(result, "우주여행 현황 조회가 완료되었습니다.");
  }

  /**
   * Star Travel 별여행 출발 (Fuel 100 소모 -> 0, TRAVELING 전환)
   * @param request
   * @param body
   * @summary 별여행 출발
   */
  @Post("planet-travel/depart")
  @Security("jwt")
  public async departTravel(
    @Request() request: AuthenticatedRequest,
    @Body() body: StarTravelDepartRequest,
  ): Promise<ApiResponse<StarTravelDepartResponse>> {
    const result = await this.travelService.departStarTravel(
      this.getUserId(request),
      body,
    );
    return this.success(result, "별여행 탐사가 시작되었습니다.");
  }

  /**
   * Star Travel 별여행 도착 (해당 행성 거리 100 리셋, 비동기 AI 리포트 생성 잡 등록)
   * @param request
   * @param body
   * @summary 별여행 도착 처리
   */
  @Post("planet-travel/arrive")
  @Security("jwt")
  public async arriveTravel(
    @Request() request: AuthenticatedRequest,
    @Body() body: StarTravelArriveRequest,
  ): Promise<ApiResponse<StarTravelArriveResponse>> {
    const result = await this.travelService.arriveStarTravel(
      this.getUserId(request),
      body,
    );
    return this.success(result, "별여행 도착 처리가 완료되었습니다.");
  }

  /**
   * 별여행 AI 리포트 통합 단일 조회 (생성 진행 중 상태 및 완성된 8블록 상세 리포트 반환)
   * @param reportId 리포트 식별자 (arrive 호출 시 발급받은 reportId)
   * @param request
   * @summary 별여행 AI 리포트 단일 통합 조회
   */
  @Get("planet-travel/reports/{reportId}")
  @Security("jwt")
  public async getPlanetReport(
    @Path() reportId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<ApiResponse<UnifiedPlanetReportResponse>> {
    const result = await this.travelService.getUnifiedPlanetReport(
      reportId,
      this.getUserId(request),
    );
    return this.success(result, "별여행 리포트 조회가 완료되었습니다.");
  }

  /**
   * 🌙 회고별 월간 종합 리포트 조회 (미발행 시 Tier 2 온디맨드 자동 백필 실행)
   * @param yearMonth 조회 년월 (예: "2026-07")
   * @param request
   * @summary 🌙 회고별 월간 종합 리포트 조회
   */
  @Get("planet-travel/reports/monthly/{yearMonth}")
  @Security("jwt")
  public async getMonthlyRetroReport(
    @Path() yearMonth: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<ApiResponse<MonthlyRetroReportResponse>> {
    const result = await this.travelService.getMonthlyRetroReport(
      this.getUserId(request),
      yearMonth,
    );
    return this.success(result, "월간 회고 리포트 조회가 완료되었습니다.");
  }

  /**
   * 주간 칼로리 섭취 추이 및 3대 영양소 밸런스 비율 통계 대시보드를 조회합니다.
   * @param request
   * @summary 웰니스 종합 대시보드 통계 조회
   */
  @Get("dashboard/summary")
  @Security("jwt")
  public async getDashboardSummary(
    @Request() request: AuthenticatedRequest,
  ): Promise<ApiResponse<DashboardSummaryInfo>> {
    const dashboard = await this.travelService.getDashboard(
      this.getUserId(request),
      "WEEKLY",
    );
    return this.success(dashboard, "대시보드 통계 조회가 완료되었습니다.");
  }
}
