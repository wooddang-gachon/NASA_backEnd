import request from "supertest";
import { getTestApp } from "../setup/app";
import express from "express";
import AuthService from "../../services/authService";

describe("인증 및 회원가입 API 통합 테스트 (Auth Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.spyOn(AuthService.prototype, "signUp").mockResolvedValue({
      user: {
        id: 2,
        email: "new@example.com",
        nickname: "뉴비",
        authProvider: "LOCAL",
      },
      accessToken: "mock_access_token",
      refreshToken: "mock_refresh_token",
    });

    jest.spyOn(AuthService.prototype, "login").mockResolvedValue({
      user: {
        id: 1,
        email: "testuser@example.com",
        nickname: "우당탕탕",
        authProvider: "LOCAL",
      },
      accessToken: "mock_access_token",
      refreshToken: "mock_refresh_token",
    });

    jest.spyOn(AuthService.prototype, "socialLogin").mockResolvedValue({
      user: {
        id: 1,
        email: "social@example.com",
        nickname: "소셜유저",
        authProvider: "KAKAO",
      },
      accessToken: "mock_social_token",
      refreshToken: "mock_social_refresh",
    });

    jest.spyOn(AuthService.prototype, "refresh").mockResolvedValue({
      accessToken: "new_mock_access_token",
      refreshToken: "new_mock_refresh_token",
    });

    jest.spyOn(AuthService.prototype, "withdraw").mockResolvedValue({
      success: true,
      message: "회원 탈퇴가 완료되었습니다.",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("회원가입 (Sign Up)", () => {
    it("POST /api/auth/signup - 정상적인 회원가입", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        email: "new@example.com",
        password: "Password123!",
        nickname: "뉴비",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe("new@example.com");
      expect(res.body.data.accessToken).toBe("mock_access_token");
    });
  });

  describe("로그인 (Login)", () => {
    it("POST /api/auth/login - 정상적인 로그인", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "testuser@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("testuser@example.com");
      expect(res.body.data.accessToken).toBe("mock_access_token");
    });
  });

  describe("소셜 로그인 (Social Login)", () => {
    it("POST /api/auth/social-login - 카카오 로그인", async () => {
      const res = await request(app).post("/api/v1/auth/social-login").send({
        provider: "KAKAO",
        token: "mock_kakao_token",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.authProvider).toBe("KAKAO");
    });
  });

  describe("토큰 갱신 (Token Refresh)", () => {
    it("POST /api/auth/refresh - 토큰 재발급", async () => {
      const res = await request(app).post("/api/v1/auth/refresh").send({
        refreshToken: "old_refresh_token",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBe("new_mock_access_token");
    });
  });

  describe("회원 탈퇴 (Withdraw)", () => {
    it("DELETE /api/auth/withdraw - 정상 탈퇴", async () => {
      const res = await request(app)
        .delete("/api/v1/auth/withdraw")
        .set("Authorization", "Bearer mock_test_token")
        .send({
          reason: "안 써서요",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });
});
