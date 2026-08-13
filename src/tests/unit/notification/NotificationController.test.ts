import "reflect-metadata";
import { Container } from "typedi";
import { NotificationController } from "../../../api/routes/NotificationController";
import NotificationService from "../../../services/notificationService";
import { AuthenticatedRequest } from "../../../interfaces/express";

describe("NotificationController", () => {
  let controller: NotificationController;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    mockNotificationService = {
      registerPushToken: jest.fn(),
      sendPushNotification: jest.fn(),
      sendMulticastPushNotification: jest.fn(),
    } as never;

    Container.set(NotificationService, mockNotificationService);
    controller = new NotificationController();

    Object.assign(controller, {
      getUserId: jest.fn().mockReturnValue(1),
      success: jest
        .fn()
        .mockImplementation((data: unknown, message: string) => ({
          data,
          message,
        })),
    });
  });

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe("registerPushToken", () => {
    it("should register push token successfully", async () => {
      const mockReq = {} as AuthenticatedRequest;
      const requestBody = { deviceToken: "test-token", deviceType: "IOS" };
      const mockServiceResult = {
        success: true,
        message: "디바이스 푸시 토큰이 성공적으로 등록되었습니다.",
      };

      mockNotificationService.registerPushToken.mockResolvedValue(
        mockServiceResult,
      );

      const result = await controller.registerPushToken(
        mockReq,
        requestBody as never,
      );

      expect(mockNotificationService.registerPushToken).toHaveBeenCalledWith(
        1,
        requestBody,
      );
      expect(result).toEqual({
        data: mockServiceResult,
        message: "푸시 토큰 등록이 완료되었습니다.",
      });
    });
  });
});
