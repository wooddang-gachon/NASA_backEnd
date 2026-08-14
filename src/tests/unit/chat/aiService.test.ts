import "reflect-metadata";
import Container from "typedi";
import AiService from "../../../services/aiService";
import config from "../../../config";

// global fetch mock
const globalFetch = jest.fn();
(global as unknown as Record<string, unknown>).fetch = globalFetch;

describe("AiService (ai-swagger.yaml Specification Integration Tests)", () => {
  let aiService: AiService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = Container.get(AiService);
  });

  describe("1. POST /v1/chat/process (Tammy Chat & Emotion Processing)", () => {
    it("should correctly send ChatTurn history, nickname, and X-Internal-Api-Key header", async () => {
      const mockChatResponse = {
        replyText: "오늘 많이 힘들었구나. 괜찮아, 바람 쐬러 갈까?",
        emotion: {
          state: "STRESSED",
          motionType: "PAT_PAT_HEAD",
        },
      };

      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChatResponse,
      });

      const history = [
        {
          role: "user" as const,
          text: "안녕 타미야",
          createdAt: "2026-08-06T10:00:00Z",
        },
        {
          role: "tammy" as const,
          text: "반가워 우주탐험가님!",
          createdAt: "2026-08-06T10:00:05Z",
        },
      ];

      const result = await aiService.processChat(
        12,
        "오늘 너무 지쳤어",
        "우당탕탕",
        history,
      );

      expect(globalFetch).toHaveBeenCalledWith(
        `${config.ai.serverUrl}/v1/chat/process`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Internal-Api-Key": config.ai.apiKey,
          }),
          body: JSON.stringify({
            userId: 12,
            userMessage: "오늘 너무 지쳤어",
            nickname: "우당탕탕",
            history,
          }),
        }),
      );

      expect(result.replyText).toBe(mockChatResponse.replyText);
      expect(result.emotion.state).toBe("STRESSED");
      expect(result.emotion.motionType).toBe("PAT_PAT_HEAD");
    });
  });

  describe("2. POST /v1/vision/analyze-food (Vision Food Analysis)", () => {
    it("should send image parameters and parse VisionAnalyzeResponse schema", async () => {
      const mockVisionResponse = {
        isIdentified: true,
        comment: "오늘 점심 든든하게 잘 챙겼구나!",
        foods: [
          {
            name: "김치찌개",
            confidence: 0.92,
            boundingBox: { x: 0.12, y: 0.3, width: 0.44, height: 0.38 },
          },
        ],
      };

      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVisionResponse,
      });

      const result = await aiService.analyzeFoodVision(
        "https://storage.tammy.app/meal.jpg",
        "LUNCH",
      );

      expect(globalFetch).toHaveBeenCalledWith(
        `${config.ai.serverUrl}/v1/vision/analyze-food`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-Internal-Api-Key": config.ai.apiKey,
          }),
        }),
      );

      // AI 서버는 foods[]로 주고, 어댑터가 백엔드 도메인 포맷인
      // detectedFoods[]로 정규화한다. YOLO 결과와 같은 모양이다.
      expect(result.isIdentified).toBe(true);
      expect(result.scanEngine).toBe("VisionLLM");
      expect(result.detectedFoods.length).toBe(1);
      expect(result.detectedFoods[0]?.foodName).toBe("김치찌개");
      expect(result.detectedFoods[0]?.boxId).toBe(0);
      expect(result.detectedFoods[0]?.confidence).toBe(0.92);
      expect(result.detectedFoods[0]?.boundingBox?.x).toBe(0.12);
    });

    it("should normalize an unidentified response to an empty detectedFoods list", async () => {
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isIdentified: false,
          comment: "음식을 찾지 못했어.",
        }),
      });

      const result = await aiService.analyzeFoodVision(
        "https://storage.tammy.app/blank.jpg",
      );

      expect(result.isIdentified).toBe(false);
      expect(result.detectedFoods).toEqual([]);
    });
  });

  describe("3. POST /v1/nutrition/lookup (Nutrition Lookup via Web Search)", () => {
    it("should send foodNames array and parse NutritionLookupResponse schema", async () => {
      const mockNutritionResponse = {
        items: [
          {
            name: "김치찌개",
            servingSizeG: 400,
            caloriesKcal: 243,
            carbohydrateG: 12.4,
            proteinG: 15.2,
            fatG: 13.8,
            vitaminPercent: 35,
            mineralPercent: 42,
            confidence: 0.81,
            sources: [
              {
                title: "식품영양성분 데이터베이스 - 김치찌개",
                publisher: "식품의약품안전처",
                url: "https://various.foodsafetykorea.go.kr/nutrient/",
              },
            ],
          },
        ],
      };

      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNutritionResponse,
      });

      const result = await aiService.lookupNutrition(["김치찌개"]);

      expect(globalFetch).toHaveBeenCalledWith(
        `${config.ai.serverUrl}/v1/nutrition/lookup`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ foodNames: ["김치찌개"] }),
        }),
      );

      expect(result.items.length).toBe(1);
      expect(result.items[0]?.caloriesKcal).toBe(243);
      expect(result.items[0]?.sources?.[0]?.publisher).toBe("식품의약품안전처");
    });
  });

  describe("4. POST /v1/reports/* (5 Planet Theme Report Generators)", () => {
    it("should route to /v1/reports/diet when planetType is MEAL", async () => {
      const mockReportResponse = {
        title: "우당탕탕님의 식습관 별여행 탐사 결과 🌟",
        markdown: "이번 주 식습관 섭취 비율이 우수합니다.",
        nextActionChecks: ["내일 아침엔 물 한 잔 마시기"],
      };

      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReportResponse,
      });

      const result = await aiService.generatePlanetReport("MEAL", {
        userId: 12,
        nickname: "우당탕탕",
        dailyRecords: [],
      });

      expect(globalFetch).toHaveBeenCalledWith(
        `${config.ai.serverUrl}/v1/reports/diet`,
        expect.objectContaining({ method: "POST" }),
      );

      expect(result.title).toBe(mockReportResponse.title);
      expect(result.nextActionChecks[0]).toBe("내일 아침엔 물 한 잔 마시기");
    });

    it("should route to /v1/reports/hydration when planetType is WATER", async () => {
      const mockReportResponse = {
        title: "우당탕탕님의 수분 별여행 탐사 결과 💧",
        markdown: "목표 수분량을 80% 달성하였습니다.",
        nextActionChecks: ["텀블러 항상 소지하기"],
      };

      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReportResponse,
      });

      const result = await aiService.generatePlanetReport("WATER", {
        userId: 12,
        nickname: "우당탕탕",
        waterLogs: [],
      });

      expect(globalFetch).toHaveBeenCalledWith(
        `${config.ai.serverUrl}/v1/reports/hydration`,
        expect.objectContaining({ method: "POST" }),
      );

      expect(result.title).toBe(mockReportResponse.title);
    });
  });

  describe("5. Error Handling Tests", () => {
    it("should throw AiServerError on 500 server error", async () => {
      globalFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(aiService.processChat(12, "에러 테스트")).rejects.toThrow(
        "현재 우주 통신망이 불안정합니다. 잠시 후 다시 시도해주세요.",
      );
    });
  });
});
