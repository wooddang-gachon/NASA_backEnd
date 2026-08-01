import { Service } from "typedi";
import { getPrisma } from "../loaders/prisma";
import { PlanetModel } from "../models/Planet";
import { TravelStateResponse, TravelFuelResponse } from "../interfaces";
import { Prisma } from "@prisma/client";

@Service()
export default class TravelService {
  /**
   * 사용자의 현재 우주선 위치 및 연료 상태를 조회합니다.
   */
  public async getTravelState(userId: number): Promise<TravelStateResponse> {
    const prisma = getPrisma();
    
    // space_travel_states 테이블 상세 조회 (1:1 관계 행성 포함)
    const state = await prisma.space_travel_states.findUnique({
      where: { user_id: userId },
      include: {
        current_planet: true
      }
    });

    if (!state) {
      // 정보가 없을 경우 기본값 리턴
      return {
        currentFuel: 0,
        shipCoordinateX: 0.0,
        shipCoordinateY: 0.0,
        currentPlanetId: 1,
        currentPlanetName: "푸른 요람 지구 🌍"
      };
    }

    return TravelStateResponse.fromEntity(state);
  }

  /**
   * 행동 보상에 따른 우주선 연료 지급 및 다음 행성 도달 여부를 연산합니다.
   */
  public async addFuel(userId: number, triggerType: "FOOD_ANALYZED" | "WORKOUT_DONE" | "GOAL_ACHIEVED"): Promise<TravelFuelResponse> {
    const prisma = getPrisma();
    
    // 1. 트리거별 충전할 연료 할당 (Friction spring animation 보상값 중앙 관리)
    let addedFuel = 0;
    if (triggerType === "FOOD_ANALYZED") addedFuel = 5;
    else if (triggerType === "WORKOUT_DONE") addedFuel = 10;
    else if (triggerType === "GOAL_ACHIEVED") addedFuel = 15;

    // 2. 현재 상태 가져오기
    const currentState = await this.getTravelState(userId);
    let newFuel = currentState.currentFuel + addedFuel;
    let currentPlanetId = currentState.currentPlanetId;
    let planetArrived = false;
    let arrivalOverlay: any = null;

    // 3. 트랜잭션 실행 (All or Nothing)
    await prisma.$transaction(async (tx) => {
      // 연료 100% 도달 시 행성 도달 및 이월 연산
      if (newFuel >= 100) {
        planetArrived = true;
        newFuel = newFuel - 100; // 초과한 연료는 다음 여정으로 이월
        
        // 다음 행성으로 도달 처리 (최대 5번 행성까지)
        const nextPlanetId = currentPlanetId < 5 ? currentPlanetId + 1 : 1;
        currentPlanetId = nextPlanetId;

        // 도달한 다음 행성의 정보를 조회해 팝업에 표시
        const targetPlanet = await tx.planets.findUnique({ where: { id: nextPlanetId } });
        arrivalOverlay = {
          planetName: targetPlanet?.name || "신비의 미개척 행성 🪐",
          summary: targetPlanet?.description || "건강 습관으로 다음 차원의 은하계로 워프했습니다!"
        };
        
        // 행성 도달 기록 이력 테이블 적재 (planet_histories)
        await tx.planet_histories.create({
          data: {
            user_id: userId,
            planet_id: nextPlanetId,
            growth_summary: `${triggerType} 보상으로 행성 이주 성공`
          }
        });
      }

      // 4. 좌표 이동 시뮬레이션 (연료 비율에 따라 우주선 궤도 좌표를 Easing 갱신)
      const newX = (currentPlanetId * 25.123) + (newFuel * 0.15);
      const newY = (currentPlanetId * 15.456) - (newFuel * 0.08);

      // 5. DB 상태 갱신 (Prisma upsert 구문)
      await tx.space_travel_states.upsert({
        where: { user_id: userId },
        update: {
          current_fuel: newFuel,
          ship_coordinate_x: new Prisma.Decimal(newX),
          ship_coordinate_y: new Prisma.Decimal(newY),
          current_planet_id: currentPlanetId
        },
        create: {
          user_id: userId,
          current_fuel: newFuel,
          ship_coordinate_x: new Prisma.Decimal(newX),
          ship_coordinate_y: new Prisma.Decimal(newY),
          current_planet_id: currentPlanetId
        }
      });
    });

    return {
      addedFuel,
      currentFuel: newFuel,
      planetArrived,
      arrivalOverlay
    };
  }
}
