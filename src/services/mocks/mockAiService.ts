import { Service } from "typedi";
import AiService from "../aiService";
import {
  YoloContext,
  AiChatInternalResponse,
  NormalizedVisionResult,
  ChatTurn,
} from "@/interfaces";

@Service()
export default class MockAiService extends AiService {
  public async processChat(
    userId: number,
    userMessage: string,
    userNickname?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _history?: ChatTurn[],
  ): Promise<AiChatInternalResponse> {
    return {
      replyText: `안녕하세요 ${
        userNickname || "탐험가"
      }님! 타미가 통신 신호를 수신했어요 📡 지금은 임시 통신 모드이지만, "${userMessage}" 메시지 잘 받았습니다!`,
      motionTag: "HAPPY",
      emotion: {
        state: "HAPPY",
        motionType: "HAPPY",
      },
      extractedMemory: {
        category: "일상기록",
        content: userMessage,
      },
    };
  }

  public async analyzeFoodVision(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _imageUrl?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mealType?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _imageBase64Input?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _yoloContext?: YoloContext,
  ): Promise<NormalizedVisionResult> {
    return {
      isIdentified: true,
      comment: "AI 서버 연동이 지연되어 기본 식단 정보를 제공합니다.",
      scanEngine: "Mock",
      detectedFoods: [
        {
          boxId: 0,
          foodName: "연어 샐러드",
          confidence: 0.95,
        },
      ],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async generatePlanetReport(_planetType: string, _reportData: unknown) {
    return {
      title: "아쿠아 웰니스 탐사 완료 리포트 🌟",
      markdown:
        "별여행 탐사가 안전하게 완료되었습니다! 오늘 하루도 건강한 수분과 영양을 챙겨보세요.",
      nextActionChecks: ["매일 물 2,000ml 마시기", "저녁 8시 산책하기"],
    };
  }
}
