import { QuickLogCreateRequest, QuickLogApiResponse } from "../dto";
import { DbQuickLogItem } from "../models";

export class QuickLogMapper {
  /**
   * 1-Tap 웰니스 퀵기록 DB 생성 인풋 객체 생성
   */
  public static toCreateInput(userId: number, data: QuickLogCreateRequest, earnedFuel: number) {
    return {
      user_id: userId,
      category: data.category,
      amount: data.amount ?? null,
      emotion_type: data.emotionType ?? null,
      journal_content: data.journalContent ?? null,
      duration_minutes: data.durationMinutes ?? null,
      earned_fuel: earnedFuel,
    };
  }

  /**
   * 1-Tap 웰니스 퀵기록 서비스 응답 DTO 반환
   */
  public static toApiResponse(log: DbQuickLogItem, totalFuel: number): QuickLogApiResponse {
    return {
      logId: log.id.toString(),
      category: log.category,
      earnedFuel: log.earned_fuel,
      totalFuel,
      createdAt: log.created_at ? new Date(log.created_at).toISOString() : new Date().toISOString(),
    };
  }
}

// 하위 호환용 순수 함수 export
export const toQuickLogCreateInput = QuickLogMapper.toCreateInput;
