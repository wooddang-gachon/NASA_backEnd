export interface TravelStateResponse {
  /**
   * 현재 탐사 중인 행성(타미별) 이름
   * @example "아쿠아 웰니스 행성"
   */
  currentPlanet: string;

  /**
   * 현재 행성 탐사 진척도 (%)
   * @example 65
   */
  explorationProgressPercent: number;

  /**
   * 현재 보유 우주선 연료 (Fuel)
   * @example 170
   */
  currentFuel: number;

  /**
   * 다음 행성 개척(Warp)에 필요한 목표 연료
   * @example 300
   */
  requiredFuelForNextPlanet: number;

  /**
   * 타미와의 관계 레벨 (Relationship Level)
   * @example 7
   */
  tammyRelationshipLevel: number;
}

export interface FuelAddRequest {
  /**
   * 사용자 ID
   */
  userId?: number;

  /**
   * 트리거 행동 타입
   * @example "WORKOUT_DONE"
   */
  triggerType?: string;

  /**
   * 연료 충전 계기 행동 타입
   * @example "WORKOUT_DONE"
   */
  actionType?: "CHAT_MESSAGE" | "MEAL_LOG" | "WORKOUT_DONE" | "WATER_INTAKE" | string;
}

export type TravelFuelRequest = FuelAddRequest;

export interface FuelAddResponse {
  /**
   * 충전된 연료량
   */
  gainedFuel: number;

  /**
   * 충전 후 현재 총 연료량
   */
  currentFuel: number;

  /**
   * 행성 개척(Warp) 성공 여부
   */
  isWarped: boolean;

  /**
   * 개척된 신규 행성명 (Warp 발생 시)
   */
  newPlanetName?: string;
}

export type TravelFuelResponse = FuelAddResponse;
