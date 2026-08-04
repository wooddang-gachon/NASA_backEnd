import { Controller, Route, Get, Post, Query, Body, Path, Security, Request } from "tsoa";
import { Service, Container } from "typedi";
import ReportService from "../../services/reportService";
import type {
  DashboardResponse,
  OndemandReportRequest,
  OndemandReportResponse,
  AsyncReportGenerateRequest,
  AsyncReportGenerateResponse,
  ReportJobStatusResponse,
  ReportDetailResponse,
} from "../../interfaces";

@Service()
@Route("reports")
export class ReportController extends Controller {
  private reportService = Container.get(ReportService);

  constructor() {
    super();
  }

  /**
   * 상시 웰니스 그래프 대시보드 조회
   */
  @Get("dashboard")
  public async getDashboard(
    @Query() userId: number,
    @Query() period?: "WEEKLY" | "MONTHLY"
  ): Promise<DashboardResponse> {
    return await this.reportService.getDashboard(userId, period || "WEEKLY");
  }

  /**
   * 온디맨드 AI 종합 리포트 비동기 백그라운드 생성 요청
   */
  @Post("generate")
  @Security("jwt")
  public async generateReport(
    @Request() request: any,
    @Body() requestBody?: AsyncReportGenerateRequest
  ): Promise<AsyncReportGenerateResponse> {
    const userId = request.currentUser?.userId || 1;
    this.setStatus(202);
    return await this.reportService.generateAsyncReport(userId, requestBody?.period || "WEEKLY");
  }

  /**
   * 리포트 백그라운드 생성 작업 상태 조회
   */
  @Get("jobs/{jobId}")
  public async getJobStatus(@Path() jobId: string): Promise<ReportJobStatusResponse> {
    return await this.reportService.getJobStatus(jobId);
  }

  /**
   * 생성 완료된 리포트 상세 조회
   */
  @Get("{reportId}")
  @Security("jwt")
  public async getReport(
    @Path() reportId: number,
    @Request() request: any
  ): Promise<ReportDetailResponse> {
    const userId = request.currentUser?.userId || 1;
    return await this.reportService.getReportById(reportId, userId);
  }

  /**
   * 온디맨드 AI 타미 종합 건강 리포트 동적 생성 (동기)
   */
  @Post("ondemand")
  public async generateOndemandReport(
    @Body() requestBody: OndemandReportRequest
  ): Promise<OndemandReportResponse> {
    return await this.reportService.generateOndemandReport(requestBody.userId);
  }

  /**
   * 호환성용 메서드
   */
  public async generateMonthlyReport(userId: number): Promise<OndemandReportResponse> {
    return await this.reportService.generateOndemandReport(userId);
  }
}
