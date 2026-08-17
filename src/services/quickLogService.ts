import { Service, Inject } from "typedi";
import {
  DEFAULT_FUEL_GAIN,
  DISTANCE_REDUCTIONS,
} from "@/constants/gamification";
import Logger from "../loaders/logger";
import { QuickLogApiRequest } from "../dto";
import { BadRequestError } from "../errors";
import { QuickLogMapper } from "../mappers";
import QuickLogRepository from "../repositories/QuickLogRepository";
import TravelRepository from "../repositories/TravelRepository";

@Service()
export default class QuickLogService {
  @Inject((_type) => QuickLogRepository)
  private quickLogRepository!: QuickLogRepository;

  @Inject((_type) => TravelRepository)
  private travelRepository!: TravelRepository;

  public async createQuickLog(userId: number, data: QuickLogApiRequest) {
    if (
      data.category === "WATER" &&
      (data.amount === undefined || data.amount < 0)
    ) {
      throw new BadRequestError("수분 섭취량은 0 이상이어야 합니다.");
    }
    Logger.info(
      `[QuickLogService] Creating quick log for userId ${userId}, category: ${data.category}`,
    );

    let planetId = "water";
    let distanceReduction: number = 5;

    switch (data.category) {
      case "WATER":
        planetId = "water";
        distanceReduction = DISTANCE_REDUCTIONS?.WATER_LOG ?? 5;
        break;
      case "EMOTION":
        planetId = "emotion";
        distanceReduction = DISTANCE_REDUCTIONS?.EMOTION_QUICK ?? 5;
        break;
      case "JOURNAL":
        planetId = "emotion";
        distanceReduction = DISTANCE_REDUCTIONS?.EMOTION_DIARY ?? 10;
        break;
      case "EXERCISE":
        planetId = "habit";
        distanceReduction = DISTANCE_REDUCTIONS?.EXERCISE_LOG ?? 10;
        break;
      default:
        planetId = "water";
        distanceReduction = 5;
    }

    const earnedFuel = DEFAULT_FUEL_GAIN ?? 10;

    const log = await this.quickLogRepository.create(
      QuickLogMapper.toCreateInput(userId, data as never, earnedFuel) as never,
    );

    let gauge = {
      isDuplicateRequest: false,
      gainedFuel: earnedFuel,
      distanceReduced: distanceReduction,
      currentFuel: 10,
      currentDistance: 95,
      planetId,
    };

    if (this.travelRepository?.recordActivityAndGauge) {
      gauge = await this.travelRepository.recordActivityAndGauge({
        userId,
        planetId,
        fuelGain: earnedFuel,
        distanceReduction,
        source: `quick_log_${data.category.toLowerCase()}`,
        sourceRefId: log.id,
        clientRequestId: data.clientRequestId,
      });
    }

    return {
      success: true,
      data: QuickLogMapper.toApiResponse(log, gauge.currentFuel, gauge),
    };
  }
}
