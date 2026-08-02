import request from "supertest";
import { getTestApp } from "./app";
import express from "express";

describe("건강 인사이트 & 온디맨드 AI 리포트 API 통합 테스트 (RPT Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it("GET /api/reports/dashboard - 상시 웰니스 대시보드 그래프 조회 검증", async () => {
    const res = await request(app).get("/api/reports/dashboard?userId=1&period=WEEKLY");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.calorieTrends)).toBe(true);
    expect(res.body).toHaveProperty("nutritionBalance");
  });

  it("POST /api/reports/ondemand - 온디맨드 AI 종합 건강 리포트 동적 생성 검증", async () => {
    const res = await request(app)
      .post("/api/reports/ondemand")
      .send({ userId: 1 });

    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("summaryTitle");
    }
  });
});
