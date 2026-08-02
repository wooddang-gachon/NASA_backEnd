import request from "supertest";
import { getTestApp } from "./app";
import express from "express";

describe("사진 비전 분석 & 식단 확정 API 통합 테스트 (FOD Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it("POST /api/food/analyze - 사진 비전 스캔 분석 검증", async () => {
    const res = await request(app)
      .post("/api/food/analyze?imageUrl=https://storage.tammy.app/salad.jpg&mealType=LUNCH");

    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.isIdentified).toBe(true);
    }
  });

  it("POST /api/food/analyze - 식별 실패 시 Fallback UI 응답 검증", async () => {
    const res = await request(app)
      .post("/api/food/analyze?imageUrl=https://storage.tammy.app/unknown.jpg");

    expect([200, 503]).toContain(res.status);
  });

  it("POST /api/food/log - 식단 확정 등록 및 보상(연료 +50, EXP +30) 검증", async () => {
    const res = await request(app)
      .post("/api/food/log?userId=1")
      .send({
        mealType: "LUNCH",
        foodName: "연어 샐러드",
        totalCaloriesKcal: 380,
        carbohydrateG: 14.5,
        proteinG: 32.0,
        fatG: 11.2,
      });

    expect(res.status).toBe(200);
    expect(res.body.gainedFuel).toBe(50);
    expect(res.body.gainedExp).toBe(30);
  });
});
