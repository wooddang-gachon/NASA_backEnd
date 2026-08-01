import { getPrisma } from "../loaders/prisma";

export interface EmotionLog {
  id: number;
  user_id: number;
  emotion_state: "HAPPY" | "SAD" | "ANGRY" | "STRESSED" | "CALM";
  cause_summary?: string;
  recorded_at?: Date;
}

export class EmotionLogModel {
  /**
   * 사용자의 감정 기록 로그 목록을 최신순으로 조회합니다.
   */
  public static async findLogsByUserId(userId: number, limit = 20): Promise<EmotionLog[]> {
    const prisma = getPrisma();
    const rows = await prisma.emotion_logs.findMany({
      where: { user_id: userId },
      orderBy: { recorded_at: "desc" },
      take: limit
    });
    return rows.map(r => ({
      id: Number(r.id),
      user_id: r.user_id,
      emotion_state: r.emotion_state as any,
      cause_summary: r.cause_summary || undefined,
      recorded_at: r.recorded_at
    }));
  }

  /**
   * 새로운 감정 상태 기록을 추가합니다.
   */
  public static async create(userId: number, emotion: Omit<EmotionLog, "id" | "user_id" | "recorded_at">): Promise<number> {
    const prisma = getPrisma();
    const result = await prisma.emotion_logs.create({
      data: {
        user_id: userId,
        emotion_state: emotion.emotion_state as any,
        cause_summary: emotion.cause_summary || null
      }
    });
    return Number(result.id);
  }
}
