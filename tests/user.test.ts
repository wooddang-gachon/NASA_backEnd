import request from "supertest";
import { getTestApp } from "./app";
import express from "express";

describe("사용자 프로필 API 통합 테스트 (USR Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it("GET /api/users/me - 내 프로필 및 타미 상태 조회 검증", async () => {
    const res = await request(app).get("/api/users/me?userId=1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("userId");
    expect(res.body).toHaveProperty("nickname");
    expect(res.body).toHaveProperty("tammyStatus");
  });
});
