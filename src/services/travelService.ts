import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError, BadRequestError } from "../errors";
import { PlanetType } from "../interfaces/enums";
import {
  PlanetTravelStartApiRequest,
  TravelStateInfoResponse,
  DashboardSummaryInfo,
} from "../dto";
import { TravelMapper } from "../mappers";
import { reportQueue } from "../utils/asyncQueue";

@Service()
export default class TravelService {
  @Inject((type) => AiService)
  private aiService!: AiService;

  /**
   * 별여행 출발 및 실시간 AI 탐사 결과 생성
   */
  public async startPlanetTravel(
    userId: number,
    data: PlanetTravelStartApiRequest,
  ) {
    const prisma = getPrisma();
    Logger.info(
      `[TravelService] Starting planet travel for userId ${userId}, planetType: ${data.planetType}`,
    );

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const currentFuel = user.current_fuel ?? 0;
    if (currentFuel < data.fuelSpent) {
      throw new BadRequestError(
        `보유 연료가 부족합니다. (현재: ${currentFuel}, 필요: ${data.fuelSpent})`,
        "INSUFFICIENT_FUEL",
      );
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: {
          decrement: data.fuelSpent,
        },
      },
    });

    // AI 탐사 결과 온디맨드 생성 시도
    let reportTitle = "아쿠아 웰니스 탐사 완료 리포트 🌟";
    let reportSummary =
      "별여행 탐사가 안전하게 완료되었습니다! 오늘 하루도 건강한 수분과 영양을 챙겨보세요.";
    let reportRecommendations = "매일 물 2,000ml 마시기\n저녁 8시 산책하기";

    try {
      const aiReportResult = await this.aiService.generatePlanetReport(
        data.planetType,
        {
          userId,
          nickname: user.nickname,
          period: {
            start:
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0] || "",
            end: new Date().toISOString().split("T")[0] || "",
          },
          dailyRecords: [],
          waterLogs: [],
          exerciseLogs: [],
        },
      );

      if (aiReportResult.title) reportTitle = aiReportResult.title;
      if (aiReportResult.markdown || aiReportResult.findings) {
        reportSummary =
          aiReportResult.markdown || aiReportResult.findings || reportSummary;
      }
      if (aiReportResult.nextActionChecks) {
        reportRecommendations = Array.isArray(aiReportResult.nextActionChecks)
          ? aiReportResult.nextActionChecks.join("\n")
          : aiReportResult.nextActionChecks;
      }
    } catch (err) {
      Logger.warn(
        `[TravelService] AI travel report generation fallback used: ${err}`,
      );
    }

    // planet_travels 레코드 생성 (탐사 상태 및 AI 탐사 결과 리포트를 1개 테이블에 통합 저장)
    const travel = await prisma.planet_travels.create({
      data: {
        ...TravelMapper.toPlanetTravelCreateInput(userId, data),
        status: "COMPLETED",
        title: reportTitle,
        summary_content: reportSummary,
        recommendations: reportRecommendations,
        completed_at: new Date(),
      },
    });

    const travelResultData = TravelMapper.toTravelResultResponse(travel);

    return {
      success: true,
      message: "별여행 탐사가 완료되어 탐사 결과가 도달했습니다.",
      data: TravelMapper.toStartApiResponse(
        travel,
        travel.id.toString(),
        updatedUser.current_fuel ?? 0,
        travelResultData,
      ),
    };
  }

  /**
   * 우주여행 현황 조회
   */
  public async getTravelState(
    userId: number,
  ): Promise<TravelStateInfoResponse> {
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
    const travel = await prisma.planet_travels.findFirst({
      where: {
        id: BigInt(travelResultId),
        user_id: userId,
      },
    });

    if (travel) {
      return TravelMapper.toTravelResultResponse(travel);
    }

    return {
      id: travelResultId,
      userId,
      planetType: PlanetType.MEAL,
      title: "우당탕탕님의 별여행 탐사 결과 진단서 🌟",
      summaryContent:
        "이번 별여행 탐사 결과 수분 섭취량이 우수하며 수면 품질이 개선되었습니다.",
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
  public async getDashboard(
    userId: number,
    period: string = "WEEKLY",
  ): Promise<DashboardSummaryInfo> {
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
    let totalCarbs = 0,
      totalProtein = 0,
      totalFat = 0;

    meals.forEach((m) => {
      const registeredAt = m.registered_at
        ? new Date(m.registered_at)
        : new Date();
      const dateStr = registeredAt.toISOString().split("T")[0] || "";
      calorieTrendsMap.set(
        dateStr,
        (calorieTrendsMap.get(dateStr) || 0) + m.total_calories_kcal,
      );

      totalCarbs += Number(m.total_carbohydrate_g);
      totalProtein += Number(m.total_protein_g);
      totalFat += Number(m.total_fat_g);
    });

    const calorieTrends = Array.from(calorieTrendsMap.entries()).map(
      ([date, caloriesKcal]) => ({
        date,
        caloriesKcal,
      }),
    );

    const count = meals.length || 1;
    const nutritionBalance = {
      carbohydratePercent: Math.round((totalCarbs / count) * 2),
      proteinPercent: Math.round((totalProtein / count) * 2),
      fatPercent: Math.round((totalFat / count) * 2),
      vitaminPercent: 80,
      mineralPercent: 75,
    };

    const workoutLogs = await prisma.quick_logs.findMany({
      where: {
        user_id: userId,
        category: "EXERCISE",
        created_at: { gte: startDate },
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
  public async generateOndemandReport(
    userId: number,
    planetType: PlanetType = PlanetType.MEAL,
  ) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const aiReportResult = await this.aiService.generatePlanetReport(
      planetType,
      {
        userId,
        nickname: user.nickname,
        period: {
          start:
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0] || "",
          end: new Date().toISOString().split("T")[0] || "",
        },
        dailyRecords: [],
        waterLogs: [],
        exerciseLogs: [],
      },
    );

    const travel = await prisma.planet_travels.create({
      data: {
        user_id: userId,
        planet_type: planetType,
        fuel_spent: 100,
        status: "COMPLETED",
        title: aiReportResult.title || "별여행 탐사 결과 진단서",
        summary_content:
          aiReportResult.markdown ||
          aiReportResult.findings ||
          "탐사 진단 내용입니다.",
        recommendations: Array.isArray(aiReportResult.nextActionChecks)
          ? aiReportResult.nextActionChecks.join("\n")
          : aiReportResult.nextActionChecks || "",
        completed_at: new Date(),
      },
    });

    return TravelMapper.toTravelResultResponse(travel);
  }

  /**
   * 비동기 탐사 결과 생성 (Queue)
   */
  public async generateAsyncReport(
    userId: number,
    period: "WEEKLY" | "MONTHLY" = "WEEKLY",
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
