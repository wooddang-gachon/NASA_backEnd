export interface EmotionLog {
  id?: number;
  userId: number;
  emotionState: "HAPPY" | "SAD" | "ANGRY" | "STRESSED" | "CALM";
  causeSummary?: string;
  recordedAt?: Date;
}

export class EmotionLogModel {
  /**
   * 감정/스트레스 로그를 적재합니다. (스텁)
   */
  public static async create(userId: number, logData: Omit<EmotionLog, "id" | "userId" | "recordedAt">): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
