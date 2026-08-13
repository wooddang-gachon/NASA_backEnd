import "reflect-metadata";
import { Container } from "typedi";
import { QuickLogController } from "../../../api/routes/QuickLogController";
import QuickLogService from "../../../services/quickLogService";
import { AuthenticatedRequest } from "../../../interfaces/express";

describe("QuickLogController", () => {
  let controller: QuickLogController;
  let mockQuickLogService: jest.Mocked<QuickLogService>;

  beforeEach(() => {
    mockQuickLogService = {
      createQuickLog: jest.fn(),
    } as never;

    Container.set(QuickLogService, mockQuickLogService);
    controller = new QuickLogController();

    controller.setStatus = jest.fn();
    Object.assign(controller, {
      getUserId: jest.fn().mockReturnValue(1),
      success: jest
        .fn()
        .mockImplementation(
          (data: unknown, message: string, status: number) => ({
            data,
            message,
            status,
          }),
        ),
      error: jest
        .fn()
        .mockImplementation((message: string, status: number) => ({
          message,
          status,
        })),
    });
  });

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe("createQuickLog", () => {
    it("should return 400 error when category is WATER and amount is undefined", async () => {
      const mockReq = {} as AuthenticatedRequest;
      const result = await controller.createQuickLog(mockReq, {
        category: "WATER",
        content: "test",
      } as never);

      expect(controller.setStatus).toHaveBeenCalledWith(400);
      expect(mockQuickLogService.createQuickLog).not.toHaveBeenCalled();
    });

    it("should return 400 error when category is WATER and amount is less than 0", async () => {
      const mockReq = {} as AuthenticatedRequest;
      const result = await controller.createQuickLog(mockReq, {
        category: "WATER",
        amount: -1,
        content: "test",
      } as any);

      expect(controller.setStatus).toHaveBeenCalledWith(400);
      expect(mockQuickLogService.createQuickLog).not.toHaveBeenCalled();
    });

    it("should successfully create quick log", async () => {
      const mockReq = {} as AuthenticatedRequest;
      const mockServiceResult = {
        success: true,
        data: {
          id: 1,
          category: "MOOD",
          content: "Good",
          earned_fuel: 5,
          current_fuel: 10,
        },
      };
      mockQuickLogService.createQuickLog.mockResolvedValue(
        mockServiceResult as never,
      );

      const result = await controller.createQuickLog(mockReq, {
        category: "MOOD",
        content: "Good",
      } as any);

      expect(mockQuickLogService.createQuickLog).toHaveBeenCalledWith(1, {
        category: "MOOD",
        content: "Good",
      });
      expect(result).toEqual({
        data: mockServiceResult.data,
        message: "퀵기록이 성공적으로 등록되었습니다.",
        status: 201,
      });
    });
  });
});
