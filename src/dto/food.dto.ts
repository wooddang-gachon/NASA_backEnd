import { MealType } from "../interfaces/enums";

export interface FoodMappingDto {
  rawName: string;
  matchedFoodId: number;
  matchedFoodName: string;
  matchType: "EXACT" | "ALIAS" | "USER_CONFIRMED";
  standardServingG: number;
  caloriesKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
}

export interface BoundingBoxDto {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedFoodItem {
  boxId?: number;
  foodName: string;
  matchedStandardFoodName?: string;
  matchedFoodId?: number;
  matchType?: string;
  estimatedGram?: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  confidence?: number;
  boundingBox?: BoundingBoxDto;
}

export interface FoodVisionScanResponse {
  scanEngine: "YOLO" | "VISION_LLM" | string;
  isFallbackUsed: boolean;
  imageId: string;
  imageUrl: string;
  detectedFoods: DetectedFoodItem[];
}

/**
 * 식단 확정 요청 시 개별 음식 항목 DTO (최소 필수: foodName, gram)
 * 스캔 단계에서 발급받은 boxId를 보내면 해당 좌표가 자동으로 연결됩니다.
 */
export interface FoodItemInput {
  foodName: string;
  gram?: number;
  boxId?: number;
  boundingBox?: BoundingBoxDto;
  confidence?: number;

  // 선택적 수동 오버라이드 (클라이언트에서 영양소를 직접 재지정할 경우에만 전송)
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  imageId?: string | number;
}

/**
 * 식단 확정 저장 요청 DTO (POST /api/food-log/confirm)
 */
export interface FoodLogConfirmRequest {
  mealType: MealType | "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  imageId?: string | number;
  imageUrl?: string;
  comment?: string;
  foods?: FoodItemInput[];

  // 레거시/단일 음식 기록용 백업 필드 (foods 사용 권장)
  foodName?: string;
  intakeGram?: number;
}

export interface FoodLogConfirmResponse {
  mealId: string | number;
  earnedFuel: number;
  totalCalories: number;
}

export interface MealLogRegisterResponse {
  logId?: number;
  mealId: string | number;
  earnedFuel: number;
  gainedFuel?: number;
  gainedExp?: number;
  totalCalories: number;
  currentFuel?: number;
}

export interface FoodDto {
  id: number;
  name: string;
  standardServingG: number;
  caloriesKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
  category?: string | null;
}

export interface FoodSearchResponse {
  foods: FoodDto[];
}
