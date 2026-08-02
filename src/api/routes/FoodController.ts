import { Controller, Route, Post, Body, Query } from "tsoa";
import { Service } from "typedi";
import FoodService from "../../services/foodService";
import type {
  FoodAnalyzeResponse,
  MealLogRegisterRequest,
  MealLogRegisterResponse,
} from "../../interfaces";

@Service()
@Route("food")
export class FoodController extends Controller {
  constructor(private foodService: FoodService) {
    super();
  }

  /**
   * 식사 사진 AI 비전 스캔 분석
   */
  @Post("analyze")
  public async analyzeFoodVision(
    @Query() imageUrl: string,
    @Query() mealType?: string
  ): Promise<FoodAnalyzeResponse> {
    return await this.foodService.analyzeFoodVision(imageUrl, mealType);
  }

  /**
   * 호환성용 메서드
   */
  public async analyzeFoodImage(imageUrl: string): Promise<FoodAnalyzeResponse> {
    return await this.foodService.analyzeFoodVision(imageUrl);
  }

  /**
   * 식단 분석 결과 검수/수정 확정 등록 & 보상 지급
   */
  @Post("log")
  public async logMeal(
    @Query() userId: number,
    @Body() requestBody: MealLogRegisterRequest
  ): Promise<MealLogRegisterResponse> {
    return await this.foodService.logMeal(userId, requestBody);
  }

  /**
   * 호환성용 메서드
   */
  public async registerMealLog(requestBody: MealLogRegisterRequest): Promise<MealLogRegisterResponse> {
    return await this.foodService.logMeal(1, requestBody);
  }
}
