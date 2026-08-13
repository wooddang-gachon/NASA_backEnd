import request from "supertest";
import { getTestApp } from "../setup/app";
import express from "express";

describe("사용자 프로필 API 통합 테스트 (USR Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it("GET /api/users/me - 내 프로필 및 타미 상태 정상 조회 검증", async () => {
    const res = await request(app).get("/api/v1/users/me?userId=1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("userId");
    expect(res.body.data).toHaveProperty("nickname");
    expect(res.body.data).toHaveProperty("tammyStatus");
  });

  it("GET /api/users/me - 존재하지 않는 유저 조회 시 404 USER_NOT_FOUND 에러 반환 검증", async () => {
    const res = await request(app).get("/api/v1/users/me?userId=99999");

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("USER_NOT_FOUND");
    expect(res.body.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });
});
