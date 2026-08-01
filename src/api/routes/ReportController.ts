import { Controller, Route, Get, Query } from "tsoa";
import { Service } from "typedi";
import ReportService from "../../services/reportService";
import { MonthlyReportResponse } from "../../interfaces";

@Service()
@Route("reports")
export class ReportController extends Controller {
  constructor(private reportService: ReportService) {
    super();
  }

  /**
   * 지정한 년월에 대한 사용자의 건강 데이터를 종합 분석하여 리포트를 제공합니다.
   */
  @Get("monthly")
  public async getMonthlyReport(
    @Query() userId: number,
    @Query() yearMonth: string
  ): Promise<MonthlyReportResponse> {
    return await this.reportService.generateMonthlyReport(userId, yearMonth);
  }
}
