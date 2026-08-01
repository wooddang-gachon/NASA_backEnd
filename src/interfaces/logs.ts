import { EmotionState } from "./enums";

export interface WaterLogRequest {
  /**
   * 수분 섭취량 (ml)
   * @isInt
   * @minimum 10 최소 10ml 이상 입력할 수 있습니다.
   * @maximum 2000 최대 2000ml까지 입력할 수 있습니다.
   * @example 250
   */
  intakeMl: number;
}

export interface EmotionLogRequest {
  /**
   * 감정 상태
   * @example "HAPPY"
   */
  emotionState: EmotionState;

  /**
   * 감정이 그렇게 기재된 핵심 이유
   * @maxLength 255
   * @example "오늘 계획했던 개발 스케줄을 전부 성공적으로 완수했다!"
   */
  causeSummary?: string;
}

export interface UserBodyLogRequest {
  /**
   * 사용자의 키 (cm)
   * @minimum 50.0
   * @maximum 250.0
   * @example 175.5
   */
  heightCm: number;

  /**
   * 사용자의 몸무게 (kg)
   * @minimum 20.0
   * @maximum 300.0
   * @example 72.3
   */
  weightKg: number;
}
