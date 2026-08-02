import request from "supertest";
import { getTestApp } from "./app";
import express from "express";

describe("AI 타미 심리 공감 대화 API 통합 테스트 (CHT Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  it("POST /api/ai/chat - 심리 대화 메시지 전송 및 응답/AI 에러 핸들링 검증", async () => {
    const res = await request(app)
      .post("/api/ai/chat?userId=1")
      .send({
        message: "오늘 다이어트 때문에 조금 지치고 스트레스받아 😮‍💨",
      });

    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("reply");
      expect(res.body).toHaveProperty("emotion");
    } else {
      expect(res.body).toHaveProperty("errors");
    }
  });

  it("GET /api/chat/memories - 수집된 장기 기억 캡슐 목록 조회 검증", async () => {
    const res = await request(app).get("/api/chat/memories?userId=1");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.memories)).toBe(true);
  });
});
