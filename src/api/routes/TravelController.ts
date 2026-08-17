import { Route, Post, Get, Path, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import TravelService from "../../services/travelService";
import { handleJobSSE } from "../../utils/sseHelper";
import type express from "express";
import type { AuthenticatedRequest } from "../../interfaces/express";
import { ApiResponse } from "../../dto";
import { BaseController } from "./BaseController";
import {
  PlanetTravelStartApiRequest,
  PlanetTravelStartApiResponse,
  TravelStateInfoResponse,
  DashboardSummaryInfo,
  TravelResultDetailInfo,
  StarTravelStateResponse,
  StarTravelDepartRequest,
  StarTravelDepartResponse,
  StarTravelArriveRequest,
  StarTravelArriveResponse,
} from "../../dto";
import { toTravelResultDetailInfo } from "../../mappers";

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
   * 비동기 리포트 생성 작업 진행 상태 조회
   * @param jobId
   * @summary 비동기 리포트 작업 상태 조회
   */
  @Get("reports/jobs/{jobId}")
  @Security("jwt")
  public async getReportJobStatus(@Path() jobId: string): Promise<
    ApiResponse<{
      jobId: string;
      status: string;
      travelResultId?: string;
      reportId?: string;
      progressPercent: number;
      error?: string;
    }>
  > {
    const result = await this.travelService.getJobStatus(jobId);
    return this.success(result, "리포트 작업 상태 조회가 완료되었습니다.");
  }

  /**
   * 행성 탐사 완료 후 생성된 AI 별여행 탐사 결과 진단서(travelResult)의 상세 보고서 내용을 조회합니다.
   * @param travelResultId
   * @param request
   * @summary AI 별여행 탐사 결과 진단서 상세 조회
   */
  @Get("travel-results/{travelResultId}")
  @Security("jwt")
  public async getTravelResult(
    @Path() travelResultId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<ApiResponse<TravelResultDetailInfo>> {
    const result = await this.travelService.getTravelResultById(
      travelResultId,
      this.getUserId(request),
    );
    const data = toTravelResultDetailInfo(result);
    return this.success(data, "진단서 상세 조회가 완료되었습니다.");
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

  /**
   * 비동기 리포트 작업의 진행 상황을 Server-Sent Events(SSE)로 실시간 푸시합니다.
   * @param jobId
   * @param request
   * @summary 비동기 리포트 생성 실시간 상태 조회 (SSE)
   */
  @Get("reports/sse/{jobId}")
  public async getReportSSE(
    @Path() jobId: string,
    @Request() request: express.Request,
  ): Promise<void> {
    const res = request.res;
    if (!res) throw new Error("Express Response 객체를 찾을 수 없습니다.");

    handleJobSSE(jobId, request, res);

    // SSE 연결 유지를 위해 Promise를 해결하지 않고 대기
    return new Promise(() => {});
  }
}
