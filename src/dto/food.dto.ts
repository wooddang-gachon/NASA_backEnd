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

/**
 * 음식명 스마트 매칭 서비스 결과 DTO [FOD-005]
 */
export interface FoodSmartMatchResultDto {
  rawName: string;
  foodId: number;
  standardServingG: number;
  caloriesKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
  matchType: "EXACT" | "ALIAS" | "USER_CONFIRMED" | string;
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
  detectedFoods: DetectedFoodItem[];
  comment?: string;
}

/**
 * 식단 확정 요청 시 개별 음식 항목 DTO
 */
export interface FoodItemInput {
  foodName: string;
  gram?: number;
}

/**
 * 식단 확정 저장 요청 DTO (POST /api/food-log/confirm)
 */
export interface FoodLogConfirmRequest {
  mealType: MealType | "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  imageId: string | number;
  comment?: string;
  foods: FoodItemInput[];
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
