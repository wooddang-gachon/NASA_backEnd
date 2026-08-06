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
  AiVisionInternalResponse,
  AiReportInternalPayload,
  AiReportInternalResponse,
} from "@/interfaces";

@Service()
export default class AiService {
  /**
   * AI 타미 심리 공감 대화 & 감정/기억 추출 내부 API 호출 (BE -> AI Server)
   */
  public async processChat(
    userId: number,
    userMessage: string,
    recentMemories?: string[]
  ): Promise<AiChatInternalResponse> {
    const payload: AiChatInternalPayload = {
      userId,
      userMessage,
      recentMemories,
    };

    try {
      Logger.info(`[AiService] Requesting chat processing for userId ${userId}`);
      const response = await fetch(`${config.ai.serverUrl}/v1/chat/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        Logger.error(`[AiService] AI Chat server error with status: ${response.status}`);
        throw new AiServerError(
          `AI 대화 서버 응답에 오류가 발생했습니다. (Status: ${response.status})`,
          "AI_SERVER_ERROR",
          response.status
        );
      }

      const data = (await response.json()) as AiChatInternalResponse;
      return data;
    } catch (error) {
      if (error instanceof AiServerError) {
        throw error;
      }
      Logger.error(`[AiService] Failed to connect to AI Chat server: ${error}`);
      throw new AiServerError(
        "AI 대화 서버와 통신할 수 없습니다. AI 서버 상태를 확인해 주세요.",
        "AI_SERVER_UNAVAILABLE",
        503
      );
    }
  }

  /**
   * 사진 비전 분석 및 5대 영양소 스캔 내부 API 호출 (BE -> AI Vision Server)
   */
  public async analyzeFoodVision(
    imageUrl: string,
    mealType?: string
  ): Promise<AiVisionInternalResponse> {
    try {
      Logger.info(`[AiService] Requesting food vision analysis for image ${imageUrl}`);

      let base64CompressedImage: string | undefined;

      // 로컬 업로드 이미지인 경우 저화질(512x512, q=60)로 경량화 압축하여 AI 서버로 전달
      const cleanPath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
      const localFilePath = path.join(process.cwd(), cleanPath);

      if (fs.existsSync(localFilePath)) {
        try {
          const rawBuffer = fs.readFileSync(localFilePath);
          const compressedBuffer = await compressImageBuffer(rawBuffer, {
            maxWidth: 512,
            maxHeight: 512,
            quality: 60,
            format: "jpeg",
          });
          base64CompressedImage = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`;
          Logger.info(
            `[AiService] Compressed image for AI server (${rawBuffer.length} B -> ${compressedBuffer.length} B)`
          );
        } catch (compressErr) {
          Logger.warn(`[AiService] Image compression fallback: ${compressErr}`);
        }
      }

      const response = await fetch(`${config.ai.serverUrl}/v1/vision/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          mealType,
          base64Image: base64CompressedImage,
        }),
      });

      if (!response.ok) {
        Logger.error(`[AiService] AI Vision server error with status: ${response.status}`);
        throw new AiServerError(
          `AI 비전 서버 응답에 오류가 발생했습니다. (Status: ${response.status})`,
          "AI_SERVER_ERROR",
          response.status
        );
      }

      const data = (await response.json()) as AiVisionInternalResponse;
      return data;
    } catch (error) {
      if (error instanceof AiServerError) {
        throw error;
      }
      Logger.error(`[AiService] Failed to connect to AI Vision server: ${error}`);
      throw new AiServerError(
        "AI 비전 스캔 서버와 통신할 수 없습니다. AI 서버 상태를 확인해 주세요.",
        "AI_SERVER_UNAVAILABLE",
        503
      );
    }
  }

  /**
   * 주간/월간 웰니스 데이터를 가공하여 AI 종합 건강 리포트 요약문 생성 (BE -> AI Server)
   */
  public async summarizeWellnessReport(
    userId: number,
    weeklyStats: any
  ): Promise<AiReportInternalResponse> {
    const payload: AiReportInternalPayload = {
      userId,
      weeklyStats,
    };

    try {
      Logger.info(`[AiService] Requesting wellness report summarization for userId ${userId}`);
      const response = await fetch(`${config.ai.serverUrl}/v1/reports/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        Logger.error(`[AiService] AI Report server error with status: ${response.status}`);
        throw new AiServerError(
          `AI 리포트 요약 서버 응답에 오류가 발생했습니다. (Status: ${response.status})`,
          "AI_SERVER_ERROR",
          response.status
        );
      }

      const data = (await response.json()) as AiReportInternalResponse;
      return data;
    } catch (error) {
      if (error instanceof AiServerError) {
        throw error;
      }
      Logger.error(`[AiService] Failed to connect to AI Report server: ${error}`);
      throw new AiServerError(
        "AI 리포트 요약 서버와 통신할 수 없습니다. AI 서버 상태를 확인해 주세요.",
        "AI_SERVER_UNAVAILABLE",
        503
      );
    }
  }
}
