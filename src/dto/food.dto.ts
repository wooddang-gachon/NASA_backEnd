import { MealType } from "../interfaces/enums";

export interface DetectedFoodItem {
  foodName: string;
  estimatedGram?: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface FoodVisionScanResponse {
  scanEngine: "YOLO" | "VISION_LLM" | string;
  isFallbackUsed: boolean;
  detectedFoods: DetectedFoodItem[];
}

export interface FoodItemInput {
  foodName: string;
  gram?: number;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}

export interface FoodLogConfirmRequest {
  mealType: MealType | "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  foodName?: string;
  intakeGram?: number;
  imageUrl?: string;
  comment?: string;
  foods?: FoodItemInput[];
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
