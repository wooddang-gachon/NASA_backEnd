import "reflect-metadata";
import { Container } from "typedi";
import QuickLogService from "../../../services/quickLogService";
import QuickLogRepository from "../../../repositories/QuickLogRepository";
import TravelRepository from "../../../repositories/TravelRepository";
import { QuickLogMapper } from "../../../mappers";

jest.mock("../../../mappers", () => ({
  QuickLogMapper: {
    toCreateInput: jest.fn(),
    toApiResponse: jest.fn(),
  },
}));

jest.mock("../../../constants/gamification", () => ({
  DEFAULT_FUEL_GAIN: 10,
  DISTANCE_REDUCTIONS: {
    WATER_LOG: 5,
    EMOTION_QUICK: 5,
    EMOTION_DIARY: 10,
    EXERCISE_LOG: 10,
  },
}));

jest.mock("../../../loaders/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe("QuickLogService", () => {
  let service: QuickLogService;
  let mockQuickLogRepository: jest.Mocked<QuickLogRepository>;
  let mockTravelRepository: jest.Mocked<TravelRepository>;

  beforeEach(() => {
    mockQuickLogRepository = {
      create: jest.fn(),
      createQuickLog: jest.fn(),
      createQuickLogAndFuelTransaction: jest.fn(),
    } as never;

    mockTravelRepository = {
      recordActivityAndGauge: jest.fn().mockResolvedValue({
        isDuplicateRequest: false,
        gainedFuel: 10,
        distanceReduced: 5,
        currentFuel: 10,
        currentDistance: 95,
        planetId: "water",
      }),
    } as never;

    Container.set(QuickLogRepository, mockQuickLogRepository);
    Container.set(TravelRepository, mockTravelRepository);
    service = Container.get(QuickLogService);
  });

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe("createQuickLog", () => {
    it("should create a quick log and update Two-Gauge correctly", async () => {
      const userId = 1;
      const data = { category: "WATER", amount: 250 } as never;
      const mappedInput = {
        user_id: userId,
        category: "WATER",
        earned_fuel: 10,
      };
      const createdLog = { id: 100, user_id: userId, category: "WATER" };
      const apiResponse = {
        logId: "100",
        category: "WATER",
        totalFuel: 10,
        gainedFuel: 10,
      };

      (QuickLogMapper.toCreateInput as jest.Mock).mockReturnValue(mappedInput);
      mockQuickLogRepository.create.mockResolvedValue(createdLog as never);
      (QuickLogMapper.toApiResponse as jest.Mock).mockReturnValue(apiResponse);

      const result = await service.createQuickLog(userId, data);

      expect(QuickLogMapper.toCreateInput).toHaveBeenCalledWith(
        userId,
        data,
        10,
      );
      expect(mockQuickLogRepository.create).toHaveBeenCalledWith(mappedInput);
      expect(mockTravelRepository.recordActivityAndGauge).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: apiResponse,
      });
    });
  });
});
