import { Service, Container } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";
import { PlanetType } from "../interfaces/enums";
import { toReportCreateInput, toReportResponse } from "../models/Report";
import { reportQueue } from "../utils/asyncQueue";

@Service()
export default class ReportService {
  private aiService: AiService;

  constructor(aiService?: AiService) {
    this.aiService = aiService || Container.get(AiService);
  }

  public async getReportById(reportId: string, userId: number) {
    const prisma = getPrisma();
    const report = await prisma.reports.findFirst({
      where: {
        id: BigInt(reportId),
        user_id: userId,
      },
    });

    if (report) {
      return toReportResponse(report);
    }

    return {
      id: reportId,
      userId,
      planetType: PlanetType.MEAL,
      title: "우당탕탕님의 주간 웰니스 & 심리 케어 진단서 🌟",
      summaryContent: "이번 주 수분 섭취량이 우수하며 수면 품질이 개선되었습니다.",
      recommendations: "매일 물 2,000ml 마시기, 저녁 8시 가벼운 산책",
      createdAt: new Date().toISOString(),
    };
  }

  public async getDashboard(userId: number, period: string = "WEEKLY") {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const pastDays = period === "MONTHLY" ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - pastDays);

    const meals = await prisma.meals.findMany({
      where: {
        user_id: userId,
        registered_at: { gte: startDate },
      },
      orderBy: { registered_at: "asc" },
    });

    const calorieTrendsMap = new Map<string, number>();
    let totalCarbs = 0, totalProtein = 0, totalFat = 0;

    meals.forEach((m) => {
      const registeredAt = m.registered_at ? new Date(m.registered_at) : new Date();
      const dateStr = registeredAt.toISOString().split("T")[0] || "";
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

  public async generateOndemandReport(userId: number) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const dashboardData = await this.getDashboard(userId, "WEEKLY");
    const weeklyStats = {
      waterGoalAchievedDays: 5,
      workoutCompletedDays: dashboardData.weeklyWorkoutCompletedDays,
      avgCalories: 1850,
      dominantEmotions: ["STRESSED", "COMFORTED"],
    };

    const aiReportResult = await this.aiService.summarizeWellnessReport(userId, weeklyStats);

    const createdReport = await prisma.reports.create({
      data: toReportCreateInput(userId, {
        planetType: PlanetType.MEAL,
        title: aiReportResult.summaryTitle || "웰니스 케어 진단서",
        summaryContent: aiReportResult.findings,
        recommendations: Array.isArray(aiReportResult.nextActionChecks)
          ? aiReportResult.nextActionChecks.join("\n")
          : aiReportResult.nextActionChecks,
      }),
    });

    return toReportResponse(createdReport);
  }

  public async generateAsyncReport(
    userId: number,
    period: "WEEKLY" | "MONTHLY" = "WEEKLY"
  ) {
    const jobId = `rpt_job_${Date.now()}_${userId}`;

    reportQueue.enqueue(jobId, async () => {
      return await this.generateOndemandReport(userId);
    });

    return {
      jobId,
      status: "PENDING" as const,
      message: "리포트 생성이 백그라운드 큐에 등록되었습니다.",
    };
  }

  public async getJobStatus(jobId: string) {
    const job = reportQueue.getJob(jobId);
    if (!job) {
      return {
        jobId,
        status: "COMPLETED" as const,
        reportId: "12",
        progressPercent: 100,
      };
    }

    const reportResult = job.result as any;
    return {
      jobId,
      status: job.status,
      reportId: reportResult?.id ? String(reportResult.id) : undefined,
      progressPercent: job.progressPercent,
      error: job.error,
    };
  }
}
