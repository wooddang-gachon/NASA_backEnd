export interface UserBodyLog {
  id: number;
  userId: number;
  heightCm: number;
  weightKg: number;
  recordedAt?: Date;
}

export class UserBodyLogModel {
  /**
   * 신체 측정 기록 저장 (스텁)
   */
  public static async createLog(log: Omit<UserBodyLog, "id" | "recordedAt">): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
