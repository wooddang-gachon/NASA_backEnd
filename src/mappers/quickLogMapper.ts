import { QuickLogCreateRequest, QuickLogApiResponse } from "../dto";
import { DbQuickLogItem } from "../repositories/models";
import { BaseMapper } from "./BaseMapper";

export class QuickLogMapper extends BaseMapper {
  /**
   * 1-Tap 웰니스 퀵기록 DB 생성 인풋 객체 생성
   * @param userId - User ID
   * @param data - Quick log create request data
   * @param earnedFuel - Earned fuel amount
   * @returns Created quick log input object
   */
  public static toCreateInput(
    userId: number,
    data: QuickLogCreateRequest,
    earnedFuel: number,
  ) {
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
   * @param log - DB quick log item
   * @param totalFuel - Total fuel amount
   * @returns Quick log API response DTO
   */
  public static toApiResponse(
    log: DbQuickLogItem,
    totalFuel: number,
    gauge?: {
      gainedFuel: number;
      currentFuel: number;
      distanceReduced: number;
      currentDistance: number;
      planetId: string;
    },
  ): QuickLogApiResponse {
    return {
      logId: log.id.toString(),
      category: log.category,
      earnedFuel: gauge ? gauge.gainedFuel : log.earned_fuel,
      totalFuel: gauge ? gauge.currentFuel : totalFuel,
      gainedFuel: gauge ? gauge.gainedFuel : log.earned_fuel,
      currentFuel: gauge ? gauge.currentFuel : totalFuel,
      distanceReduced: gauge?.distanceReduced ?? 0,
      currentDistance: gauge?.currentDistance ?? 100,
      planetId: gauge?.planetId ?? "water",
      createdAt: log.created_at
        ? new Date(log.created_at).toISOString()
        : new Date().toISOString(),
    };
  }
}

// 하위 호환용 순수 함수 export
export const toQuickLogCreateInput = QuickLogMapper.toCreateInput;
