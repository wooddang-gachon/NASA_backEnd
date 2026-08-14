import request from "supertest";
import { getTestApp } from "../setup/app";
import express from "express";

describe("사진 비전 분석 & 식단 확정 API 통합 테스트 (FOD Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  describe("식단 확정 및 보상 지급 기능", () => {
    it("[성공 사례] POST /api/food-log/confirm - 식단 데이터 확정 등록 및 연료 보상 지급", async () => {
      const res = await request(app)
        .post("/api/v1/food-log/confirm")
        .send({
          mealType: "LUNCH",
          imageId: "123",
          foods: [
            {
              foodName: "연어 샐러드",
              gram: 200,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("mealId");
      expect(res.body.data.earnedFuel).toBe(50);
    });

    it("[실패 사례] POST /api/food-log/confirm - 필수 식사 타입(mealType) 누락 시 400 에러 반환", async () => {
      const res = await request(app).post("/api/v1/food-log/confirm").send({
        foods: [],
      });

      expect(res.status).toBe(400);
    });
  });
});
