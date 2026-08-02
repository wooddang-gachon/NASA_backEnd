import { Controller, Route, Post, Query, Body } from "tsoa";
import { Service } from "typedi";
import FoodService from "../../services/foodService";
import { FoodAnalyzeResponse, MealRegisterRequest } from "../../interfaces";

@Service()
@Route("food")
export class FoodController extends Controller {
  constructor(private foodService: FoodService) {
    super();
  }

  /**
   * 음식 사진을 비전 분석하여 영양 정보 식별 결과를 반환합니다.
   */
  @Post("analyze")
  public async analyzeFood(@Query() mealType: string): Promise<FoodAnalyzeResponse> {
    return await this.foodService.analyzeFoodImage(Buffer.alloc(0), mealType);
  }

  /**
   * 식사 데이터 기록을 확정 저장하고 연료 보상을 지급합니다.
   */
  @Post("log")
  public async registerMealLog(
    @Query() userId: number,
    @Body() requestBody: MealRegisterRequest
  ): Promise<{ mealId: number; fuelResult: any }> {
    return await this.foodService.registerMealLog(userId, requestBody);
  }
}
