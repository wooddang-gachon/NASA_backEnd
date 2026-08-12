import { Service, Inject } from "typedi";
import { FUEL_REWARDS, REPORT_FUEL_COST, PLANET_CONFIGS, TOTAL_TARGET_DISTANCE } from "@/constants/gamification";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import TravelRepository from "../repositories/TravelRepository";
import { UserNotFoundError, BadRequestError } from "../errors";
import { PlanetType } from "../interfaces/enums";
import {
  PlanetTravelStartApiRequest,
  PlanetTravelStartApiResponse,
  TravelStateInfoResponse,
  DashboardSummaryInfo,
  FuelAddApiResponse,
  PlanetStateItem,
} from "../dto";
import { TravelMapper } from "../mappers";
import { reportQueue } from "../utils/asyncQueue";

@Service()
export default class TravelService {
  @Inject((type) => AiService)
  private aiService!: AiService;

  @Inject((type) => TravelRepository)
  private travelRepository!: TravelRepository;

  /**
   * 별여행 출발 및 실시간 AI 탐사 결과 생성
   */
  public async startPlanetTravel(
    userId: number,
    data: PlanetTravelStartApiRequest,
  ): Promise<PlanetTravelStartApiResponse> {
    const prisma = getPrisma();
    Logger.info(
      `[TravelService] Starting planet travel for userId ${userId}, planetType: ${data.planetType}`,
    );

    const user = await this.travelRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const activeTravel = await this.travelRepository.findActivePlanetTravelByUser(userId);
    if (activeTravel) {
      throw new BadRequestError(
        "이미 다른 행성의 탐사가 진행 중입니다. 한 번에 하나의 별만 탐사할 수 있습니다.",
        "ALREADY_IN_PROGRESS_TRAVEL",
      );
    }

    const currentFuel = user.current_fuel ?? 0;
    if (currentFuel < data.fuelSpent) {
      throw new BadRequestError(
        `보유 연료가 부족합니다. (현재: ${currentFuel}, 필요: ${data.fuelSpent})`,
        "INSUFFICIENT_FUEL",
      );
    }

    const updatedUser = await this.travelRepository.updateUserFuel(userId, data.fuelSpent, "decrement");

    // AI 탐사 결과 온디맨드 생성 시도
    let reportTitle = "아쿠아 웰니스 탐사 완료 리포트 🌟";
    let reportSummary =
      "별여행 탐사가 안전하게 완료되었습니다! 오늘 하루도 건강한 수분과 영양을 챙겨보세요.";
    let reportRecommendations = "매일 물 2,000ml 마시기\n저녁 8시 산책하기";

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
        reportSummary = aiReportResult.markdown || aiReportResult.findings || reportSummary;
      }
      if (aiReportResult.nextActionChecks) {
        reportRecommendations = Array.isArray(aiReportResult.nextActionChecks)
          ? aiReportResult.nextActionChecks.join("\n")
          : aiReportResult.nextActionChecks;
      }

    // planet_travels 레코드 생성 (탐사 상태 및 AI 탐사 결과 리포트를 1개 테이블에 통합 저장)
    const travel = await this.travelRepository.createPlanetTravel({
      ...TravelMapper.toPlanetTravelCreateInput(userId, data),
      status: "COMPLETED",
      title: reportTitle,
      summary_content: reportSummary,
      recommendations: reportRecommendations,
      completed_at: new Date(),
    });

    const travelResultData = TravelMapper.toTravelResultResponse(travel);

    return TravelMapper.toStartApiResponse(
      travel,
      travel.id.toString(),
      updatedUser.current_fuel ?? 0,
      travelResultData,
    );
  }

  /**
   * 우주여행 현황 조회
   */
  public async getTravelState(
    userId: number,
  ): Promise<TravelStateInfoResponse> {
    const user = await this.travelRepository.findUserWithTammyStatus(userId);
    if (!user) throw new UserNotFoundError(userId);

    const [activeTravel, completedTravels, actionDistances] = await Promise.all([
      this.travelRepository.findActivePlanetTravelByUser(userId),
      this.travelRepository.findCompletedPlanetTravelsByUser(userId),
      this.travelRepository.getPlanetActionCounts(userId),
    ]);

    const completedTypeSet = new Set(completedTravels.map((t) => t.planet_type));
    const completedMap = new Map<string, string>();
    completedTravels.forEach((t) => {
      if (t.completed_at) {
        completedMap.set(t.planet_type, t.completed_at.toISOString());
      }
    });

    // 1. 행성 리스트 데이터 조립 (비즈니스 로직)
    const planetList: PlanetStateItem[] = PLANET_CONFIGS.map((config) => {
      const isCompleted = completedTypeSet.has(config.planetType);
      const rawDistance = actionDistances[config.planetType] ?? 0;
      const currentDistance = isCompleted
        ? config.targetDistance
        : Math.min(rawDistance, config.targetDistance);

      return {
        planetType: config.planetType,
        name: config.name,
        targetDistance: config.targetDistance,
        currentDistance,
        isCompleted,
        completedAt: isCompleted ? (completedMap.get(config.planetType) || null) : null,
      };
    });

    // 2. 전체 탐사 진행률 계산 (비즈니스 로직)
    const totalTarget = TOTAL_TARGET_DISTANCE;
    const totalAchieved = planetList.reduce((acc, p) => acc + p.currentDistance, 0);
    const progressPercent = Math.min(Math.floor((totalAchieved / totalTarget) * 100), 100);

    return TravelMapper.toTravelStateResponse(
      user, 
      planetList, 
      progressPercent, 
      activeTravel, 
      completedTravels
    );
  }

  /**
   * 연료 적립 처리
   */
  public async addFuel(userId: number, actionType?: string): Promise<FuelAddApiResponse> {
    const user = await this.travelRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const gainedFuel = FUEL_REWARDS.DEFAULT_ACTION;
    const updatedUser = await this.travelRepository.updateUserFuel(userId, gainedFuel, "increment");

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
    const travel = await this.travelRepository.findPlanetTravelByIdAndUser(BigInt(travelResultId), userId);

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

  /**
   * 탐사 대시보드 통계 요약 조회 (칼로리 트렌드, 영양 밸런스 등)
   */
  public async getDashboard(
    userId: number,
    period: string = "WEEKLY",
  ): Promise<DashboardSummaryInfo> {
    const user = await this.travelRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const pastDays = period === "MONTHLY" ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - pastDays);

    const meals = await this.travelRepository.findMealsByUserAndDate(userId, startDate);

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

    const workoutLogs = await this.travelRepository.findQuickLogsByUserCategoryAndDate(userId, "EXERCISE", startDate);

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
    const user = await this.travelRepository.findUserById(userId);
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

    const travel = await this.travelRepository.createPlanetTravel({
      user_id: userId,
      planet_type: planetType,
      fuel_spent: REPORT_FUEL_COST,
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

    const reportResult = job.result as Record<string, unknown>;
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

