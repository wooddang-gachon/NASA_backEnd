import request from "supertest";
import { getTestApp } from "./app";
import express from "express";

describe("타미 별여행 API 통합 테스트 (TRV)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  describe("별여행 탐사 (Planet Travel) 기능", () => {
    it("[성공 사례] GET /api/planet-travel/state - 별여행 탐사 상태 및 보유 연료 정상 조회", async () => {
      const res = await request(app).get("/api/planet-travel/state");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("currentPlanet");
      expect(res.body.data).toHaveProperty("explorationProgressPercent");
      expect(res.body.data).toHaveProperty("currentFuel");
      expect(res.body.data).toHaveProperty("totalStarCount", 5);
      expect(res.body.data).toHaveProperty("completedStarCount");
      expect(res.body.data).toHaveProperty("planetList");
      expect(Array.isArray(res.body.data.planetList)).toBe(true);
      expect(res.body.data.planetList.length).toBe(5);
      expect(res.body.data.planetList[0]).toHaveProperty("targetDistance");
      expect(res.body.data.planetList[0]).toHaveProperty("currentDistance");
    });

    it("[성공 사례] POST /api/planet-travel/start - 적정 연료 사용 시 탐사 출발 성공", async () => {
      const res = await request(app)
        .post("/api/planet-travel/start")
        .send({
          planetType: "MEAL",
          fuelSpent: 10,
        });

      expect([200, 202]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it("[실패 사례] POST /api/planet-travel/start - 보유 연료 초과 시 400 에러 반환", async () => {
      const res = await request(app)
        .post("/api/planet-travel/start")
        .send({
          planetType: "MEAL",
          fuelSpent: 999999, // 초과 연료 소진 요청
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INSUFFICIENT_FUEL");
    });
  });
});
