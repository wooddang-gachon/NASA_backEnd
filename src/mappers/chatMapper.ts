import { Sender } from '../interfaces/enums';
import { ChatMessageApiResponse } from '../dto';
import { AiChatInternalResponse } from '../interfaces/aiServer';
import {
  DbMemoryItem,
  CreateUserMessageParams,
  CreateTammyMessageParams,
  CreateLongTermMemoryParams,
} from '../repositories/models';
import { BaseMapper } from './BaseMapper';

export class ChatMapper extends BaseMapper {
  /**
   * 유저 전송 메시지 DB 생성 인풋 객체 생성
   */
  public static toUserMessageInput(
    paramsOrUserId: CreateUserMessageParams | number,
    userMessage?: string,
  ) {
    if (typeof paramsOrUserId === 'object') {
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
   */
  public static toTammyMessageInput(
    paramsOrUserId: CreateTammyMessageParams | number,
    replyText?: string,
    motionTag?: string,
    intentLabel?: string,
    labels?: any,
  ) {
    if (typeof paramsOrUserId === 'object') {
      return {
        user_id: paramsOrUserId.userId,
        sender: Sender.TAMMY_AI,
        message_text: paramsOrUserId.replyText,
        motion_tag: paramsOrUserId.motionTag || 'COMFORT_WARM',
        intent_label: paramsOrUserId.intentLabel || null,
        labels: paramsOrUserId.labels || null,
      };
    }
    return {
      user_id: paramsOrUserId,
      sender: Sender.TAMMY_AI,
      message_text: replyText!,
      motion_tag: motionTag || 'COMFORT_WARM',
      intent_label: intentLabel || null,
      labels: labels || null,
    };
  }

  /**
   * AI 타미 대화 처리 서비스 응답 DTO 반환 (객체 통째 전달 방식)
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
      motionTag: tammyMsg.motion_tag || 'COMFORT_WARM',
      gainedFuel,
      currentFuel,
    };
  }
}
