import request from "supertest";
import { getTestApp } from "./app";
import express from "express";

describe("타미 별여행 & 1-Tap 데일리 케어 API 통합 테스트 (TRV / CARE / WKO)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it("POST /api/care/water - 1-Tap 수분 섭취(250ml) 및 연료(+10) 검증", async () => {
    const res = await request(app)
      .post("/api/care/water")
      .send({ userId: 1, intakeMl: 250 });

    expect(res.status).toBe(200);
    expect(res.body.gainedFuel).toBe(10);
    expect(res.body.todayTotalWaterMl).toBeGreaterThanOrEqual(250);
  });

  it("POST /api/exercise/log - 1-Tap 오늘 운동 완 기록 및 연료(+30) 검증", async () => {
    const res = await request(app)
      .post("/api/exercise/log")
      .send({ userId: 1, memo: "저녁 산책 20분 완료!" });

    expect(res.status).toBe(200);
    expect(res.body.gainedFuel).toBe(30);
  });

  it("GET /api/travel/state - 별여행 탐사 상태 및 보유 연료 검증", async () => {
    const res = await request(app).get("/api/travel/state?userId=1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("currentPlanet");
    expect(res.body).toHaveProperty("explorationProgressPercent");
    expect(res.body).toHaveProperty("currentFuel");
  });
});
