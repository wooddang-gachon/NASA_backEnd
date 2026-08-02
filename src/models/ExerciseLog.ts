export interface ExerciseLog {
  id?: number;
  userId: number;
  exerciseId: number;
  durationMinutes: number;
  burnedCaloriesKcal: number;
  isCompleted?: boolean;
  memo?: string;
  performedAt?: Date;
}

export class ExerciseModel {
  /**
   * 사용자의 운동 수행 로그 목록을 조회합니다. (스텁)
   */
  public static async findLogsByUserId(userId: number, limit = 10): Promise<ExerciseLog[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * 운동 완료 수행 기록을 적재합니다. (스텁)
   */
  public static async createLog(logData: Omit<ExerciseLog, "id" | "performedAt">): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
