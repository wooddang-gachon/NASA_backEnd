import request from "supertest";
import { getTestApp } from "../setup/app";
import express from "express";

describe("타미 별여행 API 통합 테스트 (TRV)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  describe("별여행 Two-Gauge 탐사 기능", () => {
    it("[성공 사례] GET /api/v1/planet-travel/state - Two-Gauge 상태 조회 (fuel, planets, readyToDepart)", async () => {
      const res = await request(app).get("/api/v1/planet-travel/state");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("fuel");
      expect(res.body.data).toHaveProperty("planets");
      expect(res.body.data).toHaveProperty("readyToDepart");
      expect(Array.isArray(res.body.data.planets)).toBe(true);
      expect(res.body.data.planets.length).toBe(4);
      expect(res.body.data.planets[0]).toHaveProperty("planetId");
      expect(res.body.data.planets[0]).toHaveProperty("distance");
      expect(res.body.data.planets[0]).toHaveProperty("status");
    });

    it("[실패 사례] POST /api/v1/planet-travel/depart - 거리 미충족(distance > 0) 시 400 에러 반환", async () => {
      const res = await request(app).post("/api/v1/planet-travel/depart").send({
        planetId: "water",
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBeDefined();
    });

    it("[실패 사례] POST /api/v1/planet-travel/arrive - 여행 중이 아닐 때 400 에러 반환", async () => {
      const res = await request(app).post("/api/v1/planet-travel/arrive").send({
        planetId: "water",
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_TRAVEL_STATUS");
    });
  });
});
