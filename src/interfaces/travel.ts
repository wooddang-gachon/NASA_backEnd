import { space_travel_states, planets } from "@prisma/client";

export class TravelStateResponse {
  /**
   * 현재 연료 게이지 (0 ~ 100%)
   * @isInt
   * @minimum 0
   * @maximum 100
   * @example 65
   */
  currentFuel!: number;

  /**
   * 우주선 좌표 X
   * @example 12.3456
   */
  shipCoordinateX!: number;

  /**
   * 우주선 좌표 Y
   * @example 78.9012
   */
  shipCoordinateY!: number;

  /**
   * 현재 위치한 행성 ID
   * @example 2
   */
  currentPlanetId!: number;

  /**
   * 현재 위치한 행성 이름
   * @example "근육 불끈 행성 💪"
   */
  currentPlanetName!: string;

  /**
   * DB Entity 객체들로부터 DTO 인스턴스를 안전하게 조립하는 정적 팩토리 메서드
   */
  public static fromEntity(
    state: space_travel_states & { current_planet?: planets | null }
  ): TravelStateResponse {
    const res = new TravelStateResponse();
    res.currentFuel = state.current_fuel;
    res.shipCoordinateX = Number(state.ship_coordinate_x || 0);
    res.shipCoordinateY = Number(state.ship_coordinate_y || 0);
    res.currentPlanetId = state.current_planet_id;
    res.currentPlanetName = state.current_planet?.name || "미지의 행성 🪐";
    return res;
  }
}

export interface TravelFuelRequest {
  /**
   * 연료 충전을 트리거한 행위 종류
   */
  triggerType: "FOOD_ANALYZED" | "WORKOUT_DONE" | "GOAL_ACHIEVED";
}

export interface TravelFuelResponse {
  /**
   * 새로 더해진 연료 량 (%)
   * @example 10
   */
  addedFuel: number;

  /**
   * 충전 후 누적 연료 량 (%)
   * @minimum 0
   * @maximum 100
   * @example 75
   */
  currentFuel: number;

  /**
   * 목표 행성 도달 여부
   * @example false
   */
  planetArrived: boolean;

  /**
   * 행성 도착 시 띄워줄 오버레이 카드 정보 (미도달 시 null)
   */
  arrivalOverlay: {
    planetName: string;
    summary: string;
  } | null;
}
