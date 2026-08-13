import "reflect-metadata";
import TravelService from "../../../services/travelService";
import AiService from "../../../services/aiService";
import TravelRepository from "../../../repositories/TravelRepository";
import { Container } from "typedi";
import { UserNotFoundError, BadRequestError } from "../../../errors";
import { PlanetType } from "../../../interfaces/enums";

jest.mock("../../../services/aiService");
jest.mock("../../../repositories/TravelRepository");

describe("TravelService", () => {
  let travelService: TravelService;
  let mockAiService: jest.Mocked<AiService>;
  let mockTravelRepository: jest.Mocked<TravelRepository>;

  beforeEach(() => {
    mockAiService = new AiService() as jest.Mocked<AiService>;
    mockTravelRepository =
      new TravelRepository() as jest.Mocked<TravelRepository>;

    Container.set(AiService, mockAiService);
    Container.set(TravelRepository, mockTravelRepository);

    travelService = Container.get(TravelService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("startPlanetTravel", () => {
    it("should throw UserNotFoundError if user not found", async () => {
      mockTravelRepository.findUserById.mockResolvedValue(null);

      await expect(
        travelService.startPlanetTravel(1, {
          planetType: PlanetType.MEAL,
          fuelSpent: 10,
        } as never),
      ).rejects.toThrow(UserNotFoundError);
    });

    it("should throw BadRequestError if already traveling", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({
        current_fuel: 100,
      } as never);
      mockTravelRepository.findActivePlanetTravelByUser.mockResolvedValue({
        id: BigInt(1),
      } as never);

      await expect(
        travelService.startPlanetTravel(1, {
          planetType: PlanetType.MEAL,
          fuelSpent: 10,
        } as never),
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if fuel is insufficient", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({
        current_fuel: 5,
      } as never);
      mockTravelRepository.findActivePlanetTravelByUser.mockResolvedValue(null);

      await expect(
        travelService.startPlanetTravel(1, {
          planetType: PlanetType.MEAL,
          fuelSpent: 10,
        } as never),
      ).rejects.toThrow(BadRequestError);
    });

    it("should start travel and return result", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({
        current_fuel: 100,
        nickname: "test",
      } as never);
      mockTravelRepository.findActivePlanetTravelByUser.mockResolvedValue(null);
      mockTravelRepository.updateUserFuel.mockResolvedValue({
        current_fuel: 90,
      } as never);

      mockAiService.generatePlanetReport.mockResolvedValue({
        title: "Test",
        markdown: "Summary",
        nextActionChecks: ["Action 1"],
      } as never);

      mockTravelRepository.createPlanetTravel.mockResolvedValue({
        id: BigInt(1),
        user_id: 1,
        planet_type: PlanetType.MEAL,
        started_at: new Date(),
      } as never);

      const result = await travelService.startPlanetTravel(1, {
        planetType: PlanetType.MEAL,
        fuelSpent: 10,
      } as never);

      expect(result).toBeDefined();
      expect(mockTravelRepository.updateUserFuel).toHaveBeenCalledWith(
        1,
        10,
        "decrement",
      );
      expect(mockAiService.generatePlanetReport).toHaveBeenCalled();
      expect(mockTravelRepository.createPlanetTravel).toHaveBeenCalled();
    });
  });

  describe("getTravelState", () => {
    it("should throw UserNotFoundError if user not found", async () => {
      mockTravelRepository.findUserWithTammyStatus.mockResolvedValue(null);

      await expect(travelService.getTravelState(1)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it("should return travel state", async () => {
      mockTravelRepository.findUserWithTammyStatus.mockResolvedValue(
        {} as never,
      );
      mockTravelRepository.findActivePlanetTravelByUser.mockResolvedValue(null);
      mockTravelRepository.findCompletedPlanetTravelsByUser.mockResolvedValue(
        [],
      );
      mockTravelRepository.getPlanetActionCounts.mockResolvedValue({} as never);

      const result = await travelService.getTravelState(1);
      expect(result).toBeDefined();
    });
  });

  describe("addFuel", () => {
    it("should add fuel successfully", async () => {
      mockTravelRepository.findUserById.mockResolvedValue({} as never);
      mockTravelRepository.updateUserFuel.mockResolvedValue({
        current_fuel: 10,
      } as never);

      const result = await travelService.addFuel(1);
      expect(result.currentFuel).toBe(10);
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
});
