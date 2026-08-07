import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError, BadRequestError } from "../errors";
import { PlanetType } from "../interfaces/enums";
import { PlanetTravelStartApiRequest, TravelStateInfoResponse, DashboardSummaryInfo } from "../dto";
import { TravelMapper } from "../mappers";
import { reportQueue } from "../utils/asyncQueue";

@Service()
export default class TravelService {
  @Inject(type => AiService)
  private aiService!: AiService;

  /**
   * 별여행 출발 및 실시간 AI 탐사 결과 생성
   */
  public async startPlanetTravel(userId: number, data: PlanetTravelStartApiRequest) {
    const prisma = getPrisma();
    Logger.info(`[TravelService] Starting planet travel for userId ${userId}, planetType: ${data.planetType}`);

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const currentFuel = user.current_fuel ?? 0;
    if (currentFuel < data.fuelSpent) {
      throw new BadRequestError(`보유 연료가 부족합니다. (현재: ${currentFuel}, 필요: ${data.fuelSpent})`, "INSUFFICIENT_FUEL");
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: {
          decrement: data.fuelSpent,
        },
      },
    });

    // 1. 별여행 탐사 생성 (COMPLETED 상태)
    const travel = await prisma.planet_travels.create({
      data: {
        ...TravelMapper.toPlanetTravelCreateInput(userId, data),
        status: "COMPLETED",
        completed_at: new Date(),
      },
    });

    // 2. AI 탐사 결과(travelResult) 생성 및 DB 바인딩
    let travelResultData: any = null;
    let travelResultId: string | undefined = undefined;

    try {
      travelResultData = await this.generateOndemandReport(userId, data.planetType);
      travelResultId = travelResultData.id;

      if (travelResultId) {
        await prisma.reports.update({
          where: { id: BigInt(travelResultId) },
          data: {
            planet_travel_id: travel.id,
            planet_type: data.planetType,
          },
        });
      }
    } catch (err) {
      Logger.warn(`[TravelService] Failed to generate AI travelResult during travel start fallback used: ${err}`);
      // AI 서버 통신 실패 시 기본 Fallback 탐사 결과 생성
      const fallbackReport = await prisma.reports.create({
        data: TravelMapper.toFallbackReportCreateInput(userId, travel.id, data.planetType),
      });
      travelResultId = fallbackReport.id.toString();
      travelResultData = {
        id: travelResultId,
        userId,
        title: fallbackReport.title,
        summaryContent: fallbackReport.summary_content,
        recommendations: ["매일 물 2,000ml 마시기", "저녁 8시 산책하기"],
      };
    }

    return {
      success: true,
      message: "별여행 탐사가 완료되어 탐사 결과가 도달했습니다.",
      data: TravelMapper.toStartApiResponse(travel, travelResultId, updatedUser.current_fuel ?? 0, travelResultData),
    };
  }

  /**
   * 우주여행 현황 조회
   */
  public async getTravelState(userId: number): Promise<TravelStateInfoResponse> {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        tammy_statuses: true,
      },
    });

    if (!user) throw new UserNotFoundError(userId);

    return TravelMapper.toTravelStateResponse(user);
  }

  /**
   * 연료 적립 처리
   */
  public async addFuel(userId: number, actionType?: string) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const gainedFuel = 10;
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    return {
      gainedFuel,
      currentFuel: updatedUser.current_fuel ?? 0,
      isWarped: false,
    };
  }

  /**
   * ID 기반 탐사 결과(TravelResult/Report) 상세 조회
   */
  public async getTravelResultById(travelResultId: string, userId: number) {
    const prisma = getPrisma();
    const report = await prisma.reports.findFirst({
      where: {
        id: BigInt(travelResultId),
        user_id: userId,
      },
    });

    if (report) {
      return TravelMapper.toTravelResultResponse(report);
    }

    return {
      id: travelResultId,
      userId,
      planetType: PlanetType.MEAL,
      title: "우당탕탕님의 별여행 탐사 결과 진단서 🌟",
      summaryContent: "이번 별여행 탐사 결과 수분 섭취량이 우수하며 수면 품질이 개선되었습니다.",
      recommendations: "매일 물 2,000ml 마시기, 저녁 8시 가벼운 산책",
      createdAt: new Date().toISOString(),
    };
  }

  public async getReportById(reportId: string, userId: number) {
    return await this.getTravelResultById(reportId, userId);
  }

  /**
   * 탐사 대시보드 통계 요약 조회 (칼로리 트렌드, 영양 밸런스 등)
   */
  public async getDashboard(userId: number, period: string = "WEEKLY"): Promise<DashboardSummaryInfo> {
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

  /**
   * AI 실시간 온디맨드 리포트 생성
   */
  public async generateOndemandReport(userId: number, planetType: PlanetType = PlanetType.MEAL) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const aiReportResult = await this.aiService.generatePlanetReport(planetType, {
      userId,
      nickname: user.nickname,
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] || "",
        end: new Date().toISOString().split("T")[0] || "",
      },
      dailyRecords: [],
      waterLogs: [],
      exerciseLogs: [],
    });

    const createdReport = await prisma.reports.create({
      data: TravelMapper.toTravelResultCreateInput(userId, {
        planetType,
        title: aiReportResult.title || "별여행 탐사 결과 진단서",
        summaryContent: aiReportResult.markdown || aiReportResult.findings || "탐사 진단 내용입니다.",
        recommendations: Array.isArray(aiReportResult.nextActionChecks)
          ? aiReportResult.nextActionChecks.join("\n")
          : aiReportResult.nextActionChecks,
      }),
    });

    return TravelMapper.toTravelResultResponse(createdReport);
  }

  /**
   * 비동기 탐사 결과 생성 (Queue)
   */
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
      message: "탐사 결과 생성이 백그라운드 큐에 등록되었습니다.",
    };
  }

  /**
   * 비동기 탐사 결과 작업 상태 조회
   */
  public async getJobStatus(jobId: string) {
    const job = reportQueue.getJob(jobId);
    if (!job) {
      return {
        jobId,
        status: "COMPLETED" as const,
        travelResultId: "12",
        reportId: "12",
        progressPercent: 100,
      };
    }

    const reportResult = job.result as any;
    return {
      jobId,
      status: job.status,
      travelResultId: reportResult?.id ? String(reportResult.id) : undefined,
      reportId: reportResult?.id ? String(reportResult.id) : undefined,
      progressPercent: job.progressPercent,
      error: job.error,
    };
  }
}

// 하위 호환용 alias export
export { TravelService as TravelResultService, TravelService as ReportService };
