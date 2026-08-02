import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "@/loaders/prisma";
import Logger from "@/loaders/logger";
import { UserNotFoundError } from "@/utils/errors";
import type { DashboardResponse, OndemandReportResponse } from "@/interfaces";

@Service()
export default class ReportService {
  constructor(@Inject() private aiService: AiService) {}

  /**
   * 상시 웰니스 그래프 대시보드 데이터 조회
   */
  public async getDashboard(userId: number, period: string = "WEEKLY"): Promise<DashboardResponse> {
    const prisma = getPrisma();

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const pastDays = period === "MONTHLY" ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - pastDays);

    // 1. 식단 칼로리 추이 및 5대 영양소 데이터 수집
    const meals = await prisma.meals.findMany({
      where: {
        user_id: userId,
        registered_at: { gte: startDate },
      },
      orderBy: { registered_at: "asc" },
    });

    const calorieTrendsMap = new Map<string, number>();
    let totalCarbs = 0, totalProtein = 0, totalFat = 0;

    meals.forEach((m: any) => {
      const dateStr = m.registered_at.toISOString().split("T")[0];
      calorieTrendsMap.set(dateStr, (calorieTrendsMap.get(dateStr) || 0) + m.total_calories_kcal);

      totalCarbs += Number(m.total_carbohydrate_g);
      totalProtein += Number(m.total_protein_g);
      totalFat += Number(m.total_fat_g);
    });

    const calorieTrends = Array.from(calorieTrendsMap.entries()).map(([date, caloriesKcal]) => ({
      date,
      caloriesKcal,
    }));

    const count = meals.length || 1;
    const nutritionBalance = {
      carbohydratePercent: Math.round((totalCarbs / count) * 2),
      proteinPercent: Math.round((totalProtein / count) * 2),
      fatPercent: Math.round((totalFat / count) * 2),
      vitaminPercent: 80,
      mineralPercent: 75,
    };

    // 2. 주간 운동 완료 횟수
    const workoutLogs = await prisma.exercise_logs.findMany({
      where: {
        user_id: userId,
        performed_at: { gte: startDate },
      },
    });

    return {
      calorieTrends,
      nutritionBalance,
      weeklyWorkoutCompletedDays: workoutLogs.length,
    };
  }

  /**
   * 온디맨드 AI 타미 종합 건강 리포트 동적 생성
   */
  public async generateOndemandReport(userId: number): Promise<OndemandReportResponse> {
    const prisma = getPrisma();

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    // 1. 누적 웰니스 데이터 수집
    const dashboardData = await this.getDashboard(userId, "WEEKLY");

    const weeklyStats = {
      waterGoalAchievedDays: 5,
      workoutCompletedDays: dashboardData.weeklyWorkoutCompletedDays,
      avgCalories: 1850,
      dominantEmotions: ["STRESSED", "COMFORTED"],
    };

    // 2. BE -> AI 요약 서버 내부 통신 호출
    const aiReportResult = await this.aiService.summarizeWellnessReport(userId, weeklyStats);

    const yearMonth = new Date().toISOString().slice(0, 7);

    // 3. 생성된 리포트 DB 저장
    const report = await prisma.monthly_reports.upsert({
      where: {
        user_id_report_year_month: {
          user_id: userId,
          report_year_month: yearMonth,
        },
      },
      update: {
        summary_content: aiReportResult.findings,
        aggregated_data: JSON.stringify(aiReportResult.nextActionChecks),
      },
      create: {
        user_id: userId,
        report_year_month: yearMonth,
        summary_content: aiReportResult.findings,
        aggregated_data: JSON.stringify(aiReportResult.nextActionChecks),
      },
    });

    return {
      reportId: report.id,
      generatedAt: report.created_at.toISOString(),
      summaryTitle: aiReportResult.summaryTitle,
      findings: report.summary_content || aiReportResult.findings,
      nextActionChecks: aiReportResult.nextActionChecks,
    };
  }
}
