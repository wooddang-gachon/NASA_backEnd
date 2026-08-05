import { LogCategory, quick_logs } from "@prisma/client";
import { QuickLogCreateRequest, QuickLogResponse } from "../interfaces/logs";

export function toQuickLogCreateInput(
  userId: number,
  data: QuickLogCreateRequest,
  earnedFuel: number = 10
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

export function toQuickLogResponse(log: quick_logs): QuickLogResponse {
  return {
    id: log.id.toString(),
    userId: log.user_id,
    category: log.category,
    amount: log.amount,
    emotionType: log.emotion_type,
    journalContent: log.journal_content,
    durationMinutes: log.duration_minutes,
    earnedFuel: log.earned_fuel,
    createdAt: log.created_at.toISOString(),
  };
}
