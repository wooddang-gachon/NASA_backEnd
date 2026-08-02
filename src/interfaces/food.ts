import { MealType } from "./enums";

export interface FoodAnalyzeResponse {
  /**
   * 음식 식별 성공 여부
   */
  isIdentified: boolean;

  /**
   * 식별된 음식명
   * @example "연어 샐러드와 아보카도 🥑"
   */
  foodName?: string;

  /**
   * 총 칼로리 (kcal)
   * @example 380
   */
  totalCaloriesKcal?: number;

  /**
   * 탄수화물 함량 (g)
   * @example 14.5
   */
  carbohydrateG?: number;

  /**
   * 단백질 함량 (g)
   * @example 32.0
   */
  proteinG?: number;

  /**
   * 지방 함량 (g)
   * @example 11.2
   */
  fatG?: number;

  /**
   * 비타민 일일 권장 충족도 (%)
   * @example 85
   */
  vitaminPercent?: number;

  /**
   * 미네랄 일일 권장 충족도 (%)
   * @example 70
   */
  mineralPercent?: number;

  /**
   * AI 타미의 식단 영양 한줄평 코멘트
   */
  comment?: string;

  /**
   * 인식 실패 시 UI Fallback 트리거 정보
   * @example "SHOW_RETRY_AND_MANUAL_INPUT"
   */
  fallbackUi?: string;
}

export interface MealLogRegisterRequest {
  /**
   * 식사 종류
   */
  mealType: MealType;

  /**
   * 업로드된 사진 S3/Storage URL
   */
  imageUrl?: string;

  /**
   * 음식명
   */
  foodName: string;

  /**
   * 총 칼로리 (kcal)
   */
  totalCaloriesKcal: number;

  /**
   * 탄수화물 함량 (g)
   */
  carbohydrateG: number;

  /**
   * 단백질 함량 (g)
   */
  proteinG: number;

  /**
   * 지방 함량 (g)
   */
  fatG: number;

  /**
   * 비타민 충족도 (%)
   */
  vitaminPercent?: number;

  /**
   * 미네랄 충족도 (%)
   */
  mineralPercent?: number;
}

export type MealRegisterRequest = MealLogRegisterRequest;

export interface MealLogRegisterResponse {
  /**
   * 생성된 식단 기록 고유 ID
   */
  logId: number;

  /**
   * 식단 확정으로 획득한 우주선 연료
   * @example 50
   */
  gainedFuel: number;

  /**
   * 식단 확정으로 획득한 경험치
   * @example 30
   */
  gainedExp: number;

  /**
   * 현재 총 연료
   */
  currentFuel: number;
}

/**
 * BE -> AI Vision Server 내부 통신 요청/응답 타입
 */
export interface AiVisionInternalResponse {
  isIdentified: boolean;
  foodName?: string;
  totalCaloriesKcal?: number;
  carbohydrateG?: number;
  proteinG?: number;
  fatG?: number;
  vitaminPercent?: number;
  mineralPercent?: number;
  comment?: string;
  reason?: string;
}
