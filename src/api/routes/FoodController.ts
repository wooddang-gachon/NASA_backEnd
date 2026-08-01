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
   * 음식 사진을 업로드받아 AI 비전 분석을 통해 영양 정보를 파악하고 기록합니다.
   */
  @Post("analyze")
  public async analyzeFood(@Query() mealType: string): Promise<FoodAnalyzeResponse> {
    return await this.foodService.analyzeFoodImage(Buffer.alloc(0), mealType);
  }

  /**
   * 분석 완료된 식사 데이터를 사용자 기록에 영구 적재하고 연료 보상을 지급합니다.
   */
  @Post("log")
  public async registerMealLog(
    @Query() userId: number,
    @Body() requestBody: MealRegisterRequest
  ): Promise<{ mealId: number; fuelResult: any }> {
    return await this.foodService.registerMealLog(userId, requestBody);
  }
}
