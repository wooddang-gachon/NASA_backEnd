import { Service } from "typedi";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";
import { PlanetTravelStartRequest } from "../interfaces/travel";
import { toPlanetTravelCreateInput } from "../models/PlanetTravel";

@Service()
export default class TravelService {
  public async startPlanetTravel(userId: number, data: PlanetTravelStartRequest) {
    const prisma = getPrisma();
    Logger.info(`[TravelService] Starting planet travel for userId ${userId}, planetType: ${data.planetType}`);

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const currentFuel = user.current_fuel ?? 0;
    if (currentFuel < data.fuelSpent) {
      throw new Error(`보유 연료가 부족합니다. (현재: ${currentFuel}, 필요: ${data.fuelSpent})`);
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: {
          decrement: data.fuelSpent,
        },
      },
    });

    const travel = await prisma.planet_travels.create({
      data: toPlanetTravelCreateInput(userId, data),
    });

    return {
      success: true,
      message: "별여행 탐사를 출발했습니다.",
      data: {
        travelId: travel.id.toString(),
        remainingFuel: updatedUser.current_fuel ?? 0,
        status: travel.status,
      },
    };
  }

  public async getTravelState(userId: number) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        tammy_statuses: true,
      },
    });

    if (!user) throw new UserNotFoundError(userId);

    const currentFuel = user.current_fuel ?? 0;
    const requiredFuel = 300;
    const progressPercent = Math.min(
      Math.floor((currentFuel / requiredFuel) * 100),
      100
    );

    return {
      currentPlanet: "아쿠아 웰니스 행성",
      explorationProgressPercent: progressPercent,
      currentFuel,
      requiredFuelForNextPlanet: requiredFuel,
      tammyRelationshipLevel: user.tammy_statuses?.level || 1,
    };
  }

  public async addFuel(userId: number, actionType?: string) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    let gainedFuel = 10;
    if (actionType === "MEAL_LOG") gainedFuel = 50;
    else if (actionType === "WORKOUT_DONE") gainedFuel = 30;
    else if (actionType === "WATER_INTAKE") gainedFuel = 10;
    else if (actionType === "CHAT_MESSAGE") gainedFuel = 10;

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    const requiredFuel = 300;
    const currentFuel = updatedUser.current_fuel ?? 0;
    const isWarped = currentFuel >= requiredFuel;

    let newPlanetName: string | undefined = undefined;
    if (isWarped) {
      newPlanetName = "네뷸라 크리스탈 행성";
      Logger.info(`[TravelService] User ${userId} warped to a new planet: ${newPlanetName}`);
    }

    return {
      gainedFuel,
      currentFuel,
      isWarped,
      newPlanetName,
    };
  }
}
