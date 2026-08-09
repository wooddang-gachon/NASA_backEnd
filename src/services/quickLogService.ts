import { Service } from "typedi";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { QuickLogCreateRequest } from "../dto";
import { QuickLogMapper } from "../mappers";

@Service()
export default class QuickLogService {
  public async createQuickLog(userId: number, data: QuickLogCreateRequest) {
    const prisma = getPrisma();
    Logger.info(
      `[QuickLogService] Creating quick log for userId ${userId}, category: ${data.category}`,
    );
    const earnedFuel = 10;

    const log = await prisma.quick_logs.create({
      data: QuickLogMapper.toCreateInput(userId, data, earnedFuel),
    });

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: {
          increment: earnedFuel,
        },
      },
    });

    return {
      success: true,
      data: QuickLogMapper.toApiResponse(log, updatedUser.current_fuel ?? 0),
    };
  }
}
