import { Sender } from "../interfaces/enums";
import { ChatMessageApiResponse, MemoryPillDto } from "../dto";
import { AiChatInternalResponse } from "../interfaces/aiServer";

export class ChatMapper {
  /**
   * 유저 전송 메시지 DB 생성 인풋 객체 생성
   */
  public static toUserMessageInput(userId: number, userMessage: string) {
    return {
      user_id: userId,
      sender: Sender.USER,
      message_text: userMessage,
    };
  }

  /**
   * AI 타미 응답 메시지 DB 생성 인풋 객체 생성
   */
  public static toTammyMessageInput(userId: number, replyText: string, motionTag?: string) {
    return {
      user_id: userId,
      sender: Sender.TAMMY_AI,
      message_text: replyText,
      motion_tag: motionTag || "COMFORT_WARM",
    };
  }

  /**
   * 대화 메시지 아카이브 DB 생성 인풋 객체 생성
   */
  public static toArchiveInput(userId: number, chatMessageId: bigint, replyText: string, rawPayload: any) {
    return {
      user_id: userId,
      chat_message_id: chatMessageId,
      sender: Sender.TAMMY_AI,
      message_text: replyText,
      raw_payload: JSON.parse(JSON.stringify(rawPayload)),
      created_at: new Date(),
    };
  }

  /**
   * 장기 기억(Memory) DB 생성/수정 인풋 객체 생성
   */
  public static toLongTermMemoryInput(userId: number, category: string, content: string, archiveId: bigint) {
    return {
      user_id: userId,
      category,
      memory_content: content,
      chat_message_archive_id: archiveId,
    };
  }

  /**
   * AI 타미 대화 처리 서비스 응답 DTO 반환 (객체 통째 전달 방식)
   */
  public static toResponse(
    aiResult: AiChatInternalResponse,
    tammyMsg: { motion_tag?: string | null },
    gainedFuel: number,
    currentFuel: number
  ): ChatMessageApiResponse {
    return {
      reply: aiResult.replyText,
      emotion: aiResult.emotion,
      motionTag: tammyMsg.motion_tag || "COMFORT_WARM",
      gainedFuel,
      currentFuel,
    };
  }

  /**
   * DB 기억 캡슐 엔티티 목록 ➔ MemoryPillDto[] 변환
   */
  public static toMemoryPillDtoList(dbMemories: any[]): MemoryPillDto[] {
    return dbMemories.map((m) => ({
      id: m.id,
      category: m.category,
      memoryContent: m.memory_content,
      createdAt: m.updated_at ? new Date(m.updated_at).toISOString() : new Date().toISOString(),
    }));
  }
}
