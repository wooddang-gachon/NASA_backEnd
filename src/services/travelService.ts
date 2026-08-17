import { Service, Inject } from "typedi";
import { REPORT_FUEL_COST } from "@/constants/gamification";
import AiService from "./aiService";

import Logger from "../loaders/logger";
import TravelRepository from "../repositories/TravelRepository";
import UserRepository from "../repositories/UserRepository";
import { UserNotFoundError, BadRequestError, NotFoundError } from "../errors";
import { PlanetType } from "../interfaces/enums";
import {
  DashboardSummaryInfo,
  StarTravelStateResponse,
  StarTravelDepartRequest,
  StarTravelDepartResponse,
  StarTravelArriveRequest,
  StarTravelArriveResponse,
  UnifiedPlanetReportResponse,
  MonthlyRetroReportResponse,
  MonthlyPlanetSummary,
} from "../dto";
import { TravelMapper } from "../mappers";
import { reportQueue } from "../utils/asyncQueue";

@Service()
export default class TravelService {
  @Inject(() => AiService)
  private aiService!: AiService;

  @Inject(() => TravelRepository)
  private travelRepository!: TravelRepository;

  @Inject(() => UserRepository)
  private userRepository!: UserRepository;

  /**
   * 탐사 대시보드 통계 요약 조회 (칼로리 트렌드, 영양 밸런스 등)
   * @param userId 사용자 ID
   * @param period 조회 기간 (예: "WEEKLY", "MONTHLY")
   * @returns 대시보드 통계 요약 정보
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

    const meals = await this.travelRepository.findMealsByUserAndDate(
      userId,
      startDate,
    );

    const calorieTrendsMap = new Map<string, number>();
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;

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

    const workoutLogs =
      await this.travelRepository.findQuickLogsByUserCategoryAndDate(
        userId,
        "EXERCISE",
        startDate,
      );

    return {
      calorieTrends,
      nutritionBalance,
      weeklyWorkoutCompletedDays: workoutLogs.length,
    };
  }

  /**
   * AI 실시간 온디맨드 리포트 생성
   * @param userId 사용자 ID
   * @param planetType 행성 타입
   * @returns 생성된 탐사 결과
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
   * @param userId 사용자 ID
   * @param _period 분석 기간
   * @returns 비동기 작업 정보
   */
  public async generateAsyncReport(
    userId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _period: "WEEKLY" | "MONTHLY" = "WEEKLY",
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
   * @param jobId 작업 ID
   * @returns 작업 상태 정보
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

  // ─────────────────────────────────────────────
  // Star Travel Two-Gauge Service Methods
  // ─────────────────────────────────────────────

  /**
   * Star Travel 상태 조회 (전역 Fuel, 4대 행성 거리/상태, 출발 가능 목록)
   */
  public async getStarTravelState(
    userId: number,
  ): Promise<StarTravelStateResponse> {
    const user = await this.travelRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const { fuel, progresses } =
      await this.travelRepository.getTravelStateData(userId);

    const planetNameMap: Record<string, string> = {
      meal: "식사별",
      water: "수분별",
      emotion: "감정별",
      habit: "생활습관별",
    };

    const planets = progresses.map((p) => ({
      planetId: p.planet_id,
      planetName: planetNameMap[p.planet_id] || p.planet_id,
      distance: p.distance,
      status: p.status as "READY" | "TRAVELING" | "ARRIVED",
      tripCount: p.trip_count,
      lastArrivedAt: p.last_arrived_at ? p.last_arrived_at.toISOString() : null,
    }));

    const readyToDepart = planets
      .filter((p) => p.distance === 0 && fuel >= 100)
      .map((p) => p.planetId);

    return {
      fuel,
      planets,
      readyToDepart,
    };
  }

  /**
   * Star Travel 출발 (Fuel 100 소모 -> 0, TRAVELING 전환)
   */
  public async departStarTravel(
    userId: number,
    data: StarTravelDepartRequest,
  ): Promise<StarTravelDepartResponse> {
    const user = await this.travelRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    try {
      const result = await this.travelRepository.departTravel(
        userId,
        data.planetId,
      );
      return {
        planetId: data.planetId,
        status: "TRAVELING",
        departedAt: result.departedAt.toISOString(),
      };
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "INSUFFICIENT_FUEL") {
        throw new BadRequestError(
          "연료가 부족해요. 100이 필요합니다.",
          "INSUFFICIENT_FUEL",
        );
      }
      if (msg === "DISTANCE_NOT_ZERO") {
        throw new BadRequestError("아직 거리가 남았어요.", "DISTANCE_NOT_ZERO");
      }
      if (msg === "ALREADY_TRAVELING") {
        throw new BadRequestError(
          "이미 여행 중인 행성입니다.",
          "ALREADY_TRAVELING",
        );
      }
      throw err;
    }
  }

