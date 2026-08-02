export interface EmotionStatus {
  /**
   * 감정 상태 종류
   * @example "COMFORTING"
   */
  state: string;

  /**
   * 타미 캐릭터 표정/모션 종류
   * @example "PAT_PAT_HEAD"
   */
  motionType: string;
}

export interface ExtractedMemory {
  /**
   * 기억 캡슐 카테고리
   * @example "EMOTION_STATE"
   */
  category: string;

  /**
   * 추출된 사용자의 상태/취향 내용
   * @example "업무 스트레스로 심신이 많이 지쳐있는 상태"
   */
  content: string;
}

export interface ChatRequest {
  /**
   * AI 타미에게 보낼 자연어 메시지
   * @example "오늘 회사에서 일이 너무 많아서 힘들고 지쳤어 😮‍💨"
   */
  message: string;
}

export interface ChatResponse {
  /**
   * AI 타미의 공감 및 케어 답변 텍스트
   */
  reply: string;

  /**
   * 타미의 감정 표정 및 모션 정보
   */
  emotion: EmotionStatus;

  /**
   * 대화로 획득한 연료
   * @example 10
   */
  gainedFuel: number;

  /**
   * 현재 총 연료
   * @example 120
   */
  currentFuel: number;
}

/**
 * BE -> AI Server (Python/FastAPI) 내부 대화 통신 요청 Payload
 */
export interface AiChatInternalPayload {
  userId: number;
  userMessage: string;
  recentMemories?: string[];
}

/**
 * AI Server -> BE 내부 대화 통신 응답 Payload
 */
export interface AiChatInternalResponse {
  replyText: string;
  emotion: EmotionStatus;
  extractedMemory?: ExtractedMemory;
}

/**
 * 장기 기억 캡슐 DTO
 */
export interface MemoryPillDto {
  id: number;
  category: string;
  memoryContent: string;
  createdAt: string;
}
