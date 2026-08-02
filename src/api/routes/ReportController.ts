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
   * 지정한 년월의 건강 데이터를 집계하여 분석 리포트를 제공합니다.
   */
  @Get("monthly")
  public async getMonthlyReport(
    @Query() userId: number,
    @Query() yearMonth: string
  ): Promise<MonthlyReportResponse> {
    return await this.reportService.generateMonthlyReport(userId, yearMonth);
  }
}
