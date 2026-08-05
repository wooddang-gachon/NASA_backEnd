import { Controller, Route, Post, Body, Security, Request } from "tsoa";
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
    const res = await this.foodService.analyzeFoodVision(body.imageUrl, body.mealType);
    return {
      success: true,
      data: res as any,
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
    const res = await this.foodService.logMeal(userId, body);
    return {
      success: true,
      data: {
        mealId: res.mealId,
        earnedFuel: res.earnedFuel,
        totalCalories: res.totalCalories,
      },
    };
  }
}
