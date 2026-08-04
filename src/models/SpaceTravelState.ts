export interface SpaceTravelState {
  id: number;
  userId: number;
  currentPlanetId: number;
  explorationProgressPercent: number;
  currentFuel: number;
  updatedAt?: Date;
}

export interface PlanetHistory {
  id: number;
  userId: number;
  planetId: number;
  arrivedAt?: Date;
  clearedAt?: Date;
}

export class SpaceTravelStateModel {
  /**
   * 유저의 우주 탐사 상태 및 연료 조회 (스텁)
   */
  public static async findByUserId(userId: number): Promise<SpaceTravelState | null> {
    throw new Error("Method not implemented.");
  }
}
