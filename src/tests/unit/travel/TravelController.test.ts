import "reflect-metadata";
import { TravelController } from "../../../api/routes/TravelController";
import TravelService from "../../../services/travelService";
import { Container } from "typedi";
import { PlanetType } from "../../../interfaces/enums";

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

  describe("startPlanetTravel", () => {
    it("should start planet travel successfully", async () => {
      const mockResult = { fuelSpent: 10 } as never;
      mockTravelService.startPlanetTravel.mockResolvedValue(mockResult);

      const request = {} as never;
      const body = { planetType: PlanetType.MEAL, fuelSpent: 10 } as never;

      await controller.startPlanetTravel(request, body);

      expect(mockTravelService.startPlanetTravel).toHaveBeenCalledWith(1, body);
      expect(
        (controller as unknown as { success: jest.Mock }).success,
      ).toHaveBeenCalledWith(
        mockResult,
        "별여행 탐사가 성공적으로 시작되었습니다.",
      );
    });
  });

  describe("getTravelState", () => {
    it("should return travel state", async () => {
      const mockResult = { progressPercent: 50 } as never;
      mockTravelService.getTravelState.mockResolvedValue(mockResult);

      const request = {} as never;
      await controller.getTravelState(request);

      expect(mockTravelService.getTravelState).toHaveBeenCalledWith(1);
      expect(
        (controller as unknown as { success: jest.Mock }).success,
      ).toHaveBeenCalledWith(
        mockResult,
        "우주여행 현황 조회가 완료되었습니다.",
      );
    });
  });

  describe("getTravelResult", () => {
    it("should return travel result detail", async () => {
      const mockResult = {
        id: "1",
        userId: 1,
        planetType: "MEAL",
        title: "Test",
        summaryContent: "Summary",
        recommendations: "Recs",
        createdAt: new Date().toISOString(),
      };
      mockTravelService.getTravelResultById.mockResolvedValue(mockResult as never);

      const request = {} as never;
      await controller.getTravelResult("1", request);

      expect(mockTravelService.getTravelResultById).toHaveBeenCalledWith(
        "1",
        1,
      );
      expect(
        (controller as unknown as { success: jest.Mock }).success,
      ).toHaveBeenCalled();
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
});
