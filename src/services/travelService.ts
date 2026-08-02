import { Service } from "typedi";
import { TravelStateResponse, TravelFuelResponse } from "../interfaces";
import Logger from "../loaders/logger";

@Service()
export default class TravelService {
  /**
   * 우주여행 상태(연료, 좌표, 위치 행성 등)를 조회합니다. (스텁)
   */
  public async getTravelState(userId: number): Promise<TravelStateResponse> {
    Logger.info(`[TravelService] 우주 항해 상태 조회: userId=${userId}`);

    // TODO: DB 사용자 우주 항해 상태 조회

    throw new Error("Method not implemented.");
  }

  /**
   * 미션 성공에 따른 우주선 연료 충전 및 워프 로직을 수행합니다. (스텁)
   */
  public async addFuel(userId: number, triggerType: string): Promise<TravelFuelResponse> {
    Logger.info(`[TravelService] 미션 연료 지급: userId=${userId}, triggerType=${triggerType}`);

    // TODO: 1. 트리거 타입별 연료 계산 (식단 +5%, 운동 +10% 등)
    // TODO: 2. 연료 100 도달 시 행성 도달 처리 및 좌표/연료 리셋 트랜잭션

    throw new Error("Method not implemented.");
  }
}
