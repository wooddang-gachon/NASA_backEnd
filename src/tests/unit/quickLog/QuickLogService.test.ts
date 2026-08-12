import "reflect-metadata";
import { Container } from "typedi";
import QuickLogService from "../../../services/quickLogService";
import QuickLogRepository from "../../../repositories/QuickLogRepository";
import { QuickLogMapper } from "../../../mappers";

jest.mock("../../../mappers", () => ({
  QuickLogMapper: {
    toCreateInput: jest.fn(),
    toApiResponse: jest.fn(),
  },
}));

jest.mock("../../../constants/gamification", () => ({
  FUEL_REWARDS: {
    QUICK_LOG: 5,
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

  beforeEach(() => {
    mockQuickLogRepository = {
      createQuickLog: jest.fn(),
      updateUserFuel: jest.fn(),
    } as any;

    Container.set(QuickLogRepository, mockQuickLogRepository);
    service = Container.get(QuickLogService);
  });

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe("createQuickLog", () => {
    it("should create a quick log and update user fuel correctly", async () => {
      const userId = 1;
      const data = { category: "MOOD", content: "Happy" } as any;
      const mappedInput = { user_id: userId, category: "MOOD", earned_fuel: 5 };
      const createdLog = { id: 100, user_id: userId, category: "MOOD" };
      const updatedUser = { id: userId, current_fuel: 105 };
      const apiResponse = { id: 100, category: "MOOD", current_fuel: 105 };

      (QuickLogMapper.toCreateInput as jest.Mock).mockReturnValue(mappedInput);
      mockQuickLogRepository.createQuickLog.mockResolvedValue(createdLog as any);
      mockQuickLogRepository.updateUserFuel.mockResolvedValue(updatedUser as any);
      (QuickLogMapper.toApiResponse as jest.Mock).mockReturnValue(apiResponse);

      const result = await service.createQuickLog(userId, data);

      expect(QuickLogMapper.toCreateInput).toHaveBeenCalledWith(userId, data, 5);
      expect(mockQuickLogRepository.createQuickLog).toHaveBeenCalledWith(mappedInput);
      expect(mockQuickLogRepository.updateUserFuel).toHaveBeenCalledWith(userId, 5);
      expect(QuickLogMapper.toApiResponse).toHaveBeenCalledWith(createdLog, 105);

      expect(result).toEqual({
        success: true,
        data: apiResponse,
      });
    });

    it("should handle undefined current_fuel gracefully", async () => {
      const userId = 1;
      const data = { category: "DIARY" } as any;
      
      mockQuickLogRepository.createQuickLog.mockResolvedValue({ id: 101 } as any);
      // Return user without current_fuel
      mockQuickLogRepository.updateUserFuel.mockResolvedValue({ id: userId } as any);
      (QuickLogMapper.toApiResponse as jest.Mock).mockReturnValue({ id: 101, current_fuel: 0 });

      const result = await service.createQuickLog(userId, data);

      expect(mockQuickLogRepository.updateUserFuel).toHaveBeenCalledWith(userId, 5);
      expect(QuickLogMapper.toApiResponse).toHaveBeenCalledWith({ id: 101 }, 0);
      expect((result.data as any).current_fuel).toBe(0);
    });
  });
});
