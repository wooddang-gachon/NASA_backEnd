import request from "supertest";
import express from "express";
import { getTestApp } from "../setup/app";

describe("1-Tap 퀵버튼 데일리 기록 API 통합 테스트 (/api/quick-log)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  describe("POST /api/quick-log - 수분(WATER) 섭취 퀵로그 기록 기능", () => {
    it("[성공 사례] 정상적인 수분 섭취 250ml 기록 시 로그 생성 및 연료 10 적립", async () => {
      const payload = {
        category: "WATER",
        amount: 250,
      };

      const res = await request(app).post("/api/v1/quick-log").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("logId");
      expect(res.body.data.category).toBe("WATER");
      expect(res.body.data.earnedFuel).toBe(10);
      expect(typeof res.body.data.totalFuel).toBe("number");
    });
  });

  describe("POST /api/quick-log - 감정(EMOTION) / 일기 퀵로그 기록 기능", () => {
    it("[성공 사례] 기분 타입과 저널 본문을 함께 제출 시 정상 등록", async () => {
      const payload = {
        category: "EMOTION",
        emotionType: "HAPPY",
        journalContent: "오늘 프로젝트 스키마 재구축 성공!",
      };

      const res = await request(app).post("/api/v1/quick-log").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.earnedFuel).toBe(10);
    });
  });

  describe("POST /api/quick-log - 예외 및 실패 처리 검증", () => {
    it("[실패 사례] 필수 카테고리(category) 누락 시 400 Bad Request 에러 반환", async () => {
      const invalidPayload = {
        amount: 500, // category 필드가 누락됨
      };

      const res = await request(app)
        .post("/api/v1/quick-log")
        .send(invalidPayload);

      expect(res.status).toBe(400);
    });

    it("[실패 사례] 유효하지 않은 카테고리 값 전송 시 400 에러 반환", async () => {
      const invalidCategoryPayload = {
        category: "INVALID_CATEGORY_NAME",
      };

      const res = await request(app)
        .post("/api/v1/quick-log")
        .send(invalidCategoryPayload);

      expect(res.status).toBe(400);
    });
  });
});
