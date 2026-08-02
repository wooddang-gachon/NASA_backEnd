import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import Logger from "@/loaders/logger";
import { UserNotFoundError } from "@/utils/errors";

@Service()
export default class UserService {
  /**
   * 유저 프로필 및 타미 캐릭터 상태 정보를 조회합니다.
   */
  public async getUserProfile(userId: number): Promise<any> {
    Logger.info(`[UserService] 프로필 조회: userId=${userId}`);
    const prisma = getPrisma();

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        tammy_statuses: true,
        space_travel_states: true,
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
      tammyStatus: {
        level: user.tammy_statuses?.level || 1,
        currentExp: user.tammy_statuses?.current_exp || 0,
        currentFuel: user.space_travel_states?.current_fuel || 0,
      },
    };
  }
}
