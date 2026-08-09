import { Controller, Route, Post, Body, Security, Request, UploadedFile, FormField, Tags } from "tsoa";
import { Service, Container } from "typedi";
import FoodService from "../../services/foodService";
import { MealType } from "../../interfaces/enums";
import type { AuthenticatedRequest } from "../../interfaces/express";
import { getAuthenticatedUserId } from "../../interfaces/express";
import { ApiResponse } from "../../dto";

import { FoodLogConfirmRequest, FoodVisionScanResponse, FoodLogConfirmResponse } from "../../dto";

@Service()
@Tags("4. FoodVision - 식단 스캔 & 영양성분 기록")
@Route("")
export class FoodController extends Controller {
  private foodService = Container.get(FoodService);

  /**
   * 촬영하거나 선택한 식단 사진 이미지 파일(multipart/form-data)을 업로드하고 AI 비전 모델로 5대 영양 성분을 스캔 분석합니다.
   * @summary 식단 사진 파일 업로드 & AI 비전 분석 스캔
   */
  @Post("food-vision/scan")
  @Security("jwt")
  public async scanFoodVision(
    @UploadedFile("file") file: Express.Multer.File,
    @FormField("mealType") mealType?: MealType
  ): Promise<ApiResponse<FoodVisionScanResponse>> {
    const data = await this.foodService.uploadAndAnalyzeFoodVision(file, mealType);
    return ApiResponse.success(data as FoodVisionScanResponse);
  }

  /**
   * [3.2] Food Log 확정 저장 API
   */
  @Post("food-log/confirm")
  @Security("jwt")
  public async confirmFoodLog(
    @Request() request: AuthenticatedRequest,
    @Body() body: FoodLogConfirmRequest
  ): Promise<ApiResponse<FoodLogConfirmResponse>> {
    const userId = getAuthenticatedUserId(request);
    const res = await this.foodService.logMeal(userId, {
      mealType: body.mealType as MealType,
      imageId: body.imageId,
      imageUrl: body.imageUrl,
      foods: body.foods,
      foodName: body.foodName,
      intakeGram: body.intakeGram,
      comment: body.comment,
    });
    const data: FoodLogConfirmResponse = {
      mealId: res.mealId,
      earnedFuel: res.earnedFuel,
      totalCalories: res.totalCalories,
    };
    return ApiResponse.success(data);
  }
}



