import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma } from "@prisma/client";

@Service()
export default class TravelRepository {
  public async findUserById(userId: number) {
    const prisma = getPrisma();
    return prisma.users.findUnique({
      where: { id: userId },
    });
  }

  public async findUserWithTammyStatus(userId: number) {
    const prisma = getPrisma();
    return prisma.users.findUnique({
      where: { id: userId },
      include: {
        tammy_statuses: true,
      },
    });
  }

  public async updateUserFuel(userId: number, amount: number, operation: "increment" | "decrement") {
    const prisma = getPrisma();
    return prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: { [operation]: amount },
      },
    });
  }

  public async createPlanetTravel(data: Prisma.planet_travelsUncheckedCreateInput) {
    const prisma = getPrisma();
    return prisma.planet_travels.create({ data });
  }

  public async findPlanetTravelByIdAndUser(travelId: bigint, userId: number) {
    const prisma = getPrisma();
    return prisma.planet_travels.findFirst({
      where: {
        id: travelId,
        user_id: userId,
      },
    });
  }

  public async findMealsByUserAndDate(userId: number, startDate: Date) {
    const prisma = getPrisma();
    return prisma.meals.findMany({
      where: {
        user_id: userId,
        registered_at: { gte: startDate },
      },
      orderBy: { registered_at: "asc" },
    });
  }

  public async findQuickLogsByUserCategoryAndDate(userId: number, category: any, startDate: Date) {
    const prisma = getPrisma();
    return prisma.quick_logs.findMany({
      where: {
        user_id: userId,
        category,
        created_at: { gte: startDate },
      },
    });
  }

  public async findActivePlanetTravelByUser(userId: number) {
    const prisma = getPrisma();
    return prisma.planet_travels.findFirst({
      where: {
        user_id: userId,
        status: "IN_PROGRESS",
      },
    });
  }

  public async findCompletedPlanetTravelsByUser(userId: number) {
    const prisma = getPrisma();
    return prisma.planet_travels.findMany({
      where: {
        user_id: userId,
        status: "COMPLETED",
      },
      orderBy: { completed_at: "desc" },
    });
  }

  public async getPlanetActionCounts(userId: number) {
    const prisma = getPrisma();
    const [mealCount, waterCount, chatCount, exerciseCount, journalCount] = await Promise.all([
      prisma.meals.count({ where: { user_id: userId } }),
      prisma.quick_logs.count({ where: { user_id: userId, category: "WATER" } }),
      prisma.chat_messages.count({ where: { user_id: userId, sender: "USER" } }),
      prisma.quick_logs.count({ where: { user_id: userId, category: "EXERCISE" } }),
      prisma.quick_logs.count({ where: { user_id: userId, category: "JOURNAL" } }),
    ]);

    return {
      MEAL: mealCount * 10,
      WATER: waterCount * 10,
      EMOTION: chatCount * 10,
      LIFESTYLE: exerciseCount * 10,
      RETROSPECT: journalCount * 20,
    };
  }
}
