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
});
