import { Controller, Route, Get, Post, Query, Body } from "tsoa";
import { Service } from "typedi";
import ReportService from "../../services/reportService";
import type { DashboardResponse, OndemandReportRequest, OndemandReportResponse } from "../../interfaces";

@Service()
@Route("reports")
export class ReportController extends Controller {
  constructor(private reportService: ReportService) {
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
   * 온디맨드 AI 타미 종합 건강 리포트 동적 생성
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
