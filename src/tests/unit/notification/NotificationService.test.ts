import "reflect-metadata";
import { Container } from "typedi";

// Mock Firebase admin BEFORE importing the service to prevent initialization issues
jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
  getApps: jest.fn().mockReturnValue([]),
}));

const mockSendEachForMulticast = jest.fn();
jest.mock("firebase-admin/messaging", () => ({
  getMessaging: jest.fn(() => ({
    sendEachForMulticast: mockSendEachForMulticast,
  })),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
}));

jest.mock("../../../loaders/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

import NotificationService from "../../../services/notificationService";
import NotificationRepository from "../../../repositories/NotificationRepository";
import { getApps } from "firebase-admin/app";

describe("NotificationService", () => {
  let service: NotificationService;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    mockNotificationRepository = {
      upsertPushToken: jest.fn(),
      findActivePushTokens: jest.fn(),
    } as never;

    Container.set(NotificationRepository, mockNotificationRepository);
    service = Container.get(NotificationService);
  });

  afterEach(() => {
    Container.reset();
    jest.clearAllMocks();
  });

  describe("registerPushToken", () => {
    it("should register push token with default IOS type if deviceType is not provided", async () => {
      mockNotificationRepository.upsertPushToken.mockResolvedValue({} as never);

      const result = await service.registerPushToken(1, {
        deviceToken: "token-123",
      } as never);

      expect(mockNotificationRepository.upsertPushToken).toHaveBeenCalledWith(
        1,
        "token-123",
        "IOS",
      );
      expect(result).toEqual({
        success: true,
        message: "디바이스 푸시 토큰이 성공적으로 등록되었습니다.",
      });
    });

    it("should register push token with provided deviceType", async () => {
      mockNotificationRepository.upsertPushToken.mockResolvedValue({} as never);

      await service.registerPushToken(1, {
        deviceToken: "token-123",
        deviceType: "ANDROID",
      } as never);

      expect(mockNotificationRepository.upsertPushToken).toHaveBeenCalledWith(
        1,
        "token-123",
        "ANDROID",
      );
    });
  });

  describe("sendPushNotification", () => {
    it("should return false if no active tokens found", async () => {
      mockNotificationRepository.findActivePushTokens.mockResolvedValue([]);

      const result = await service.sendPushNotification({
        userId: 1,
        title: "Test",
        body: "Message",
      } as never);

      expect(result).toBe(false);
      expect(
        mockNotificationRepository.findActivePushTokens,
      ).toHaveBeenCalledWith(1);
    });

    it("should send notification successfully to all active tokens", async () => {
      mockNotificationRepository.findActivePushTokens.mockResolvedValue([
        { device_token: "token1" },
        { device_token: "token2" },
      ] as never);

      // We spy on sendMulticastPushNotification
      const multicastSpy = jest
        .spyOn(service, "sendMulticastPushNotification")
        .mockResolvedValue({ successCount: 2, failureCount: 0 });

      const result = await service.sendPushNotification({
        userId: 1,
        title: "Test",
        body: "Message",
        data: { key: "value" },
      } as never);

      expect(result).toBe(true);
      expect(multicastSpy).toHaveBeenCalledWith(
        ["token1", "token2"],
        "Test",
        "Message",
        {
          key: "value",
        },
      );
    });
  });

  describe("sendMulticastPushNotification", () => {
    it("should return immediately if deviceTokens array is empty", async () => {
      const result = await service.sendMulticastPushNotification(
        [],
        "Title",
        "Body",
      );
      expect(result).toEqual({ successCount: 0, failureCount: 0 });
    });

    it("should simulate send in sandbox mode if Firebase not initialized", async () => {
      (getApps as jest.Mock).mockReturnValue([]); // Sandbox mode

      const tokens = Array.from({ length: 1500 }, (_, i) => `token-${i}`); // 3 chunks
      const result = await service.sendMulticastPushNotification(
        tokens,
        "Title",
        "Body",
      );

      expect(result).toEqual({ successCount: 1500, failureCount: 0 });
      expect(mockSendEachForMulticast).not.toHaveBeenCalled();
    });

    it("should chunk tokens and use messaging.sendEachForMulticast if Firebase initialized", async () => {
      (getApps as jest.Mock).mockReturnValue([{}]); // Initialized mode
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 500,
        failureCount: 0,
      });

      const tokens = Array.from({ length: 600 }, (_, i) => `token-${i}`); // 2 chunks
      const result = await service.sendMulticastPushNotification(
        tokens,
        "Title",
        "Body",
      );

      expect(result).toEqual({ successCount: 1000, failureCount: 0 }); // Two chunks mock resolved to 500 each
      expect(mockSendEachForMulticast).toHaveBeenCalledTimes(2);
    });

    it("should handle error during chunk dispatch in initialized mode", async () => {
      (getApps as jest.Mock).mockReturnValue([{}]);
      mockSendEachForMulticast.mockRejectedValue(new Error("Network Error"));

      const tokens = ["token1", "token2"];
      const result = await service.sendMulticastPushNotification(
        tokens,
        "Title",
        "Body",
      );

      expect(result).toEqual({ successCount: 0, failureCount: 2 });
    });
  });
});
