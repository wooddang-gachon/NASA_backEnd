export interface WaterLog {
  id?: number;
  userId: number;
  intakeMl: number;
  recordedAt?: Date;
}

export class WaterLogModel {
  /**
   * 수분 섭취 로그를 적재합니다. (스텁)
   */
  public static async create(userId: number, intakeMl: number): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
