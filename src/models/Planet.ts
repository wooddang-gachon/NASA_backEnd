import { PlanetType } from "@prisma/client";

export interface Planet {
  id: number;
  name: string;
  planetType: PlanetType;
  requiredFuel: number;
  description?: string | null;
  createdAt?: Date;
}

export class PlanetModel {
  public static async findAll(): Promise<Planet[]> {
    throw new Error("Method not implemented.");
  }
}
