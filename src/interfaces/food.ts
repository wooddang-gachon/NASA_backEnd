import { MealType } from './enums';

export interface FoodAnalyzeRequest {
  imageUrl: string;
  mealType?: MealType;
}

export interface FoodAnalyzeResponse {
  isIdentified: boolean;
  foodName?: string;
  totalCaloriesKcal?: number;
  carbohydrateG?: number;
  proteinG?: number;
  fatG?: number;
  vitaminPercent?: number;
  mineralPercent?: number;
  comment?: string;
  fallbackUi?: string;
}

export interface MealLogRegisterRequest {
  mealType: MealType;
  foodName: string;
  totalCaloriesKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
  imageUrl?: string;
  imageUrls?: string[];
}

export interface MealLogRegisterResponse {
  logId: number;
  gainedFuel: number;
  gainedExp: number;
  currentFuel: number;
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
