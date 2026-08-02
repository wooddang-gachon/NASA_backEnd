export interface Planet {
  id: number;
  name: string;
  planetType: "EXERCISE" | "NUTRITION" | "EMOTION" | "CHALLENGE";
  requiredFuel: number;
  description?: string;
  createdAt?: Date;
}

export class PlanetModel {
  /**
   * 전체 탐사 행성 목록을 조회합니다. (스텁)
   */
  public static async findAll(): Promise<Planet[]> {
    throw new Error("Method not implemented.");
  }
}
