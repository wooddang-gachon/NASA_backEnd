import "reflect-metadata";
import TravelService from "../../../services/travelService";
import AiService from "../../../services/aiService";
import TravelRepository from "../../../repositories/TravelRepository";
import UserRepository from "../../../repositories/UserRepository";
import { Container } from "typedi";
import {
  UserNotFoundError,
  BadRequestError,
  NotFoundError,
} from "../../../errors";
import { PlanetType } from "../../../interfaces/enums";

jest.mock("../../../services/aiService");
jest.mock("../../../repositories/TravelRepository");
jest.mock("../../../repositories/UserRepository");

describe("TravelService", () => {
  let travelService: TravelService;
  let mockAiService: jest.Mocked<AiService>;
  let mockTravelRepository: jest.Mocked<TravelRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockAiService = new AiService() as jest.Mocked<AiService>;
    mockTravelRepository =
      new TravelRepository() as jest.Mocked<TravelRepository>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;

    Container.set(AiService, mockAiService);
    Container.set(TravelRepository, mockTravelRepository);
    Container.set(UserRepository, mockUserRepository);

    travelService = Container.get(TravelService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("getStarTravelState", () => {
    it("should throw UserNotFoundError if user not found", async () => {
      mockTravelRepository.findUserById.mockResolvedValue(null);

      await expect(travelService.getStarTravelState(1)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it("should return Star Travel state and readyToDepart list", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({ id: 1 } as never);
      mockTravelRepository.getTravelStateData.mockResolvedValue({
        fuel: 100,
        progresses: [
          {
            user_id: 1,
            planet_id: "water",
            distance: 0,
            status: "READY",
            trip_count: 1,
            last_arrived_at: new Date(),
            updated_at: new Date(),
          },
          {
            user_id: 1,
            planet_id: "meal",
            distance: 50,
            status: "READY",
            trip_count: 0,
            last_arrived_at: null,
            updated_at: new Date(),
          },
        ] as never,
      });

      const result = await travelService.getStarTravelState(1);
      expect(result.fuel).toBe(100);
      expect(result.planets).toHaveLength(2);
      expect(result.readyToDepart).toEqual(["water"]);
    });
  });

  describe("departStarTravel", () => {
    it("should depart successfully", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({ id: 1 } as never);
      mockTravelRepository.departTravel.mockResolvedValue({
        progress: {
          user_id: 1,
          planet_id: "water",
          distance: 0,
          status: "TRAVELING",
        } as never,
        departedAt: new Date(),
      });

      const result = await travelService.departStarTravel(1, {
        planetId: "water",
      });

      expect(result.planetId).toBe("water");
      expect(result.status).toBe("TRAVELING");
      expect(result.departedAt).toBeDefined();
    });

    it("should throw BadRequestError on INSUFFICIENT_FUEL", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({ id: 1 } as never);
      mockTravelRepository.departTravel.mockRejectedValue(
        new Error("INSUFFICIENT_FUEL"),
      );

      await expect(
        travelService.departStarTravel(1, { planetId: "water" }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("arriveStarTravel", () => {
    it("should arrive and enqueue report generation job", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({ id: 1 } as never);
      mockTravelRepository.arriveTravel.mockResolvedValue({
        progress: {
          user_id: 1,
          planet_id: "water",
          distance: 100,
          status: "READY",
          trip_count: 1,
        } as never,
        currentFuel: 10,
        arrivedAt: new Date(),
      });

      const result = await travelService.arriveStarTravel(1, {
        planetId: "water",
      });

      expect(result.planetId).toBe("water");
      expect(result.status).toBe("ARRIVED");
      expect(result.resetDistance).toBe(100);
      expect(result.reportId).toBeDefined();
      expect(result.reportStatus).toBe("PENDING");
    });
  });

  describe("getUnifiedPlanetReport", () => {
    it("should return COMPLETED report from DB if exists", async () => {
      mockTravelRepository.findPlanetReportByUuid.mockResolvedValue({
        report_uuid: "rpt_1",
        user_id: 1,
        planet_id: "water",
        trip_number: 1,
        headline: "Test headline",
        summary: "Test summary",
        mindfulness_feedback: null,
        recommendations: JSON.stringify(["rec1"]),
        wellness_score: null,
        stats: JSON.stringify({ count: 20 }),
        activity_breakdown: null,
        tammy_motion: "BOUNCE",
        period_days: 3,
        created_at: new Date(),
      } as never);

      const res = await travelService.getUnifiedPlanetReport("rpt_1", 1);
      expect(res.status).toBe("COMPLETED");
      expect(res.progressPercent).toBe(100);
      expect(res.report?.headline).toBe("Test headline");
      expect(res.report?.recommendations).toEqual(["rec1"]);
    });

    it("should throw NotFoundError if report not found in DB or queue", async () => {
      mockTravelRepository.findPlanetReportByUuid.mockResolvedValue(null);

      await expect(
        travelService.getUnifiedPlanetReport("non_existent", 1),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("calculateWellnessScore", () => {
    it("should calculate balanced wellness score correctly around 78 for 4/6/4/3 arrivals", () => {
      const score = travelService.calculateWellnessScore({
        meal: 4,
        water: 6,
        emotion: 4,
        habit: 3,
      });
      expect(score).toBeGreaterThanOrEqual(70);
      expect(score).toBeLessThanOrEqual(85);
    });

    it("should return 0 when total arrivals are 0", () => {
      const score = travelService.calculateWellnessScore({
        meal: 0,
        water: 0,
        emotion: 0,
        habit: 0,
      });
      expect(score).toBe(0);
    });
  });

  describe("getMonthlyRetroReport", () => {
    it("should return existing monthly retro report from DB", async () => {
      mockTravelRepository.findMonthlyRetroReport.mockResolvedValue({
        user_id: 1,
        year_month: "2026-07",
        wellness_score: 78,
        content_json: JSON.stringify({
          title: "7월 회고",
          period: { from: "2026-07-01", to: "2026-07-31", totalDays: 31 },
          wellnessScore: 78,
          scoreDiff: 6,
          totalArrivals: 17,
          planetSummaries: [],
          aiLetter: "잘했어",
          strengths: [],
          improvements: [],
          nextMonthGoals: [],
        }),
        generated_at: new Date(),
      } as never);

      const result = await travelService.getMonthlyRetroReport(1, "2026-07");
      expect(result.yearMonth).toBe("2026-07");
      expect(result.wellnessScore).toBe(78);
    });
  });

  describe("getDashboard", () => {
    it("should throw UserNotFoundError if user not found", async () => {
      mockTravelRepository.findUserById.mockResolvedValue(null);

      await expect(travelService.getDashboard(1)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it("should return dashboard summary", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({} as never);
      mockTravelRepository.findMealsByUserAndDate.mockResolvedValue([
        {
          registered_at: new Date(),
          total_calories_kcal: 500,
          total_carbohydrate_g: 50,
          total_protein_g: 30,
          total_fat_g: 20,
        },
      ] as never);
      mockTravelRepository.findQuickLogsByUserCategoryAndDate.mockResolvedValue(
        [] as never,
      );

      const result = await travelService.getDashboard(1, "WEEKLY");
      expect(result).toBeDefined();
      expect(result.calorieTrends).toHaveLength(1);
    });
  });

  describe("generateOndemandReport", () => {
    it("should throw if user not found", async () => {
      mockTravelRepository.findUserById.mockResolvedValue(null);
      await expect(travelService.generateOndemandReport(1)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it("should generate report and return mapped result", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({
        id: 1,
        nickname: "test",
      } as never);
      mockAiService.generatePlanetReport.mockResolvedValue({
        title: "Test",
        markdown: "Md",
        nextActionChecks: ["1"],
      } as never);
      mockTravelRepository.createPlanetTravel.mockResolvedValue({
        id: BigInt(1),
        started_at: new Date(),
        completed_at: new Date(),
      } as never);

      const res = await travelService.generateOndemandReport(1);
      expect(res).toBeDefined();
      expect(mockTravelRepository.createPlanetTravel).toHaveBeenCalled();
    });
  });

  describe("generateAsyncReport", () => {
    it("should enqueue a job", async () => {
      const res = await travelService.generateAsyncReport(1);
      expect(res.status).toBe("PENDING");
      expect(res.jobId).toBeDefined();
    });
  });

  describe("getJobStatus", () => {
    it("should return COMPLETED if job not found", async () => {
      const res = await travelService.getJobStatus("non_existent_job");
      expect(res.status).toBe("COMPLETED");
    });
  });

  describe("generateMonthlyRetroReport", () => {
    const mockUser = { id: 1, nickname: "스타게이저" };

    it("사용자가 없으면 UserNotFoundError를 발생시켜야 한다", async () => {
      mockTravelRepository.findUserById.mockResolvedValue(null);
      await expect(
        travelService.generateMonthlyRetroReport(1, "2026-08"),
      ).rejects.toThrow(UserNotFoundError);
    });

    it("활동 기록이 3건 이하인 Cold Start 사용자는 AI를 호출하지 않고 온보딩 격려 템플릿을 반환해야 한다", async () => {
      mockTravelRepository.findUserById.mockResolvedValue(mockUser as never);
      mockTravelRepository.getMonthlyAggregation.mockResolvedValue({
        arrivals: { meal: 0, water: 1, emotion: 0, habit: 0 },
        mealCount: 0,
        totalWaterMl: 500,
        waterLogCount: 1,
        emotionCount: 0,
        exerciseCount: 0,
        totalExerciseMinutes: 0,
        totalActivityCount: 1,
        recentMeals: [],
        recentWaterLogs: [],
        recentEmotionLogs: [],
        recentExerciseLogs: [],
      } as never);
      mockTravelRepository.findPreviousMonthlyRetroReport.mockResolvedValue(
        null,
      );
      mockTravelRepository.saveMonthlyRetroReport.mockResolvedValue(
        undefined as never,
      );

      const res = await travelService.generateMonthlyRetroReport(1, "2026-08");

      expect(mockAiService.generatePlanetReport).not.toHaveBeenCalled();
      expect(res.aiLetter).toContain("탐사를 시작하는 단계였군요");
      expect(res.strengths).toEqual(["#탐험의시작", "#첫발걸음"]);
      expect(res.improvements).toEqual(["#매일기록하기", "#루틴만들기"]);
      expect(mockTravelRepository.saveMonthlyRetroReport).toHaveBeenCalled();
    });

    it("정상 활동 데이터가 있는 경우 AI 서비스를 호출하고 마크다운 섹션을 파싱하여 도메인 필드에 매핑해야 한다", async () => {
      mockTravelRepository.findUserById.mockResolvedValue(mockUser as never);
      mockTravelRepository.getMonthlyAggregation.mockResolvedValue({
        arrivals: { meal: 3, water: 5, emotion: 2, habit: 2 },
        mealCount: 10,
        totalWaterMl: 15000,
        waterLogCount: 15,
        emotionCount: 5,
        exerciseCount: 8,
        totalExerciseMinutes: 240,
        totalActivityCount: 38,
        recentMeals: [
          {
            id: 1,
            meal_type: "LUNCH",
            total_calories_kcal: 600,
            meal_items: [{ custom_food_name: "샐러드" }],
          },
        ],
        recentWaterLogs: [{ id: 1, amount: 500 }],
        recentEmotionLogs: [{ id: 1, emotion_type: "HAPPY" }],
        recentExerciseLogs: [{ id: 1, duration_minutes: 30 }],
      } as never);
      mockTravelRepository.findPreviousMonthlyRetroReport.mockResolvedValue(
        null,
      );
      mockTravelRepository.saveMonthlyRetroReport.mockResolvedValue(
        undefined as never,
      );

      const aiMarkdown = `
## 종합 편지
8월 한 달 동안 건강한 습관을 완벽하게 다지셨습니다!

## 마인드풀니스 인사이트
주중 오후에 몰입도가 높았으며, 감정 리듬이 매우 안정적이었습니다.

## 잘한 점
#점심샐러드성공 #충분한수분섭취 #꾸준한유산소

## 개선할 점
#주말수면패턴유지 #아침스트레칭

## 다음 달 목표
- 매일 아침 스트레칭 10분
- 물 2리터 마시기 연속 20일 달성
      `;

      mockAiService.generatePlanetReport.mockResolvedValue({
        markdown: aiMarkdown,
        nextActionChecks: ["매일 아침 스트레칭 10분"],
      } as never);

      const res = await travelService.generateMonthlyRetroReport(1, "2026-08");

      expect(mockAiService.generatePlanetReport).toHaveBeenCalled();
      expect(res.aiLetter).toContain(
        "8월 한 달 동안 건강한 습관을 완벽하게 다지셨습니다!",
      );
      expect(res.mindfulnessInsight).toContain("주중 오후에 몰입도");
      expect(res.strengths).toEqual([
        "#점심샐러드성공",
        "#충분한수분섭취",
        "#꾸준한유산소",
      ]);
      expect(res.improvements).toEqual(["#주말수면패턴유지", "#아침스트레칭"]);
      expect(res.nextMonthGoals).toEqual(["매일 아침 스트레칭 10분"]);
      expect(mockTravelRepository.saveMonthlyRetroReport).toHaveBeenCalled();
    });
  });

  describe("generateStarPlanetReport", () => {
    const mockUser = { id: 1, nickname: "우주탐험가" };

    beforeEach(() => {
      mockTravelRepository.findUserById.mockResolvedValue(mockUser as never);
    });

    it("수분별 행성에 대해 실제 수분 로그를 기반으로 stats를 계산하고 AI를 호출해야 한다", async () => {
      mockTravelRepository.getPlanetActivityData.mockResolvedValue({
        meals: [],
        waterLogs: [
          { id: 1, amount: 500, created_at: new Date() },
          { id: 2, amount: 250, created_at: new Date() },
        ],
        exerciseLogs: [],
        emotionLogs: [],
      } as never);

      mockAiService.generatePlanetReport.mockResolvedValue({
        title: "수분 행성 정복!",
        markdown: "충분한 수분을 섭취하셨습니다.",
        nextActionChecks: ["하루 2L 마시기"],
      } as never);

      mockTravelRepository.savePlanetReport.mockImplementation(
        async (data: any) =>
          ({
            id: BigInt(10),
            report_uuid: data.report_uuid,
            headline: data.headline,
          }) as never,
      );

      const res = await travelService.generateStarPlanetReport(1, "water", 1);

      expect(mockTravelRepository.getPlanetActivityData).toHaveBeenCalled();
      expect(mockAiService.generatePlanetReport).toHaveBeenCalled();
      expect(res.headline).toBe("수분 행성 정복!");
      expect(mockTravelRepository.savePlanetReport).toHaveBeenCalledWith(
        expect.objectContaining({
          planet_id: "water",
          stats: JSON.stringify({
            totalIntakeCount: 2,
            totalIntakeMl: 750,
            avgDailyIntakeMl: 250,
          }),
          is_fallback: false,
        }),
      );
    });

    it("식사별 행성에 대해 실제 식사 및 이미지 로그를 기반으로 stats를 계산해야 한다", async () => {
      mockTravelRepository.getPlanetActivityData.mockResolvedValue({
        meals: [
          {
            id: 1,
            meal_type: "LUNCH",
            total_calories_kcal: 700,
            meal_images: [{ id: 1 }],
            meal_items: [{ custom_food_name: "비빔밥" }],
          },
          {
            id: 2,
            meal_type: "DINNER",
            total_calories_kcal: 500,
            meal_images: [],
            meal_items: [{ custom_food_name: "샐러드" }],
          },
        ],
        waterLogs: [],
        exerciseLogs: [],
        emotionLogs: [],
      } as never);

      mockAiService.generatePlanetReport.mockResolvedValue({
        title: "식사 리포트 완료",
        markdown: "균형 잡힌 식단입니다.",
      } as never);

      mockTravelRepository.savePlanetReport.mockImplementation(
        async (data: any) =>
          ({
            id: BigInt(11),
            report_uuid: data.report_uuid,
            headline: data.headline,
          }) as never,
      );

      const res = await travelService.generateStarPlanetReport(1, "meal", 2);

      expect(res.headline).toBe("식사 리포트 완료");
      expect(mockTravelRepository.savePlanetReport).toHaveBeenCalledWith(
        expect.objectContaining({
          planet_id: "meal",
          stats: JSON.stringify({
            totalMeals: 2,
            avgCaloriesKcal: 600,
            totalCaloriesKcal: 1200,
          }),
          activity_breakdown: JSON.stringify({
            photoAnalysis: 1,
            manualLog: 1,
          }),
        }),
      );
    });

    it("감정별 행성에 대해 주요 감정과 마인드풀니스 피드백을 계산해야 한다", async () => {
      mockTravelRepository.getPlanetActivityData.mockResolvedValue({
        meals: [],
        waterLogs: [],
        exerciseLogs: [],
        emotionLogs: [
          { id: 1, emotion_type: "HAPPY", category: "EMOTION" },
          {
            id: 2,
            emotion_type: "HAPPY",
            category: "JOURNAL",
            journal_content: "오늘 좋은 날",
          },
        ],
      } as never);

      mockAiService.generatePlanetReport.mockResolvedValue({
        title: "마음 힐링 완료",
        markdown: "행복한 감정이 주를 이루었습니다.",
      } as never);

      mockTravelRepository.savePlanetReport.mockImplementation(
        async (data: any) =>
          ({
            id: BigInt(12),
            report_uuid: data.report_uuid,
            headline: data.headline,
          }) as never,
      );

      await travelService.generateStarPlanetReport(1, "emotion", 1);

      expect(mockTravelRepository.savePlanetReport).toHaveBeenCalledWith(
        expect.objectContaining({
          planet_id: "emotion",
          stats: JSON.stringify({
            totalActivities: 2,
            dominantEmotion: "HAPPY",
          }),
          activity_breakdown: JSON.stringify({
            emotionRecord: 1,
            diary: 1,
          }),
          mindfulness_feedback:
            expect.stringContaining("안정적이고 긍정적인 감정 상태"),
        }),
      );
    });

    it("AI 서비스 호출 실패 시 is_fallback이 true로 설정되지만 계산된 stats는 유지되어야 한다", async () => {
      mockTravelRepository.getPlanetActivityData.mockResolvedValue({
        meals: [],
        waterLogs: [{ id: 1, amount: 1000, created_at: new Date() }],
        exerciseLogs: [],
        emotionLogs: [],
      } as never);

      mockAiService.generatePlanetReport.mockRejectedValue(
        new Error("AI Server Timeout"),
      );

      mockTravelRepository.savePlanetReport.mockImplementation(
        async (data: any) =>
          ({
            id: BigInt(13),
            report_uuid: data.report_uuid,
            headline: data.headline,
          }) as never,
      );

      const res = await travelService.generateStarPlanetReport(1, "water", 1);

      expect(res.headline).toContain("탐사 여행, 잘 다녀왔어!");
      expect(mockTravelRepository.savePlanetReport).toHaveBeenCalledWith(
        expect.objectContaining({
          is_fallback: true,
          stats: JSON.stringify({
            totalIntakeCount: 1,
            totalIntakeMl: 1000,
            avgDailyIntakeMl: 333,
          }),
        }),
      );
    });
  });
});
