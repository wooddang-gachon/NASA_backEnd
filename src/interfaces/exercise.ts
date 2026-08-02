export interface WaterLogRequest {
  /**
   * 사용자 ID
   */
  userId: number;

  /**
   * 섭취 수분량 (ml) - 1회 터치 시 250ml
   * @example 250
   */
  intakeMl: number;
}

export interface WaterLogResponse {
  /**
   * 오늘 총 수분 섭취 누적량 (ml)
   * @example 1250
   */
  todayTotalWaterMl: number;

  /**
   * 수분 섭취로 획득한 연료
   * @example 10
   */
  gainedFuel: number;

  /**
   * 현재 총 연료
   */
  currentFuel: number;
}

export interface WorkoutLogRequest {
  /**
   * 사용자 ID
   */
  userId: number;

  /**
   * 운동 소감 및 메모 (선택)
   * @example "오늘 저녁 산책 20분 완료!"
   */
  memo?: string;
}

export type ExerciseLogRequest = WorkoutLogRequest;

export interface ExerciseRecommendResponse {
  exercises: string[];
}

export interface WorkoutLogResponse {
  /**
   * 생성된 운동 완 로그 ID
   */
  workoutLogId: number;

  /**
   * 1-Tap 운동 완료로 획득한 연료
   * @example 30
   */
  gainedFuel: number;

  /**
   * 현재 총 연료
   */
  currentFuel: number;
}
