/* eslint-disable camelcase */
import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma, planet_travels } from "@prisma/client";
import { BaseRepository } from "./BaseRepository";
import { MAX_FUEL, STAR_PLANETS } from "@/constants/gamification";

@Service()
export default class TravelRepository extends BaseRepository<
  planet_travels,
  Prisma.planet_travelsCreateInput,
  Prisma.planet_travelsUpdateInput
> {
  constructor() {
    super(getPrisma().planet_travels);
  }

  public async findUserById(userId: number) {
    const prisma = getPrisma();
    return prisma.users.findUnique({
      where: { id: userId },
    });
  }

  public async findUserWithTammyStatus(userId: number) {
    const prisma = getPrisma();
    return prisma.users.findUnique({
      where: { id: userId },
      include: {
        tammy_statuses: true,
      },
    });
  }

  public async createPlanetTravelAndFuelTransaction(
    userId: number,
    travelData: Prisma.planet_travelsUncheckedCreateInput,
    fuelSpent: number,
  ) {
    return getPrisma().$transaction(async (tx) => {
      const updatedUser = await tx.users.update({
        where: { id: userId },
        data: { current_fuel: { decrement: fuelSpent } },
      });
      const travel = await tx.planet_travels.create({
        data: travelData as unknown as Prisma.planet_travelsCreateInput,
      });
      return { travel, updatedUser };
    });
  }

  public async createPlanetTravel(
    data: Prisma.planet_travelsUncheckedCreateInput,
  ) {
    return this.create(data as unknown as Prisma.planet_travelsCreateInput);
  }

  public async findPlanetTravelByIdAndUser(travelId: bigint, userId: number) {
    return this.findFirst({
      id: travelId,
      user_id: userId,
    });
  }

  public async findMealsByUserAndDate(userId: number, startDate: Date) {
    const prisma = getPrisma();
    return prisma.meals.findMany({
      where: {
        user_id: userId,
        registered_at: { gte: startDate },
      },
      orderBy: { registered_at: "asc" },
    });
  }

  public async findQuickLogsByUserCategoryAndDate(
    userId: number,
    category: string,
    startDate: Date,
  ) {
    const prisma = getPrisma();
    return prisma.quick_logs.findMany({
      where: {
        user_id: userId,
        category: category as import("@prisma/client").$Enums.LogCategory,
        created_at: { gte: startDate },
      },
    });
  }

  public async findActivePlanetTravelByUser(userId: number) {
    return this.findFirst({
      user_id: userId,
      status: "IN_PROGRESS",
    });
  }

  public async findCompletedPlanetTravelsByUser(userId: number) {
    return this.findMany(
      {
        user_id: userId,
        status: "COMPLETED",
      },
      undefined,
      undefined,
      { completed_at: "desc" },
    );
  }

  /**
   * 신규 또는 기존 유저의 4대 행성 초기 상태 보장 (온디맨드 초기화)
   */
  public async ensureUserInitialized(userId: number) {
    const prisma = getPrisma();
    const existing = await prisma.user_planet_progress.findMany({
      where: { user_id: userId },
    });

    const existingPlanetIds = new Set(existing.map((p) => p.planet_id));
    const toCreate = STAR_PLANETS.filter(
      (p) => !existingPlanetIds.has(p.planetId),
    );

    if (toCreate.length > 0) {
      await prisma.user_planet_progress.createMany({
        data: toCreate.map((p) => ({
          user_id: userId,
          planet_id: p.planetId,
          distance: 100,
          status: "READY",
        })),
        skipDuplicates: true,
      });
    }

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (user && user.current_fuel === null) {
      await prisma.users.update({
        where: { id: userId },
        data: { current_fuel: 0 },
      });
    }
  }

  /**
   * Two-Gauge 현재 상태 데이터 조회
   */
  public async getTravelStateData(userId: number) {
    await this.ensureUserInitialized(userId);
    const prisma = getPrisma();

    const [user, progresses] = await Promise.all([
      prisma.users.findUnique({ where: { id: userId } }),
      prisma.user_planet_progress.findMany({
        where: { user_id: userId },
      }),
    ]);

    return {
      fuel: user?.current_fuel ?? 0,
      progresses,
    };
  }

  /**
   * 활동 기록 시 게이지(연료 충전 + 행성 거리 감소) 및 멱등성 처리 원자적 트랜잭션
   */
  public async recordActivityAndGauge(params: {
    userId: number;
    planetId: string;
    fuelGain: number;
    distanceReduction: number;
    source: string;
    sourceRefId?: bigint | number;
    clientRequestId?: string;
  }) {
    const {
      userId,
      planetId,
      fuelGain,
      distanceReduction,
      source,
      sourceRefId,
      clientRequestId,
    } = params;
    await this.ensureUserInitialized(userId);
    const prisma = getPrisma();

    // 멱등성 검사
    if (clientRequestId) {
      const existingLog = await prisma.fuel_logs.findUnique({
        where: { client_request_id: clientRequestId },
      });
      if (existingLog) {
        const state = await this.getTravelStateData(userId);
        const currentPlanetProg = state.progresses.find(
          (p) => p.planet_id === planetId,
        );
        return {
          isDuplicateRequest: true,
          gainedFuel: 0,
          distanceReduced: 0,
          currentFuel: state.fuel,
          currentDistance: currentPlanetProg?.distance ?? 100,
          planetId,
        };
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. 유저 연료 충전 (최대 100 상한)
      const user = await tx.users.findUnique({ where: { id: userId } });
      const currentFuel = user?.current_fuel ?? 0;
      const actualFuelGain = Math.max(
        0,
        Math.min(fuelGain, MAX_FUEL - currentFuel),
      );
      const newFuel = currentFuel + actualFuelGain;

      await tx.users.update({
        where: { id: userId },
        data: { current_fuel: newFuel },
      });

      // 2. 행성 거리 차감 (최소 0 하한)
      const prog = await tx.user_planet_progress.findUnique({
        where: {
          user_id_planet_id: { user_id: userId, planet_id: planetId },
        },
      });
      const currentDist = prog?.distance ?? 100;
      const actualDistanceReduced = Math.max(
        0,
        Math.min(distanceReduction, currentDist),
      );
      const newDist = currentDist - actualDistanceReduced;

      await tx.user_planet_progress.update({
        where: {
          user_id_planet_id: { user_id: userId, planet_id: planetId },
        },
        data: { distance: newDist },
      });

      // 3. 감사 로그 기록
      await tx.fuel_logs.create({
        data: {
          user_id: userId,
          amount: actualFuelGain,
          source,
          source_ref_id: sourceRefId ? BigInt(sourceRefId) : null,
          client_request_id: clientRequestId,
        },
      });

      return {
        isDuplicateRequest: false,
        gainedFuel: actualFuelGain,
        distanceReduced: actualDistanceReduced,
        currentFuel: newFuel,
        currentDistance: newDist,
        planetId,
      };
    });
  }

  /**
   * 별여행 출발 (Fuel 100 소모 -> 0, 행성 상태 TRAVELING 전환)
   */
  public async departTravel(userId: number, planetId: string) {
    await this.ensureUserInitialized(userId);
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({ where: { id: userId } });
      const prog = await tx.user_planet_progress.findUnique({
        where: {
          user_id_planet_id: { user_id: userId, planet_id: planetId },
        },
      });

      if (!user || (user.current_fuel ?? 0) < MAX_FUEL) {
        throw new Error("INSUFFICIENT_FUEL");
      }
      if (!prog || prog.distance > 0) {
        throw new Error("DISTANCE_NOT_ZERO");
      }
      if (prog.status === "TRAVELING") {
        throw new Error("ALREADY_TRAVELING");
      }

      await tx.users.update({
        where: { id: userId },
        data: { current_fuel: 0 },
      });

      const updatedProg = await tx.user_planet_progress.update({
        where: {
          user_id_planet_id: { user_id: userId, planet_id: planetId },
        },
        data: { status: "TRAVELING" },
      });

      return {
        progress: updatedProg,
        departedAt: new Date(),
      };
    });
  }

  /**
   * 별여행 도착 (해당 행성 거리만 100 리셋, status = READY 복귀, trip_count+1)
   */
  public async arriveTravel(userId: number, planetId: string) {
    await this.ensureUserInitialized(userId);
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      const prog = await tx.user_planet_progress.findUnique({
        where: {
          user_id_planet_id: { user_id: userId, planet_id: planetId },
        },
      });

      if (!prog || prog.status !== "TRAVELING") {
        throw new Error("INVALID_TRAVEL_STATUS");
      }

      const arrivedAt = new Date();

      const updatedProg = await tx.user_planet_progress.update({
        where: {
          user_id_planet_id: { user_id: userId, planet_id: planetId },
        },
        data: {
          distance: 100,
          status: "READY",
          trip_count: { increment: 1 },
          last_arrived_at: arrivedAt,
        },
      });

      const user = await tx.users.findUnique({ where: { id: userId } });

      return {
        progress: updatedProg,
        currentFuel: user?.current_fuel ?? 0,
        arrivedAt,
      };
    });
  }

  /**
   * 별여행 AI 리포트 저장
   */
  public async savePlanetReport(data: {
    report_uuid: string;
    user_id: number;
    planet_id: string;
    trip_number: number;
    period_from: Date;
    period_to: Date;
    period_days: number;
    headline: string;
    summary: string;
    mindfulness_feedback?: string | null;
    recommendations?: object | null;
    wellness_score?: number | null;
    stats?: object | null;
    activity_breakdown?: object | null;
    tammy_motion?: string;
    data_density?: string;
    is_fallback?: boolean;
  }) {
    const prisma = getPrisma();
    return prisma.planet_reports.create({
      data: {
        report_uuid: data.report_uuid,
        user_id: data.user_id,
        planet_id: data.planet_id,
        trip_number: data.trip_number,
        period_from: data.period_from,
        period_to: data.period_to,
        period_days: data.period_days,
        headline: data.headline,
        summary: data.summary,
        mindfulness_feedback: data.mindfulness_feedback,
        recommendations: data.recommendations ?? undefined,
        wellness_score: data.wellness_score,
        stats: data.stats ?? undefined,
        activity_breakdown: data.activity_breakdown ?? undefined,
        tammy_motion: data.tammy_motion ?? "BOUNCE",
        data_density: data.data_density ?? "normal",
        is_fallback: data.is_fallback ?? false,
      },
    });
  }

  /**
   * 별여행 AI 리포트 단건 조회 (UUID 기준)
   */
  public async findPlanetReportByUuid(reportUuid: string, userId: number) {
    const prisma = getPrisma();
    return prisma.planet_reports.findFirst({
      where: {
        report_uuid: reportUuid,
        user_id: userId,
      },
    });
  }

  /**
   * 특정 년월(YYYY-MM)의 월간 회고 리포트 조회
   */
  public async findMonthlyRetroReport(userId: number, yearMonth: string) {
    const prisma = getPrisma();
    return prisma.monthly_retro_reports.findUnique({
      where: {
        user_id_year_month: {
          user_id: userId,
          year_month: yearMonth,
        },
      },
    });
  }

  /**
   * 이전 달의 월간 회고 리포트 조회 (점수 증감 계산용)
   */
  public async findPreviousMonthlyRetroReport(
    userId: number,
    currentYearMonth: string,
  ) {
    const prisma = getPrisma();
    const [yearStr, monthStr] = currentYearMonth.split("-");
    let prevYear = parseInt(yearStr || "2026", 10);
    let prevMonth = parseInt(monthStr || "1", 10) - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevYearMonth = `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;

    return prisma.monthly_retro_reports.findUnique({
      where: {
        user_id_year_month: {
          user_id: userId,
          year_month: prevYearMonth,
        },
      },
    });
  }

  /**
   * 월간 회고 리포트 저장 (upsert)
   */
  public async saveMonthlyRetroReport(data: {
    user_id: number;
    year_month: string;
    wellness_score: number;
    content_json: object;
  }) {
    const prisma = getPrisma();
    return prisma.monthly_retro_reports.upsert({
      where: {
        user_id_year_month: {
          user_id: data.user_id,
          year_month: data.year_month,
        },
      },
      update: {
        wellness_score: data.wellness_score,
        content_json:
          data.content_json as unknown as import("@prisma/client").Prisma.InputJsonValue,
        generated_at: new Date(),
      },
      create: {
        user_id: data.user_id,
        year_month: data.year_month,
        wellness_score: data.wellness_score,
        content_json:
          data.content_json as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
    });
  }

  /**
   * 월간 기간 동안의 행성별 도착 횟수 및 활동 로그 집계
   */
  public async getMonthlyAggregation(
    userId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const prisma = getPrisma();

    // 1. 해당 월에 완료된 행성별 도착 횟수 카운트
    const reports = await prisma.planet_reports.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        planet_id: true,
      },
    });

    const arrivals: Record<string, number> = {
      meal: 0,
      water: 0,
      emotion: 0,
      habit: 0,
    };

    for (const r of reports) {
      const pid = r.planet_id.toLowerCase();
      if (arrivals[pid] !== undefined) {
        arrivals[pid] += 1;
      }
    }

    // 2. 활동 로그 원본 카운트
    const mealCount = await prisma.meals.count({
      where: {
        user_id: userId,
        registered_at: { gte: startDate, lte: endDate },
      },
    });

    const waterLogs = await prisma.quick_logs.findMany({
      where: {
        user_id: userId,
        category: "WATER",
        created_at: { gte: startDate, lte: endDate },
      },
    });
    const totalWaterMl = waterLogs.reduce(
      (acc, cur) => acc + (cur.amount || 250),
      0,
    );

    const emotionLogs = await prisma.quick_logs.count({
      where: {
        user_id: userId,
        category: { in: ["EMOTION", "JOURNAL"] },
        created_at: { gte: startDate, lte: endDate },
      },
    });

    const exerciseLogs = await prisma.quick_logs.findMany({
      where: {
        user_id: userId,
        category: "EXERCISE",
        created_at: { gte: startDate, lte: endDate },
      },
    });
    const totalExerciseMinutes = exerciseLogs.reduce(
      (acc, cur) => acc + (cur.duration_minutes || 0),
      0,
    );

    return {
      arrivals,
      mealCount,
      totalWaterMl,
      waterLogCount: waterLogs.length,
      emotionCount: emotionLogs,
      exerciseCount: exerciseLogs.length,
      totalExerciseMinutes,
    };
  }

  /**
   * 모든 활성 사용자 ID 목록 조회 (월간 배치용)
   */
  public async findAllActiveUserIds(): Promise<number[]> {
    const prisma = getPrisma();
    const users = await prisma.users.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}
