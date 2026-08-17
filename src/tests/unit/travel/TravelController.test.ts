import "reflect-metadata";
import { TravelController } from "../../../api/routes/TravelController";
import TravelService from "../../../services/travelService";
import { Container } from "typedi";

jest.mock("../../../services/travelService");

describe("TravelController", () => {
  let controller: TravelController;
  let mockTravelService: jest.Mocked<TravelService>;

  beforeEach(() => {
    mockTravelService = new TravelService() as jest.Mocked<TravelService>;
    Container.set(TravelService, mockTravelService);
    controller = new TravelController();
    Object.assign(controller, {
      success: jest.fn((data: unknown, message: string) => ({
        success: true,
        data,
        message,
      })),
      getUserId: jest.fn().mockReturnValue(1),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("getTravelState", () => {
    it("should return Star Travel state", async () => {
      const mockResult = {
        fuel: 100,
        planets: [],
        readyToDepart: ["water"],
      } as never;
      mockTravelService.getStarTravelState.mockResolvedValue(mockResult);

      const request = {} as never;
      await controller.getTravelState(request);

      expect(mockTravelService.getStarTravelState).toHaveBeenCalledWith(1);
      expect(
        (controller as unknown as { success: jest.Mock }).success,
      ).toHaveBeenCalledWith(
        mockResult,
        "우주여행 현황 조회가 완료되었습니다.",
      );
    });
  });

  describe("departTravel", () => {
    it("should depart travel successfully", async () => {
      const mockResult = {
        planetId: "water",
        status: "TRAVELING" as const,
        departedAt: new Date().toISOString(),
      };
      mockTravelService.departStarTravel.mockResolvedValue(mockResult);

      const request = {} as never;
      const body = { planetId: "water" };

      await controller.departTravel(request, body);

      expect(mockTravelService.departStarTravel).toHaveBeenCalledWith(1, body);
      expect(
        (controller as unknown as { success: jest.Mock }).success,
      ).toHaveBeenCalledWith(mockResult, "별여행 탐사가 시작되었습니다.");
    });
  });

  describe("arriveTravel", () => {
    it("should arrive travel successfully", async () => {
      const mockResult = {
        planetId: "water",
        status: "ARRIVED" as const,
        resetFuel: 10,
        resetDistance: 100,
        reportId: "rpt_1",
        reportStatus: "PENDING" as const,
      };
      mockTravelService.arriveStarTravel.mockResolvedValue(mockResult);

      const request = {} as never;
      const body = { planetId: "water" };

      await controller.arriveTravel(request, body);

      expect(mockTravelService.arriveStarTravel).toHaveBeenCalledWith(1, body);
      expect(
        (controller as unknown as { success: jest.Mock }).success,
      ).toHaveBeenCalledWith(mockResult, "별여행 도착 처리가 완료되었습니다.");
    });
  });

  describe("getPlanetReport", () => {
    it("should return unified planet report", async () => {
      const mockResult = {
        reportId: "rpt_1",
        status: "COMPLETED" as const,
        progressPercent: 100,
        report: {
          reportId: "rpt_1",
          planetId: "water",
          tripNumber: 1,
          headline: "Test headline",
          summary: "Test summary",
          recommendations: ["rec1"],
          tammyMotion: "BOUNCE",
          periodDays: 3,
          createdAt: new Date().toISOString(),
        },
      };
      mockTravelService.getUnifiedPlanetReport.mockResolvedValue(mockResult);

      const request = {} as never;
      await controller.getPlanetReport("rpt_1", request);

      expect(mockTravelService.getUnifiedPlanetReport).toHaveBeenCalledWith(
        "rpt_1",
        1,
      );
      expect(
        (controller as unknown as { success: jest.Mock }).success,
      ).toHaveBeenCalledWith(
        mockResult,
        "별여행 리포트 조회가 완료되었습니다.",
      );
    });
  });

  describe("getDashboardSummary", () => {
    it("should return dashboard summary", async () => {
      const mockResult = { calorieTrends: [] } as never;
      mockTravelService.getDashboard.mockResolvedValue(mockResult);

      const request = {} as never;
      await controller.getDashboardSummary(request);

      expect(mockTravelService.getDashboard).toHaveBeenCalledWith(1, "WEEKLY");
      expect(
        (controller as unknown as { success: jest.Mock }).success,
      ).toHaveBeenCalledWith(
        mockResult,
        "대시보드 통계 조회가 완료되었습니다.",
      );
    });
  });

  describe("getMonthlyRetroReport", () => {
    it("should return monthly retro report", async () => {
      const mockResult = {
        yearMonth: "2026-07",
        title: "7월 회고",
        wellnessScore: 78,
      } as never;
      mockTravelService.getMonthlyRetroReport.mockResolvedValue(mockResult);

      const request = {} as never;
      await controller.getMonthlyRetroReport("2026-07", request);

      expect(mockTravelService.getMonthlyRetroReport).toHaveBeenCalledWith(
        1,
        "2026-07",
      );
      expect(
        (controller as unknown as { success: jest.Mock }).success,
      ).toHaveBeenCalledWith(
        mockResult,
        "월간 회고 리포트 조회가 완료되었습니다.",
      );
    });
  });
});
