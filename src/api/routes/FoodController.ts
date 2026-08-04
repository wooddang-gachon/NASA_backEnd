import { Controller, Route, Post, Get, Query, Body } from "tsoa";
import { Service, Container } from "typedi";
import FoodService from "../../services/foodService";
import type { MealLogRegisterRequest, FoodAnalyzeResponse, MealLogRegisterResponse, FoodSearchResponse } from "../../interfaces/food";

@Service()
@Route("food")
export class FoodController extends Controller {
  private foodService = Container.get(FoodService);

  constructor() {
    super();
  }

  /**
   * 업로드된 음식 사진을 AI 비전 분석하여 5대 영양소와 칼로리를 추정합니다.
   */
  @Post("analyze")
  public async analyzeFoodVision(
    @Query() imageUrl: string,
    @Query() mealType?: string
  ): Promise<FoodAnalyzeResponse> {
    return await this.foodService.analyzeFoodVision(imageUrl, mealType);
  }

  /**
   * 식단 분석 결과 검수/수정 확정 등록 및 다중 이미지/연료(+50), EXP(+30) 보상을 지급합니다.
   */
  @Post("log")
  public async logMeal(
    @Query() userId: number = 1,
    @Body() request: MealLogRegisterRequest
  ): Promise<MealLogRegisterResponse> {
    return await this.foodService.logMeal(userId, request);
  }

  /**
   * 표준 음식 영양 마스터 자음/키워드 자동완성 검색 결과를 반환합니다.
   */
  @Get("search")
  public async searchFoods(@Query() keyword: string): Promise<FoodSearchResponse> {
    return await this.foodService.searchFoods(keyword);
  }
}
