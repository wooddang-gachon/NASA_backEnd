import { MealType } from "./enums";
import { DetectedFoodItem } from "../dto";

export interface UploadedImageFile {
  originalname: string;
  buffer: Buffer;
  mimetype?: string;
  size?: number;
}

export interface FoodVisionContext {
  file?: UploadedImageFile;
  mealType?: string;
  imageUrl: string;
  imageFilePath: string;
  imageId?: string;
  detectedFoods: Partial<DetectedFoodItem>[];
  scanEngine: string;
  isIdentified: boolean;
  errors: Error[];
}

export interface LocalDetectionResult {
  className: string;
  classId: number;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

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
