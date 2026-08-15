import { Service } from "typedi";
import { FUEL_REWARDS } from "@/constants/gamification";
import Logger from "../loaders/logger";
import { QuickLogCreateRequest } from "../dto";
import { QuickLogMapper } from "../mappers";
import QuickLogRepository from "../repositories/QuickLogRepository";
import { Inject } from "typedi";

@Service()
export default class QuickLogService {
  @Inject((_type) => QuickLogRepository)
  private quickLogRepository!: QuickLogRepository;

  public async createQuickLog(userId: number, data: QuickLogCreateRequest) {
    Logger.info(
      `[QuickLogService] Creating quick log for userId ${userId}, category: ${data.category}`,
    );
    const earnedFuel = FUEL_REWARDS.QUICK_LOG;

    const { log, updatedUser } =
      await this.quickLogRepository.createQuickLogAndFuelTransaction(
        userId,
        QuickLogMapper.toCreateInput(userId, data, earnedFuel),
        earnedFuel,
      );

    return {
      success: true,
      data: QuickLogMapper.toApiResponse(log, updatedUser.current_fuel ?? 0),
    };
  }
}
