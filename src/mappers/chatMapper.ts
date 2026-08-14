import { Sender } from "../interfaces/enums";
import { ChatMessageApiResponse } from "../dto";
import { AiChatInternalResponse } from "../interfaces/aiServer";
import {
  CreateUserMessageParams,
  CreateTammyMessageParams,
} from "../repositories/models";
import { BaseMapper } from "./BaseMapper";

export class ChatMapper extends BaseMapper {
  /**
   * 유저 전송 메시지 DB 생성 인풋 객체 생성
   * @param paramsOrUserId - User ID or CreateUserMessageParams object
   * @param userMessage - User message string
   * @returns Created user message input object
   */
  public static toUserMessageInput(
    paramsOrUserId: CreateUserMessageParams | number,
    userMessage?: string,
  ) {
    if (typeof paramsOrUserId === "object") {
      return {
        user_id: paramsOrUserId.userId,
        sender: Sender.USER,
        message_text: paramsOrUserId.userMessage,
      };
    }
    return {
      user_id: paramsOrUserId,
      sender: Sender.USER,
      message_text: userMessage!,
    };
  }

  /**
   * AI 타미 응답 메시지 DB 생성 인풋 객체 생성 (라벨링 데이터 포함)
   * @param paramsOrUserId - User ID or CreateTammyMessageParams object
   * @param replyText - Reply text from AI
   * @param motionTag - Motion tag for Tammy
   * @param intentLabel - Intent label
   * @param labels - Labels data
   * @returns Created Tammy message input object
   */
  public static toTammyMessageInput(
    paramsOrUserId: CreateTammyMessageParams | number,
    replyText?: string,
    motionTag?: string,
    intentLabel?: string,
    labels?: unknown,
  ) {
    if (typeof paramsOrUserId === "object") {
      return {
        user_id: paramsOrUserId.userId,
        sender: Sender.TAMMY_AI,
        message_text: paramsOrUserId.replyText,
        motion_tag: paramsOrUserId.motionTag || "COMFORT_WARM",
        intent_label: paramsOrUserId.intentLabel || null,
        labels: paramsOrUserId.labels
          ? (paramsOrUserId.labels as import("@prisma/client").Prisma.InputJsonValue)
          : undefined,
      };
    }
    return {
      user_id: paramsOrUserId,
      sender: Sender.TAMMY_AI,
      message_text: replyText!,
      motion_tag: motionTag || "COMFORT_WARM",
      intent_label: intentLabel || null,
      labels: labels
        ? (labels as import("@prisma/client").Prisma.InputJsonValue)
        : undefined,
    };
  }

  /**
   * AI 타미 대화 처리 서비스 응답 DTO 반환 (객체 통째 전달 방식)
   * @param aiResult - AI chat internal response
   * @param tammyMsg - Tammy message object
   * @param tammyMsg.motion_tag - Motion tag string
   * @param gainedFuel - Gained fuel amount
   * @param currentFuel - Current fuel amount
   * @returns Chat message API response DTO
   */
  public static toResponse(
    aiResult: AiChatInternalResponse,
    tammyMsg: { motion_tag?: string | null },
    gainedFuel: number,
    currentFuel: number,
  ): ChatMessageApiResponse {
    return {
      reply: aiResult.replyText,
      emotion: aiResult.emotion,
      motionTag: tammyMsg.motion_tag || "COMFORT_WARM",
      gainedFuel,
      currentFuel,
    };
  }
}