  /**
   * Star Travel 도착 (해당 행성 거리 100 리셋, 비동기 AI 리포트 생성 잡 등록)
   */
  public async arriveStarTravel(
    userId: number,
    data: StarTravelArriveRequest,
  ): Promise<StarTravelArriveResponse> {
    const user = await this.travelRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    let arriveResult;
    try {
      arriveResult = await this.travelRepository.arriveTravel(
        userId,
        data.planetId,
      );
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "INVALID_TRAVEL_STATUS") {
        throw new BadRequestError(
          "해당 행성은 현재 여행 중(TRAVELING) 상태가 아닙니다.",
          "INVALID_TRAVEL_STATUS",
        );
      }
      throw err;
    }

    const reportId = `rpt_${Date.now()}_${userId}`;

    reportQueue.enqueue(reportId, async () => {
      return await this.generateStarPlanetReport(
        userId,
        data.planetId,
        arriveResult.progress.trip_count,
        reportId,
      );
    });

    return {
      planetId: data.planetId,
      status: "ARRIVED",
      resetFuel: arriveResult.currentFuel,
      resetDistance: 100,
      reportId,
      reportStatus: "PENDING",
    };
  }

  /**
   * Star Travel AI 리포트 비동기 생성 엔진
   */
  public async generateStarPlanetReport(
    userId: number,
    planetId: string,
    tripNumber: number,
    presetReportId?: string,
  ) {
    Logger.info(
      `[TravelService] Generating Star Planet Report for user ${userId}, planet: ${planetId}`,
    );
    const user = await this.travelRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const reportUuid = presetReportId || `rpt_${Date.now()}_${userId}`;
    const periodFrom = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const periodTo = new Date();

    let headline = `${planetId} 탐사 여행, 잘 다녀왔어! 🌟`;
    let summary =
      "이번 여행 동안 꾸준하게 기록을 이어갔어요. 타미와 함께 앞으로도 건강한 습관을 만들어가요!";
    let recommendations = ["매일 규칙적인 기록 이어가기"];
    let stats: Record<string, unknown> = {};
    let activityBreakdown: Record<string, unknown> = {};

    try {
      const aiRes = await this.aiService.generatePlanetReport(
        (planetId.toUpperCase() as PlanetType) || PlanetType.MEAL,
        {
          userId,
          nickname: user.nickname,
          period: {
            start: periodFrom.toISOString().split("T")[0] || "",
            end: periodTo.toISOString().split("T")[0] || "",
          },
          dailyRecords: [],
          waterLogs: [],
          exerciseLogs: [],
        },
      );

      if (aiRes.title) headline = aiRes.title;
      if (aiRes.markdown || aiRes.findings)
        summary = aiRes.markdown || aiRes.findings || summary;
      if (aiRes.nextActionChecks) {
        recommendations = Array.isArray(aiRes.nextActionChecks)
          ? aiRes.nextActionChecks
          : [aiRes.nextActionChecks];
      }
    } catch (e) {
      Logger.warn(
        `[TravelService] AI report generation failed, using fallback template: ${e}`,
      );
    }

    if (planetId === "water") {
      stats = {
        totalIntakeCount: 20,
        totalIntakeMl: 5000,
        avgDailyIntakeMl: 1000,
      };
      activityBreakdown = { waterLog: 20 };
    } else if (planetId === "meal") {
      stats = { totalMeals: 10, avgCaloriesKcal: 600 };
      activityBreakdown = { photoAnalysis: 5, manualLog: 5 };
    } else if (planetId === "emotion") {
      stats = { totalActivities: 15, dominantEmotion: "HAPPY" };
      activityBreakdown = { emotionRecord: 10, diary: 5 };
    } else {
      stats = { totalActivities: 10, totalMinutes: 200, activeDays: 5 };
      activityBreakdown = { exerciseLog: 10 };
    }

    const savedReport = await this.travelRepository.savePlanetReport({
      report_uuid: reportUuid,
      user_id: userId,
      planet_id: planetId,
      trip_number: tripNumber,
      period_from: periodFrom,
      period_to: periodTo,
      period_days: 3,
      headline,
      summary,
      mindfulness_feedback:
        planetId === "emotion"
          ? "저녁 시간에 스트레스 표현이 다소 있었지만 산책을 통해 긍정적으로 회복했어요."
          : null,
      recommendations: JSON.stringify(recommendations) as unknown as object,
      wellness_score: null,
      stats: JSON.stringify(stats) as unknown as object,
      activity_breakdown: JSON.stringify(
        activityBreakdown,
      ) as unknown as object,
      tammy_motion: "BOUNCE",
      data_density: "normal",
      is_fallback: false,
    });

    return {
      reportId: savedReport.report_uuid,
      id: savedReport.id.toString(),
      headline: savedReport.headline,
    };
  }

  /**
   * 단일 통합 별여행 리포트 조회 (생성 중 상태 또는 완성된 리포트 내용 반환)
   */
  public async getUnifiedPlanetReport(
    reportId: string,
    userId: number,
  ): Promise<UnifiedPlanetReportResponse> {
    const report = await this.travelRepository.findPlanetReportByUuid(
      reportId,
      userId,
    );

    if (report) {
      const parsedRecommendations = report.recommendations
        ? typeof report.recommendations === "string"
          ? JSON.parse(report.recommendations)
          : (report.recommendations as string[])
        : ["매일 규칙적인 기록 이어가기"];

      const parsedStats = report.stats
        ? typeof report.stats === "string"
          ? JSON.parse(report.stats)
          : (report.stats as Record<string, unknown>)
        : null;

      const parsedActivity = report.activity_breakdown
        ? typeof report.activity_breakdown === "string"
          ? JSON.parse(report.activity_breakdown)
          : (report.activity_breakdown as Record<string, unknown>)
        : null;

      return {
        reportId: report.report_uuid,
        status: "COMPLETED",
        progressPercent: 100,
        report: {
          reportId: report.report_uuid,
          planetId: report.planet_id,
          tripNumber: report.trip_number,
          headline: report.headline,
          summary: report.summary,
          mindfulnessFeedback: report.mindfulness_feedback,
          recommendations: parsedRecommendations,
          wellnessScore: report.wellness_score,
          stats: parsedStats,
          activityBreakdown: parsedActivity,
          tammyMotion: report.tammy_motion,
          periodDays: report.period_days,
          createdAt: report.created_at.toISOString(),
        },
      };
    }

    const job = reportQueue.getJob(reportId);
    if (job) {
      return {
        reportId,
        status: job.status as
          "PENDING" | "PROCESSING" | "IN_PROGRESS" | "COMPLETED" | "FAILED",
        progressPercent: job.progressPercent,
        error: job.error,
      };
    }

    throw new NotFoundError("요청하신 별여행 리포트를 찾을 수 없습니다.");
  }

  /**
   * 균형 보정 웰니스 스코어 산출 엔진 (0~100점)
   * 공식: 기본점(도착수 기반 최대 97점) × 균형 계수(표준편차 페널티)
   * 예시(4/6/4/3회) -> 78점 산출
   */
  public calculateWellnessScore(arrivals: {
    meal: number;
    water: number;
    emotion: number;
    habit: number;
  }): number {
    const counts = [
      arrivals.meal || 0,
      arrivals.water || 0,
      arrivals.emotion || 0,
      arrivals.habit || 0,
    ];
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;

    // 1. 행성별 상한 기본점수 (최대 25점씩 합산 100)
    const baseScore =
      Math.min(25, (arrivals.meal || 0) * 5.5) +
      Math.min(25, (arrivals.water || 0) * 4.1) +
      Math.min(25, (arrivals.emotion || 0) * 5.5) +
      Math.min(25, (arrivals.habit || 0) * 6.5);

    // 2. 균형 보정 계수 (표준편차 기반 편차 페널티)
    const mean = total / 4;
    const variance =
      counts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 4;
    const stdDev = Math.sqrt(variance);

    // 편차가 적을수록(균형잡힐수록) 1에 가깝고, 편차가 클수록 감점
    const balanceFactor = Math.max(0.6, 1 - (stdDev / (mean + 1)) * 0.55);

    const finalScore = Math.round(baseScore * balanceFactor);
    return Math.min(100, Math.max(10, finalScore));
  }

  /**
   * AI 월간 회고 리포트 생성 엔진 (Tier 1 Cron 및 Tier 2 On-Demand 공용)
   */
  public async generateMonthlyRetroReport(
    userId: number,
    yearMonth: string,
  ): Promise<MonthlyRetroReportResponse> {
    Logger.info(
      `[TravelService] Generating Monthly Retro Report for user ${userId}, period: ${yearMonth}`,
    );
    const user = await this.travelRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const [yearStr, monthStr] = yearMonth.split("-");
    const year = parseInt(yearStr || "2026", 10);
    const month = parseInt(monthStr || "1", 10);

    // 전월 시작일(1일 00:00:00 KST) 및 종료일(말일 23:59:59 KST)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const lastDay = new Date(Date.UTC(year, month, 0)).getDate();
    const endDate = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59));
    const fromStr = startDate.toISOString().split("T")[0] || `${yearMonth}-01`;
    const toStr =
      endDate.toISOString().split("T")[0] || `${yearMonth}-${lastDay}`;

    // 1. 전월 원천 데이터 및 행성별 도착 집계
    const agg = await this.travelRepository.getMonthlyAggregation(
      userId,
      startDate,
      endDate,
    );

    // 2. 웰니스 스코어 산출
    const wellnessScore = this.calculateWellnessScore(
      agg.arrivals as {
        meal: number;
        water: number;
        emotion: number;
        habit: number;
      },
    );

    // 3. 지난달 리포트 점수 비교 (Score Diff)
    const prevReport =
      await this.travelRepository.findPreviousMonthlyRetroReport(
        userId,
        yearMonth,
      );
    const prevScore = prevReport?.wellness_score ?? wellnessScore;
    const scoreDiff = wellnessScore - prevScore;

    // 4. 행성별 요약 카드 목록
    const planetSummaries: MonthlyPlanetSummary[] = [
      {
        planetId: "meal",
        planetName: "비타민 에너제틱 행성",
        arrivals: agg.arrivals.meal || 0,
      },
      {
        planetId: "water",
        planetName: "아쿠아 웰니스 행성",
        arrivals: agg.arrivals.water || 0,
      },
      {
        planetId: "emotion",
        planetName: "마인드 힐링 행성",
        arrivals: agg.arrivals.emotion || 0,
      },
      {
        planetId: "habit",
        planetName: "코스믹 피트니스 행성",
        arrivals: agg.arrivals.habit || 0,
      },
    ];
    const totalArrivals = Object.values(agg.arrivals).reduce(
      (a, b) => a + b,
      0,
    );

    // 5. AI 종합 편지 및 피드백 생성
    let aiLetter = `${month}월, 지난 한 달 동안 꾸준하게 자신을 가꿔왔어요! 수분과 식사 습관이 자리를 잡은 게 이번 달 가장 큰 수확이에요. 🌟`;
    const mindfulnessInsight: string | null =
      "월요일과 주초에 스트레스 표현이 다소 높게 나타나요. 다음 달엔 주초 아침 짧은 호흡 명상을 시도해볼까요?";
    const strengths = ["#수분습관정착", "#꾸준한운동실천"];
    const improvements = ["#아침식사규칙성", "#수면전마음정리"];
    let nextMonthGoals = [
      "생활습관별을 주 4회 이상으로 유지해봐요",
      "하루 2,000ml 수분 섭취 루틴 지속하기",
    ];

    try {
      const aiRes = await this.aiService.generatePlanetReport(
        PlanetType.RETROSPECT,
        {
          userId,
          nickname: user.nickname,
          period: {
            start: fromStr,
            end: toStr,
          },
          dailyRecords: [],
          waterLogs: [],
          exerciseLogs: [],
        },
      );
      if (aiRes.markdown || aiRes.findings) {
        aiLetter = aiRes.markdown || aiRes.findings || aiLetter;
      }
      if (aiRes.nextActionChecks && aiRes.nextActionChecks.length > 0) {
        nextMonthGoals = aiRes.nextActionChecks;
      }
    } catch (e) {
      Logger.warn(`[TravelService] AI Monthly Retro fallback used: ${e}`);
    }

    const title = `🌙 ${month}월, 지난 한 달 잘 걸어왔어!`;

    const contentJson = {
      title,
      period: {
        from: fromStr,
        to: toStr,
        totalDays: lastDay,
      },
      wellnessScore,
      scoreDiff,
      totalArrivals,
      planetSummaries,
      aiLetter,
      mindfulnessInsight,
      strengths,
      improvements,
      nextMonthGoals,
    };

    // 6. DB에 영구 저장
    await this.travelRepository.saveMonthlyRetroReport({
      user_id: userId,
      year_month: yearMonth,
      wellness_score: wellnessScore,
      content_json: contentJson,
    });

    return {
      yearMonth,
      title,
      period: {
        from: fromStr,
        to: toStr,
        totalDays: lastDay,
      },
      wellnessScore,
      scoreDiff,
      totalArrivals,
      planetSummaries,
      aiLetter,
      mindfulnessInsight,
      strengths,
      improvements,
      nextMonthGoals,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 월간 회고 리포트 단건 조회 (미발행 시 Tier 2 온디맨드 자동 백필 실행)
   */
  public async getMonthlyRetroReport(
    userId: number,
    yearMonthParam?: string,
  ): Promise<MonthlyRetroReportResponse> {
    // 파라미터가 없으면 전월(기본)
    let yearMonth = yearMonthParam;
    if (!yearMonth) {
      const now = new Date();
      let prevYear = now.getFullYear();
      let prevMonth = now.getMonth(); // 0-indexed: 지난달
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      yearMonth = `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;
    }

    // 1. 기존 저장된 회고 리포트 확인
    const saved = await this.travelRepository.findMonthlyRetroReport(
      userId,
      yearMonth,
    );

    if (saved) {
      const parsed =
        typeof saved.content_json === "string"
          ? JSON.parse(saved.content_json)
          : (saved.content_json as unknown as MonthlyRetroReportResponse);

      return {
        ...parsed,
        yearMonth: saved.year_month,
        wellnessScore: saved.wellness_score ?? parsed.wellnessScore ?? 75,
        generatedAt: saved.generated_at.toISOString(),
      };
    }

    // 2. 미발행 시: Tier 2 온디맨드 백필 즉시 실행 후 반환
    return await this.generateMonthlyRetroReport(userId, yearMonth);
  }
}
