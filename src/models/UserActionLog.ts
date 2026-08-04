export interface UserActionLog {
  id: number;
  userId: number;
  screenName: string;
  actionType: string;
  targetElementId?: string;
  createdAt?: Date;
}

export interface TammyStatusLog {
  id: number;
  userId: number;
  changeReason: string;
  deltaExp: number;
  snapshotLevel: number;
  createdAt?: Date;
}

export class UserActionLogModel {
  /**
   * 사용자 행동 로그 저장 (스텁)
   */
  public static async createLog(log: Omit<UserActionLog, "id" | "createdAt">): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
