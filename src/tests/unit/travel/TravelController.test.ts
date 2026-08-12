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
    (controller as any).success = jest.fn((data, message) => ({
      success: true,
      data,
      message,
    })) as any;
    (controller as any).getUserId = jest.fn().mockReturnValue(1) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("startPlanetTravel", () => {
    it("should start planet travel successfully", async () => {
      const mockResult: any = { fuelSpent: 10 };
      mockTravelService.startPlanetTravel.mockResolvedValue(mockResult);

      const request: any = {};
      const body: any = { planetType: PlanetType.MEAL, fuelSpent: 10 };

      const response = await controller.startPlanetTravel(request, body);
      
      expect(mockTravelService.startPlanetTravel).toHaveBeenCalledWith(1, body);
      expect((controller as any).success).toHaveBeenCalledWith(mockResult, "별여행 탐사가 성공적으로 시작되었습니다.");
    });
  });

  describe("getTravelState", () => {
    it("should return travel state", async () => {
      const mockResult: any = { progressPercent: 50 };
      mockTravelService.getTravelState.mockResolvedValue(mockResult);

      const request: any = {};
      await controller.getTravelState(request);

      expect(mockTravelService.getTravelState).toHaveBeenCalledWith(1);
      expect((controller as any).success).toHaveBeenCalledWith(mockResult, "우주여행 현황 조회가 완료되었습니다.");
    });
  });

  describe("getTravelResult", () => {
    it("should return travel result detail", async () => {
      const mockResult: any = {
        id: "1",
        userId: 1,
        planetType: "MEAL",
        title: "Test",
        summaryContent: "Summary",
        recommendations: "Recs",
        createdAt: new Date().toISOString()
      };
      mockTravelService.getTravelResultById.mockResolvedValue(mockResult);

      const request: any = {};
      await controller.getTravelResult("1", request);

      expect(mockTravelService.getTravelResultById).toHaveBeenCalledWith("1", 1);
      expect((controller as any).success).toHaveBeenCalled();
    });
  });

  describe("getDashboardSummary", () => {
    it("should return dashboard summary", async () => {
      const mockResult: any = { calorieTrends: [] };
      mockTravelService.getDashboard.mockResolvedValue(mockResult);

      const request: any = {};
      await controller.getDashboardSummary(request);

      expect(mockTravelService.getDashboard).toHaveBeenCalledWith(1, "WEEKLY");
      expect((controller as any).success).toHaveBeenCalledWith(mockResult, "대시보드 통계 조회가 완료되었습니다.");
    });
  });
});
