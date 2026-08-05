import { Controller, Route, Post, Body, Security, Request, Query } from "tsoa";
import { Service, Container } from "typedi";
import FoodService from "../../services/foodService";
import { MealType } from "../../interfaces/enums";

export interface FoodVisionScanResponse {
  success: boolean;
  data: {
    scanEngine: "YOLO" | "VISION_LLM";
    detectedFoods: Array<{
      foodName: string;
      estimatedGram: number;
      calories: number;
      carbs: number;
      protein: number;
      fat: number;
    }>;
  };
}

export interface FoodLogConfirmRequest {
  mealType: MealType;
  foods: Array<{
    foodName: string;
    intakeGram: number;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  }>;
  imageUrl?: string;
  comment?: string;
}

export interface FoodLogConfirmResponse {
  success: boolean;
  data: {
    mealId: string;
    earnedFuel: number;
    totalCalories: number;
  };
}

@Service()
@Route("")
export class FoodController extends Controller {
  private foodService = Container.get(FoodService);

  /**
   * [3.2] Food Vision 스캔 API
   */
  @Post("food-vision/scan")
  @Security("jwt")
  public async scanFoodVision(
    @Request() request: any,
    @Body() body: { imageUrl: string; mealType?: MealType }
  ): Promise<FoodVisionScanResponse> {
    return {
      success: true,
      data: {
        scanEngine: "YOLO",
        detectedFoods: [
          {
            foodName: "닭가슴살 샐러드",
            estimatedGram: 200,
            calories: 250,
            carbs: 10,
            protein: 30,
            fat: 5,
          },
        ],
      },
    };
  }

  /**
   * [3.2] Food Log 확정 저장 API
   */
  @Post("food-log/confirm")
  @Security("jwt")
  public async confirmFoodLog(
    @Request() request: any,
    @Body() body: FoodLogConfirmRequest
  ): Promise<FoodLogConfirmResponse> {
    const userId = request.currentUser?.userId || 1;
    return {
      success: true,
      data: {
        mealId: `meal_${Date.now()}`,
        earnedFuel: 50,
        totalCalories: body.foods.reduce((acc, cur) => acc + cur.calories, 0),
      },
    };
  }
}
