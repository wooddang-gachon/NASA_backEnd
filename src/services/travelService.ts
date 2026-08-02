import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import Logger from "@/loaders/logger";
import { UserNotFoundError } from "@/utils/errors";
import type { TravelStateResponse, FuelAddResponse } from "@/interfaces";

export const ensureDefaultPlanet = async (prisma: any) => {
  const planet = await prisma.planets.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "아쿠아 웰니스 행성",
      planet_type: "EXERCISE",
      required_fuel: 300,
      description: "최초의 바이오리듬 웰니스 행성",
    },
  });
  return planet.id;
};

@Service()
export default class TravelService {
  /**
   * 우주선 & 별여행 탐사 상태 조회
   */
  public async getTravelState(userId: number): Promise<TravelStateResponse> {
    const prisma = getPrisma();

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        space_travel_states: true,
        tammy_statuses: true,
      },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const travelState = user.space_travel_states;
    const currentFuel = travelState?.current_fuel || 0;
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

  /**
   * 웰니스 행동에 따른 미션 연료 충전 & 행성 워프(Warp) 계산
   */
  public async addFuel(userId: number, actionType?: string): Promise<FuelAddResponse> {
    const prisma = getPrisma();

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    let gainedFuel = 10;
    if (actionType === "MEAL_LOG") gainedFuel = 50;
    else if (actionType === "WORKOUT_DONE") gainedFuel = 30;
    else if (actionType === "WATER_INTAKE") gainedFuel = 10;
    else if (actionType === "CHAT_MESSAGE") gainedFuel = 10;

    const travelState = await prisma.space_travel_states.update({
      where: { user_id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    const requiredFuel = 300;
    const isWarped = travelState.current_fuel >= requiredFuel;

    let newPlanetName: string | undefined = undefined;
    if (isWarped) {
      newPlanetName = "네뷸라 크리스탈 행성";
      Logger.info(`[TravelService] User ${userId} warped to a new planet: ${newPlanetName}`);
    }

    return {
      gainedFuel,
      currentFuel: travelState.current_fuel,
      isWarped,
      newPlanetName,
    };
  }
}
