import { Service } from "typedi";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";

@Service()
export default class UserService {
  public async getUserProfile(userId: number) {
    const prisma = getPrisma();
    Logger.info(`[UserService] 프로필 조회: userId=${userId}`);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        tammy_statuses: true,
      },
    });

    if (!user) {
      Logger.warn(`[UserService] 유저 미존재: userId=${userId}`);
      throw new UserNotFoundError(userId);
    }

    return {
      userId: user.id,
      nickname: user.nickname,
      gender: user.gender,
      age: user.age,
      targetWeightKg: user.target_weight_kg ? Number(user.target_weight_kg) : 50.0,
      preferredExercise: user.preferred_exercise || "스쿼트",
      waterGoalMl: user.water_goal_ml ?? 2000,
      calorieGoalKcal: user.calorie_goal_kcal ?? 2000,
      currentFuel: user.current_fuel ?? 0,
      tammyStatus: {
        level: user.tammy_statuses?.level || 1,
        currentExp: user.tammy_statuses?.current_exp || 0,
      },
    };
  }

  public async getTammyHistory(userId: number) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const logs = await prisma.tammy_status_logs.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    return {
      logs: logs.map((l: any) => ({
        id: Number(l.id),
        changeReason: l.change_reason,
        deltaExp: l.delta_exp,
        snapshotLevel: l.snapshot_level,
        snapshotTotalExp: l.snapshot_total_exp,
        createdAt: l.created_at.toISOString(),
      })),
    };
  }
}
