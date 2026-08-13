import { MealType } from "../../interfaces/enums";
import { MatchType } from "@prisma/client";

export interface Food {
  id: number;
  name: string;
  standardServingG: number;
  caloriesKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
  category?: string | null;
  createdAt?: Date;
}

export interface MealFood {
  id: number;
  mealId: number;
  foodId?: number | null;
  foodName: string;
  servingG: number;
  caloriesKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
}

export interface Meal {
  id: number;
  userId: number;
  mealType: MealType;
  totalCaloriesKcal: number;
  totalCarbohydrateG: number;
  totalProteinG: number;
  totalFatG: number;
  imageUrl?: string | null;
  recordedAt?: Date;
  foods?: MealFood[];
}

export interface DbFoodMappingItem {
  raw_name: string;
  match_type: MatchType | string;
  food: {
    id: number;
    name: string;
    standard_serving_g: unknown;
    calories_kcal: number;
    carbohydrate_g: unknown;
    protein_g: unknown;
    fat_g: unknown;
  };
}

export interface DbFoodItem {
  id: number;
  name: string;
  standard_serving_g: unknown;
  calories_kcal: number;
  carbohydrate_g: unknown;
  protein_g: unknown;
  fat_g: unknown;
  category?: string | null;
}

export interface CreateMealInputParams {
  userId: number;
  mealType: MealType;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  comment?: string | null;
}

export interface CreateMealItemInputParams {
  mealId: bigint;
  foodName: string;
  intakeGram: number;
  foodId?: number | null;
  boundingBox?: unknown;
  confidence?: number | null;
  mealImageId?: bigint | string | null;
}
