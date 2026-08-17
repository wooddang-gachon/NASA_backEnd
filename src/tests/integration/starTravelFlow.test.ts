import request from "supertest";
import { getTestApp } from "../setup/app";
import express from "express";
import { getPrisma } from "../../loaders/prisma";

describe("Star Travel Two-Gauge E2E 플로우 통합 테스트", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(async () => {
    // 테스트 유저(id: 1) 초기화
    const prisma = getPrisma();
    await prisma.users.update({
      where: { id: 1 },
      data: { current_fuel: 0 },
    });
    await prisma.user_planet_progress.deleteMany({
      where: { user_id: 1 },
    });
    await prisma.fuel_logs.deleteMany({
      where: { user_id: 1 },
    });
  });

  it("1. 초기 상태 조회 시 4대 행성 거리 100, Fuel 0, readyToDepart 빈 배열", async () => {
    const res = await request(app).get("/api/v1/planet-travel/state");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fuel).toBe(0);
    expect(res.body.data.readyToDepart).toEqual([]);
    expect(res.body.data.planets).toHaveLength(4);

    const waterPlanet = res.body.data.planets.find(
      (p: { planetId: string }) => p.planetId === "water",
    );
    expect(waterPlanet.distance).toBe(100);
    expect(waterPlanet.status).toBe("READY");
  });

  it("2. 물 1잔 기록 시 Fuel +10 및 waterDistance -5(95) 반영", async () => {
    const res = await request(app).post("/api/v1/quick-log").send({
      category: "WATER",
      amount: 250,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gainedFuel).toBe(10);
    expect(res.body.data.currentFuel).toBe(10);
    expect(res.body.data.distanceReduced).toBe(5);
    expect(res.body.data.currentDistance).toBe(95);
    expect(res.body.data.planetId).toBe("water");
  });

  it("3. clientRequestId 전달 시 DB 레벨 멱등성 보장 (동일 요청 재전송 시 중복 적립 방지)", async () => {
    const clientRequestId = `req_idempotent_test_${Date.now()}`;

    // 첫 번째 요청
    const res1 = await request(app).post("/api/v1/quick-log").send({
      category: "WATER",
      amount: 250,
      clientRequestId,
    });
    expect(res1.status).toBe(201);
    expect(res1.body.data.currentFuel).toBe(10);
    expect(res1.body.data.currentDistance).toBe(95);

    // 두 번째 동일 clientRequestId 재전송
    const res2 = await request(app).post("/api/v1/quick-log").send({
      category: "WATER",
      amount: 250,
      clientRequestId,
    });
    expect(res2.status).toBe(201);
    expect(res2.body.data.gainedFuel).toBe(0);
    expect(res2.body.data.distanceReduced).toBe(0);
    expect(res2.body.data.currentFuel).toBe(10);
    expect(res2.body.data.currentDistance).toBe(95);
  });

  it("4. 편식 시나리오: 물만 20회 기록 시 Fuel 100 & waterDistance 0 도달, readyToDepart 포함", async () => {
    for (let i = 0; i < 20; i++) {
      await request(app).post("/api/v1/quick-log").send({
        category: "WATER",
        amount: 250,
      });
    }

    const stateRes = await request(app).get("/api/v1/planet-travel/state");
    expect(stateRes.status).toBe(200);
    expect(stateRes.body.data.fuel).toBe(100);

    const waterPlanet = stateRes.body.data.planets.find(
      (p: { planetId: string }) => p.planetId === "water",
    );
    expect(waterPlanet.distance).toBe(0);
    expect(stateRes.body.data.readyToDepart).toContain("water");
  });

  it("5. 별여행 출발 -> 애니메이션 중 추가 기록 -> 도착 완료 E2E 라이프사이클", async () => {
    // 1단계: 물 20회 기록으로 출발 조건 충족 (Fuel 100, waterDistance 0)
    for (let i = 0; i < 20; i++) {
      await request(app).post("/api/v1/quick-log").send({
        category: "WATER",
        amount: 250,
      });
    }

    // 2단계: 출발 (POST /api/v1/planet-travel/depart)
    const departRes = await request(app)
      .post("/api/v1/planet-travel/depart")
      .send({ planetId: "water" });

    expect(departRes.status).toBe(200);
    expect(departRes.body.success).toBe(true);
    expect(departRes.body.data.status).toBe("TRAVELING");

    // 출발 직후 상태 검증: Fuel 즉시 0 차감, water 상태 TRAVELING
    const stateAfterDepart = await request(app).get(
      "/api/v1/planet-travel/state",
    );
    expect(stateAfterDepart.body.data.fuel).toBe(0);
    const waterAfterDepart = stateAfterDepart.body.data.planets.find(
      (p: { planetId: string }) => p.planetId === "water",
    );
    expect(waterAfterDepart.status).toBe("TRAVELING");

    // 3단계: 워프 애니메이션 도중 추가 일상 기록 (물 1회) -> 새 사이클 연료(+10) 정상 적립
    const duringTravelLog = await request(app).post("/api/v1/quick-log").send({
      category: "WATER",
      amount: 250,
    });
    expect(duringTravelLog.body.data.currentFuel).toBe(10);

    // 4단계: 도착 처리 (POST /api/v1/planet-travel/arrive)
    const arriveRes = await request(app)
      .post("/api/v1/planet-travel/arrive")
      .send({ planetId: "water" });

    expect(arriveRes.status).toBe(200);
    expect(arriveRes.body.success).toBe(true);
    expect(arriveRes.body.data.status).toBe("ARRIVED");
    expect(arriveRes.body.data.resetDistance).toBe(100);
    expect(arriveRes.body.data.resetFuel).toBe(10); // 여행 중 적립된 10 보존
    expect(arriveRes.body.data).toHaveProperty("reportId");

    const reportId = arriveRes.body.data.reportId;

    // 5단계: 단일 리포트 조회 API (GET /api/v1/planet-travel/reports/{reportId})
    const reportRes = await request(app).get(
      `/api/v1/planet-travel/reports/${reportId}`,
    );
    expect(reportRes.status).toBe(200);
    expect(reportRes.body.success).toBe(true);
    expect(["PENDING", "PROCESSING", "IN_PROGRESS", "COMPLETED"]).toContain(
      reportRes.body.data.status,
    );

    // 도착 후 최종 상태 검증
    const finalState = await request(app).get("/api/v1/planet-travel/state");
    const waterFinal = finalState.body.data.planets.find(
      (p: { planetId: string }) => p.planetId === "water",
    );
    expect(waterFinal.status).toBe("READY");
    expect(waterFinal.distance).toBe(100);
    expect(waterFinal.tripCount).toBe(1);
    expect(finalState.body.data.fuel).toBe(10);
  });
});
