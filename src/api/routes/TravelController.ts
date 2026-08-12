import { Route, Post, Get, Path, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import TravelService from "../../services/travelService";
import { reportQueue } from "../../utils/asyncQueue";
import type { AuthenticatedRequest } from "../../interfaces/express";
import { ApiResponse } from "../../dto";
import { BaseController } from "./BaseController";
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
export class TravelController extends BaseController {
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
    const result = await this.travelService.startPlanetTravel(this.getUserId(request), body);
    return this.success(result, "별여행 탐사가 성공적으로 시작되었습니다.");
  }

  /**
   * 우주여행 현황 조회
   * @summary 우주여행 현황 조회
   */
  @Get("planet-travel/state")
  @Security("jwt")
  public async getTravelState(@Request() request: AuthenticatedRequest): Promise<ApiResponse<TravelStateInfoResponse>> {
    const result = await this.travelService.getTravelState(this.getUserId(request));
    return this.success(result, "우주여행 현황 조회가 완료되었습니다.");
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
    const result = await this.travelService.getTravelResultById(travelResultId, this.getUserId(request));
    const data = toTravelResultDetailInfo(result);
    return this.success(data, "진단서 상세 조회가 완료되었습니다.");
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
    const dashboard = await this.travelService.getDashboard(this.getUserId(request), "WEEKLY");
    return this.success(dashboard, "대시보드 통계 조회가 완료되었습니다.");
  }

  /**
   * 비동기 리포트 작업의 진행 상황을 Server-Sent Events(SSE)로 실시간 푸시합니다.
   * @summary 비동기 리포트 생성 실시간 상태 조회 (SSE)
   */
  @Get("reports/sse/{jobId}")
  public async getReportSSE(
    @Path() jobId: string,
    @Request() request: any
  ): Promise<void> {
    const res = request.res;
    if (!res) throw new Error("Express Response 객체를 찾을 수 없습니다.");

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
    res.write(`data: ${JSON.stringify({ status: "CONNECTED", message: "SSE 연결 성공" })}\n\n`);

    const onUpdate = (job: any) => {
      if (job.id === jobId) {
        res.write(`data: ${JSON.stringify(job)}\n\n`);
        if (job.status === "COMPLETED" || job.status === "FAILED") {
          res.end();
          reportQueue.off("job_updated", onUpdate);
        }
      }
    };

    reportQueue.on("job_updated", onUpdate);

    // 즉시 현재 상태 전송
    const currentJob = reportQueue.getJob(jobId);
    if (currentJob) {
      res.write(`data: ${JSON.stringify(currentJob)}\n\n`);
      if (currentJob.status === "COMPLETED" || currentJob.status === "FAILED") {
        res.end();
        reportQueue.off("job_updated", onUpdate);
        return;
      }
    }

    // 클라이언트 연결 종료 시 리스너 해제
    request.on("close", () => {
      reportQueue.off("job_updated", onUpdate);
    });

    // SSE 연결 유지를 위해 Promise를 해결하지 않고 대기
    return new Promise(() => {});
  }
}
