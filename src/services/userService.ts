import { Service } from "typedi";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";
import { UserProfileResponseData, TammyHistoryResponse } from "../dto";
import { UserMapper } from "../mappers";

@Service()
export default class UserService {
  public async getUserProfile(userId: number): Promise<UserProfileResponseData> {
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

    return UserMapper.toProfileResponse(user);
  }

  public async getTammyHistory(userId: number): Promise<TammyHistoryResponse> {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const logs = await prisma.tammy_status_logs.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    return UserMapper.toTammyHistoryResponse(logs);
  }
}
