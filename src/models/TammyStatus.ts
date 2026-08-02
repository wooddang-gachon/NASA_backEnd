export interface TammyStatus {
  userId: number;
  level: number;
  currentExp: number;
  empathyIndex: number;
  healthIndex: number;
  activityIndex: number;
  happinessIndex: number;
  updatedAt?: Date;
}

export class TammyStatusModel {
  /**
   * 유저의 타미 상태 정보를 조회합니다. (스텁)
   */
  public static async findByUserId(userId: number): Promise<TammyStatus | null> {
    throw new Error("Method not implemented.");
  }
}
