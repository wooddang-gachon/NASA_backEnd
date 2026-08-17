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
  NormalizedVisionResult,
  NutritionLookupResponse,
  AiReportInternalResponse,
  YoloContext,
} from "@/interfaces";

import { Service } from "typedi";

@Service()
export class AiAdapter {
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Internal-Api-Key": config.ai.apiKey || "",
    };
  }

  private async postJson<T>(
    endpoint: string,
    payload: unknown,
    serviceName: string,
  ): Promise<T> {
    const url = `${config.ai.serverUrl}${endpoint}`;
    const MAX_RETRIES = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        Logger.info(
          `[AiAdapter] Requesting ${serviceName} via ${endpoint} (Attempt ${attempt}/${MAX_RETRIES})`,
        );

        // 30초 타임아웃 설정
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
          signal: controller.signal as unknown as RequestInit["signal"],
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`AI 서버 응답 오류 (Status: ${response.status})`);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
        Logger.warn(
          `[AiAdapter] ${serviceName} request failed (Attempt ${attempt}): ${error}`,
        );

        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 1초, 2초 대기
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    // 3회 모두 실패 시 무조건 503 예외 발생 (Mock 데이터 반환 안 함)
    Logger.error(
      `[AiAdapter] Failed to connect to AI ${serviceName} server after ${MAX_RETRIES} attempts. Last error: ${lastError}`,
    );
    throw new AiServerError(
      `현재 우주 통신망이 불안정합니다. 잠시 후 다시 시도해주세요.`,
      "AI_SERVER_UNAVAILABLE",
      503,
    );
  }

  private async processBase64Image(
    imageUrl?: string,
    inputBase64?: string,
  ): Promise<string | undefined> {
    if (inputBase64) return inputBase64;
    if (!imageUrl) return undefined;

    const cleanPath = imageUrl.startsWith("/")
      ? imageUrl.substring(1)
      : imageUrl;
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
      Logger.info(
        `[AiAdapter] Compressed image for AI server (${rawBuffer.length} B -> ${compressedBuffer.length} B)`,
      );
      return `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`;
    } catch (compressErr) {
      Logger.warn(`[AiAdapter] Image compression fallback: ${compressErr}`);
      return undefined;
    }
  }

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

  public async processChat(
    userId: number,
    userMessage: string,
    nickname?: string,
    history?: ChatTurn[],
  ): Promise<AiChatInternalResponse> {
    const payload: AiChatInternalPayload = {
      userId,
      userMessage,
      nickname,
      history,
    };
    return this.postJson<AiChatInternalResponse>(
      "/v1/chat/process",
      payload,
      "Chat",
    );
  }

  /**
   * AI 타미 실시간 SSE 스트리밍 통신 처리
   * AI 서버가 스트리밍을 지원하면 실시간 청크를 즉시 onToken으로 방출하고,
   * 지원하지 않거나 실패 시 processChat으로 안전하게 폴백합니다.
   */
  public async streamChat(
    userId: number,
    userMessage: string,
    nickname?: string,
    history?: ChatTurn[],
    onToken?: (token: string) => void,
  ): Promise<AiChatInternalResponse> {
    const payload: AiChatInternalPayload = {
      userId,
      userMessage,
      nickname,
      history,
    };
    const url = `${config.ai.serverUrl}/v1/chat/stream`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...this.getHeaders(),
          Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
        signal: controller.signal as unknown as RequestInit["signal"],
      });

      clearTimeout(timeoutId);

      if (response.ok && response.body) {
        let accumulatedReply = "";
        const finalMetadata: Partial<AiChatInternalResponse> = {};

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let isDone = false;

        while (!isDone) {
          const { done, value } = await reader.read();
          if (done) {
            isDone = true;
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.replace(/^data:\s*/, "");
              if (dataStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.token) {
                  accumulatedReply += parsed.token;
                  if (onToken) onToken(parsed.token);
                }
                if (parsed.replyText && !parsed.token) {
                  accumulatedReply = parsed.replyText;
                }
                if (parsed.motionTag)
                  finalMetadata.motionTag = parsed.motionTag;
                if (parsed.emotion) finalMetadata.emotion = parsed.emotion;
                if (parsed.intentLabel)
                  finalMetadata.intentLabel = parsed.intentLabel;
                if (parsed.extractedMemory)
                  finalMetadata.extractedMemory = parsed.extractedMemory;
              } catch {
                // 일반 텍스트 토큰인 경우
                accumulatedReply += dataStr;
                if (onToken) onToken(dataStr);
              }
            }
          }
        }

        if (accumulatedReply) {
          return {
            replyText: accumulatedReply,
            motionTag: finalMetadata.motionTag || "TALK_HAPPY",
            emotion: finalMetadata.emotion || {
              state: "NEUTRAL",
              motionType: "TALK_HAPPY",
            },
            intentLabel: finalMetadata.intentLabel || "CHAT",
            extractedMemory: finalMetadata.extractedMemory,
          };
        }
      }
    } catch (err) {
      Logger.warn(
        `[AiAdapter] Direct streaming failed, falling back to processChat: ${err}`,
      );
    }

    // 스트리밍 실패 또는 미지원 시 폴백 (전체 수신 후 토큰 단위 방출)
    const result = await this.processChat(
      userId,
      userMessage,
      nickname,
      history,
    );
    if (onToken && result.replyText) {
      const words = result.replyText.split(/(\s+)/);
      for (const word of words) {
        onToken(word);
      }
    }
    return result;
  }

  public async analyzeFoodVision(
    imageUrl?: string,
    mealType?: string,
    imageBase64Input?: string,
    yoloContext?: YoloContext,
  ): Promise<NormalizedVisionResult> {
    const imageBase64 = await this.processBase64Image(
      imageUrl,
      imageBase64Input,
    );
    const data = await this.postJson<AiVisionInternalResponse>(
      "/v1/vision/analyze-food",
      { imageUrl, imageBase64, mealType, yoloContext },
      "Vision",
    );

    // AI 서버는 음식명과 바운딩 박스만 담은 foods[]를 돌려준다. 리포트와
    // 마찬가지로 어댑터 안에서 백엔드 도메인 포맷(detectedFoods[])으로
    // 매핑해, 서비스 계층이 YOLO 결과와 동일하게 다루도록 한다.
    return {
      isIdentified: data.isIdentified,
      comment: data.comment,
      scanEngine: "VisionLLM",
      detectedFoods: (data.foods ?? []).map((f, idx) => ({
        boxId: idx,
        foodName: f.name,
        boundingBox: f.boundingBox,
        confidence: f.confidence,
      })),
    };
  }

  public async lookupNutrition(
    foodNames: string[],
  ): Promise<NutritionLookupResponse> {
    return this.postJson<NutritionLookupResponse>(
      "/v1/nutrition/lookup",
      { foodNames },
      "Nutrition Lookup",
    );
  }

  public async generatePlanetReport(
    planetType: PlanetType | string,
    payload: unknown,
  ): Promise<AiReportInternalResponse> {
    const endpoint = this.resolveReportEndpoint(planetType);
    const data = await this.postJson<
      Partial<AiReportInternalResponse> & Record<string, unknown>
    >(endpoint, payload, "Report");

    // 어댑터 내부에서 백엔드 도메인 포맷(AiReportInternalResponse)으로 명확히 매핑하여 반환
    return {
      title: data.title,
      markdown: data.markdown,
      summaryTitle: data.title || data.summaryTitle,
      findings: data.markdown || data.findings,
      nextActionChecks: data.nextActionChecks || [],
    };
  }
}
