import { Service } from "typedi";
import { FUEL_REWARDS } from "@/constants/gamification.js";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { QuickLogCreateRequest } from "../dto";
import { QuickLogMapper } from "../mappers";
import QuickLogRepository from "../repositories/QuickLogRepository";
import { Inject } from "typedi";

@Service()
export default class QuickLogService {
  @Inject((type) => QuickLogRepository)
  private quickLogRepository!: QuickLogRepository;

  public async createQuickLog(userId: number, data: QuickLogCreateRequest) {
    Logger.info(
      `[QuickLogService] Creating quick log for userId ${userId}, category: ${data.category}`,
    );
    const earnedFuel = FUEL_REWARDS.QUICK_LOG;

    const log = await this.quickLogRepository.createQuickLog(
      QuickLogMapper.toCreateInput(userId, data, earnedFuel)
    );

    const updatedUser = await this.quickLogRepository.updateUserFuel(userId, earnedFuel);

    return {
      success: true,
      data: QuickLogMapper.toApiResponse(log, updatedUser.current_fuel ?? 0),
    };
  }
}
