import { Service } from "typedi";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { QuickLogCreateRequest } from "../interfaces/logs";
import { toQuickLogCreateInput } from "../models/QuickLog";

@Service()
export default class QuickLogService {
  public async createQuickLog(userId: number, data: QuickLogCreateRequest) {
    const prisma = getPrisma();
    Logger.info(`[QuickLogService] Creating quick log for userId ${userId}, category: ${data.category}`);
    const earnedFuel = 10;

    const log = await prisma.quick_logs.create({
      data: toQuickLogCreateInput(userId, data, earnedFuel),
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
      data: {
        logId: log.id.toString(),
        earnedFuel: log.earned_fuel,
        totalFuel: updatedUser.current_fuel ?? 0,
      },
    };
  }
}
