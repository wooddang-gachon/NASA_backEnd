import request from "supertest";
import { getTestApp } from "../setup/app";
import express from "express";
import AiService from "../../services/aiService";
import ChatService from "../../services/chatService";

describe("AI 타미 심리 공감 대화 API 통합 테스트 (CHT Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  beforeEach(() => {
    jest.spyOn(AiService.prototype, "processChat").mockResolvedValue({
      replyText: "오늘 하루 힘드셨군요. 토닥토닥...",
      motionTag: "COMFORT_WARM",
      emotion: {
        state: "STRESS",
        motionType: "COMFORT_WARM",
      },
    });

    jest
      .spyOn(ChatService.prototype, "undoDeleteMessage")
      .mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("AI 심리 공감 대화 기능", () => {
    it("[성공 사례] POST /api/chat/message - 정상적인 대화 메시지 전송 시 공감 답변 반환", async () => {
      const res = await request(app)
        .post("/api/v1/chat/message")
        .set("Authorization", "Bearer mock_test_token")
        .send({
          messageText: "오늘 다이어트 때문에 조금 지치고 스트레스받아 😮‍💨",
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("reply");
      expect(res.body.data).toHaveProperty("motionTag");
      expect(res.body.data).toHaveProperty("gainedFuel");
    });

    it("[실패 사례] POST /api/chat/message - 필수 메시지 본문 누락 시 400 Bad Request 에러 반환", async () => {
      const res = await request(app)
        .post("/api/v1/chat/message")
        .set("Authorization", "Bearer mock_test_token")
        .send({}); // 빈 데이터

      expect(res.status).toBe(400);
    });

    it("[성공 사례] POST /api/chat/stream - 실시간 SSE 토큰 스트리밍 대화 수신", async () => {
      const res = await request(app)
        .post("/api/v1/chat/stream")
        .set("Authorization", "Bearer mock_test_token")
        .send({
          messageText: "오늘 하루도 수고했어 타미야",
        });

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/event-stream");
      expect(res.text).toContain("event: start");
      expect(res.text).toContain("event: token");
      expect(res.text).toContain("event: complete");
    });

    it("[성공 사례] POST /api/chat/messages/123/undo - 삭제 취소(Undo) 성공", async () => {
      const res = await request(app)
        .post("/api/v1/chat/messages/123/undo")
        .set("Authorization", "Bearer mock_test_token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
