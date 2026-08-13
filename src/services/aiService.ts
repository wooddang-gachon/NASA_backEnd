import { Service, Inject } from "typedi";
import { AiAdapter } from "@/adapters/AiAdapter";
import type {
  AiChatInternalResponse,
  ChatTurn,
  PlanetType,
  NormalizedVisionResult,
  NutritionLookupResponse,
  AiReportInternalResponse,
  YoloContext,
} from "@/interfaces";

@Service()
export default class AiService {
  @Inject(() => AiAdapter)
  private aiAdapter!: AiAdapter;

  public async processChat(
    userId: number,
    userMessage: string,
    nickname?: string,
    history?: ChatTurn[],
  ): Promise<AiChatInternalResponse> {
    return this.aiAdapter.processChat(userId, userMessage, nickname, history);
  }

  public async analyzeFoodVision(
    imageUrl?: string,
    mealType?: string,
    imageBase64Input?: string,
    yoloContext?: YoloContext,
  ): Promise<NormalizedVisionResult> {
    return this.aiAdapter.analyzeFoodVision(
      imageUrl,
      mealType,
      imageBase64Input,
      yoloContext,
    );
  }

  public async lookupNutrition(
    foodNames: string[],
  ): Promise<NutritionLookupResponse> {
    return this.aiAdapter.lookupNutrition(foodNames);
  }

  public async generatePlanetReport(
    planetType: PlanetType | string,
    payload: {
      userId: number;
      nickname?: string;
      period?: { start: string; end: string };
      dailyRecords?: unknown[];
      waterLogs?: unknown[];
      exerciseLogs?: unknown[];
      chatLogs?: unknown[];
      dailySteps?: Record<string, number>;
      dailyGoalMl?: number;
    },
  ): Promise<AiReportInternalResponse> {
    return this.aiAdapter.generatePlanetReport(planetType, payload);
  }

  public async summarizeWellnessReport(
    userId: number,
    weeklyStats: unknown,
  ): Promise<AiReportInternalResponse> {
    return this.aiAdapter.generatePlanetReport("MEAL", {
      userId,
      nickname: "우주탐험가",
      dailyRecords:
        (weeklyStats as { dailyRecords?: unknown[] })?.dailyRecords || [],
    });
  }
}
