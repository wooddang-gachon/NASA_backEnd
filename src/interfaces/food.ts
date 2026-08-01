import { MealType } from "./enums";

export interface FoodAnalyzeResponse {
  /**
   * 식사 로그 고유 ID
   * @example 42
   */
  mealId: number;

  /**
   * 분석된 음식명
   * @example "닭가슴살 샐러드와 아보카도"
   */
  foodName: string;

  /**
   * 소모/섭취 칼로리 (kcal)
   * @minimum 0
   * @example 350
   */
  caloriesKcal: number;

  /**
   * 탄수화물 함량 (g)
   * @minimum 0
   * @example 15.5
   */
  carbohydrateG: number;

  /**
   * 단백질 함량 (g)
   * @minimum 0
   * @example 28
   */
  proteinG: number;

  /**
   * 지방 함량 (g)
   * @minimum 0
   * @example 12
   */
  fatG: number;

  /**
   * 해당 영양 성분에 대한 AI 요정 타미의 한줄평 조언
   * @example "단백질이 가득한 훌륭한 식단이야! 아보카도의 좋은 지방도 영양 균형에 한몫했어."
   */
  comment: string;
}

export interface MealItemDto {
  /**
   * 음식 이름
   * @example "닭가슴살 샐러드"
   */
  food_name: string;

  /**
   * 음식 칼로리
   * @example 250
   */
  calories_kcal: number;

  /**
   * 탄수화물 (g)
   * @example 10.5
   */
  carbohydrate_g: number;

  /**
   * 단백질 (g)
   * @example 20
   */
  protein_g: number;

  /**
   * 지방 (g)
   * @example 5
   */
  fat_g: number;
}

export interface MealRegisterRequest {
  /**
   * 식사 구분
   * @example "LUNCH"
   */
  meal_type: MealType;

  /**
   * 업로드된 식사 사진 URL (선택)
   * @example "https://example.com/uploads/lunch_image.jpg"
   */
  image_url?: string;

  /**
   * 식사에 대한 간단한 소감 코멘트
   * @maxLength 255 코멘트는 255자를 넘을 수 없습니다.
   * @example "가볍고 건강하게 먹은 점심!"
   */
  comment?: string;

  /**
   * 식사 전체 총 칼로리
   * @minimum 0
   * @example 350
   */
  total_calories_kcal: number;

  /**
   * 식사 전체 총 탄수화물 (g)
   * @minimum 0
   * @example 15.5
   */
  total_carbohydrate_g: number;

  /**
   * 식사 전체 총 단백질 (g)
   * @minimum 0
   * @example 28
   */
  total_protein_g: number;

  /**
   * 식사 전체 총 지방 (g)
   * @minimum 0
   * @example 12
   */
  total_fat_g: number;

  /**
   * 식사에 포함된 세부 개별 음식 리스트
   */
  items: MealItemDto[];
}
