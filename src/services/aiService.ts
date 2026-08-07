import { Service } from "typedi";
import fs from "fs";
import path from "path";
import config from "@/config";
import Logger from "@/loaders/logger";
import { AiServerError } from "@/errors";
import { compressImageBuffer } from "../utils/imageCompressor";
import type {
  AiChatInternalPayload,
  AiChatInternalResponse,
  ChatTurn,
  PlanetType,
  AiVisionInternalResponse,
  NutritionLookupResponse,
  AiReportInternalResponse,
} from "@/interfaces";

@Service()
export default class AiService {
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Internal-Api-Key": config.ai.apiKey || "",
    };
  }

  /**
   * 공통 HTTP POST 통신 및 예외 처리 헬퍼
   */
  private async postJson<T>(endpoint: string, payload: any, serviceName: string): Promise<T> {
    const url = `${config.ai.serverUrl}${endpoint}`;
    try {
      Logger.info(`[AiService] Requesting ${serviceName} via ${endpoint}`);
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        Logger.error(`[AiService] ${serviceName} server error with status: ${response.status}`);
        throw new AiServerError(
          `AI ${serviceName} 서버 응답에 오류가 발생했습니다. (Status: ${response.status})`,
          "AI_SERVER_ERROR",
          response.status
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof AiServerError) throw error;
      Logger.error(`[AiService] Failed to connect to AI ${serviceName} server: ${error}`);
      throw new AiServerError(
        `AI ${serviceName} 서버와 통신할 수 없습니다. AI 서버 상태를 확인해 주세요.`,
        "AI_SERVER_UNAVAILABLE",
        503
      );
    }
  }

  /**
   * 이미지 압축 및 Base64 변환 헬퍼
   */
  private async processBase64Image(imageUrl?: string, inputBase64?: string): Promise<string | undefined> {
    if (inputBase64) return inputBase64;
    if (!imageUrl) return undefined;

    const cleanPath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
    const localFilePath = path.join(process.cwd(), cleanPath);

    if (!fs.existsSync(localFilePath)) return undefined;

    try {
      const rawBuffer = fs.readFileSync(localFilePath);
      const compressedBuffer = await compressImageBuffer(rawBuffer, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 60,
        format: "jpeg",
      });
      Logger.info(`[AiService] Compressed image for AI server (${rawBuffer.length} B -> ${compressedBuffer.length} B)`);
      return `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`;
    } catch (compressErr) {
      Logger.warn(`[AiService] Image compression fallback: ${compressErr}`);
      return undefined;
    }
  }

  /**
   * 행성별 탐사 결과/리포트 엔드포인트 매핑 헬퍼
   */
  private resolveReportEndpoint(planetType: PlanetType | string): string {
    switch (planetType) {
      case "MEAL":
      case "NUTRITION":
        return "/v1/reports/diet";
      case "WATER":
      case "HYDRATION":
        return "/v1/reports/hydration";
      case "EXERCISE":
      case "LIFESTYLE":
        return "/v1/reports/lifestyle";
      case "EMOTION":
      case "MINDFULNESS":
        return "/v1/reports/mindfulness";
      case "RETROSPECT":
      case "RETROSPECTIVE":
        return "/v1/reports/retrospective";
      default:
        return "/v1/reports/diet";
    }
  }

  /**
   * AI 타미 심리 공감 대화 내부 API 호출 (BE -> AI Server)
   * POST /v1/chat/process
   */
  public async processChat(
    userId: number,
    userMessage: string,
    nickname?: string,
    history?: ChatTurn[]
  ): Promise<AiChatInternalResponse> {
    const payload: AiChatInternalPayload = {
      userId,
      userMessage,
      nickname,
      history,
    };
    return this.postJson<AiChatInternalResponse>("/v1/chat/process", payload, "Chat");
  }

  /**
   * 비전 분석 및 음식명/바운딩 박스 추출 내부 API 호출 (BE -> AI Server)
   * POST /v1/vision/analyze-food
   */
  public async analyzeFoodVision(
    imageUrl?: string,
    mealType?: string,
    imageBase64Input?: string
  ): Promise<AiVisionInternalResponse> {
    const imageBase64 = await this.processBase64Image(imageUrl, imageBase64Input);
    return this.postJson<AiVisionInternalResponse>(
      "/v1/vision/analyze-food",
      { imageUrl, imageBase64, mealType },
      "Vision"
    );
  }

  /**
   * 음식명 목록으로 웹 검색 기반 5대 영양 정보 상세 조회 (BE -> AI Server)
   * POST /v1/nutrition/lookup
   */
  public async lookupNutrition(foodNames: string[]): Promise<NutritionLookupResponse> {
    return this.postJson<NutritionLookupResponse>("/v1/nutrition/lookup", { foodNames }, "Nutrition Lookup");
  }

  /**
   * 5대 행성 테마별 탐사 결과/리포트 호출
   */
  public async generatePlanetReport(
    planetType: PlanetType | string,
    payload: {
      userId: number;
      nickname?: string;
      period?: { start: string; end: string };
      dailyRecords?: any[];
      waterLogs?: any[];
      exerciseLogs?: any[];
      chatLogs?: any[];
      dailySteps?: Record<string, number>;
      dailyGoalMl?: number;
    }
  ): Promise<AiReportInternalResponse> {
    const endpoint = this.resolveReportEndpoint(planetType);
    const data = await this.postJson<AiReportInternalResponse>(endpoint, payload, "Report");

    return {
      title: data.title,
      markdown: data.markdown,
      summaryTitle: data.title || data.summaryTitle,
      findings: data.markdown || data.findings,
      nextActionChecks: data.nextActionChecks || [],
    };
  }

  /**
   * 하위 호환용 웰니스 리포트 요약 메서드
   */
  public async summarizeWellnessReport(
    userId: number,
    weeklyStats: any
  ): Promise<AiReportInternalResponse> {
    return await this.generatePlanetReport("MEAL", {
      userId,
      nickname: "우주탐험가",
      dailyRecords: weeklyStats?.dailyRecords || [],
    });
  }
}