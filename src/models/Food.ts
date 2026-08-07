import { MealType } from "../interfaces/enums";

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
