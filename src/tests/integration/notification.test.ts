import request from "supertest";
import { getTestApp } from "../setup/app";
import express from "express";
import NotificationService from "../../services/notificationService";

describe("푸시 알림 API 통합 테스트 (Notification Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(() => {
    jest
      .spyOn(NotificationService.prototype, "registerPushToken")
      .mockResolvedValue({
        userId: 1,
        deviceToken: "mock_device_token",
        success: true,
        message: "푸시 토큰이 정상적으로 등록되었습니다.",
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("디바이스 푸시 토큰 등록", () => {
    it("POST /api/notifications/push-token - 토큰 등록 성공", async () => {
      const res = await request(app)
        .post("/api/v1/notifications/push-token")
        .set("Authorization", "Bearer mock_test_token")
        .send({
          deviceToken: "mock_device_token",
          deviceType: "IOS",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.deviceToken).toBe("mock_device_token");
    });

    it("POST /api/notifications/push-token - 필수 파라미터 누락", async () => {
      const res = await request(app)
        .post("/api/v1/notifications/push-token")
        .set("Authorization", "Bearer mock_test_token")
        .send({}); // deviceToken 누락

      // tsoa validation error (mapped to 400 Bad Request in this project)
      expect(res.status).toBe(400);
    });
  });
});
