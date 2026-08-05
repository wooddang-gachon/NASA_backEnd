import { Controller, Route, Get, Path, Security, Request } from "tsoa";
import { Service, Container } from "typedi";
import ReportService from "../../services/reportService";

export interface CalorieTrendItem {
  date: string;
  caloriesKcal: number;
}

export interface DashboardSummaryInfo {
  calorieTrends: CalorieTrendItem[];
  nutritionBalance: {
    carbohydratePercent: number;
    proteinPercent: number;
    fatPercent: number;
    vitaminPercent: number;
    mineralPercent: number;
  };
  weeklyWorkoutCompletedDays: number;
}

export interface ReportDetailInfo {
  reportId: string;
  userId: number;
  title: string;
  summaryContent: string;
  recommendations: string[];
  createdAt: string;
}

@Service()
@Route("")
export class ReportController extends Controller {
  private reportService = Container.get(ReportService);

  /**
   * [3.3] AI 리포트 상세 조회 API
   */
  @Get("reports/{reportId}")
  @Security("jwt")
  public async getReport(
    @Path() reportId: string,
    @Request() request: any
  ): Promise<{ success: boolean; data: ReportDetailInfo }> {
    const userId = request.currentUser?.userId || 1;
    return {
      success: true,
      data: {
        reportId,
        userId,
        title: "우당탕탕님의 주간 웰니스 & 심리 케어 진단서 🌟",
        summaryContent: "이번 주 수분 섭취량이 우수하며 수면 품질이 개선되었습니다.",
        recommendations: ["매일 물 2,000ml 마시기", "저녁 8시 가벼운 산책"],
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * [3.5] 대시보드 요약 조회 API
   */
  @Get("dashboard/summary")
  @Security("jwt")
  public async getDashboardSummary(
    @Request() request: any
  ): Promise<{ success: boolean; data: DashboardSummaryInfo }> {
    const userId = request.currentUser?.userId || 1;
    const dashboard = await this.reportService.getDashboard(userId, "WEEKLY");
    return {
      success: true,
      data: dashboard,
    };
  }
}
