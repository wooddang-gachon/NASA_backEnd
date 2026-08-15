import {
  Route,
  Post,
  Body,
  Security,
  Request,
  UploadedFile,
  FormField,
  Tags,
} from "tsoa";
import { Service, Container } from "typedi";
import FoodService from "../../services/foodService";
import FoodVisionService from "../../services/foodVisionService";
import { MealType } from "../../interfaces/enums";
import type { AuthenticatedRequest } from "../../interfaces/express";
import { ApiResponse } from "../../dto";
import { BaseController } from "./BaseController";
import {
  FoodLogConfirmRequest,
  FoodVisionScanResponse,
  FoodLogConfirmResponse,
} from "../../dto";
import { FoodMapper } from "../../mappers";

@Service()
@Tags("4. FoodVision - 식단 스캔 & 영양성분 기록")
@Route("")
export class FoodController extends BaseController {
  private foodService = Container.get(FoodService);
  private foodVisionService = Container.get(FoodVisionService);

  /**
   * 촬영하거나 선택한 식단 사진 이미지 파일(multipart/form-data)을 업로드하고 AI 비전 모델로 5대 영양 성분을 스캔 분석합니다.
   * @param file
   * @param mealType
   * @summary 식단 사진 파일 업로드 & AI 비전 분석 스캔
   */
  @Post("food-vision/scan")
  @Security("jwt")
  public async scanFoodVision(
    @UploadedFile("file") file: Express.Multer.File,
    @FormField("mealType") mealType?: MealType,
  ): Promise<ApiResponse<FoodVisionScanResponse>> {
    const data = await this.foodVisionService.uploadAndAnalyzeFoodVision(
      file,
      mealType,
    );
    return this.success(data as FoodVisionScanResponse);
  }

  /**
   * [추가] 외부 AI 서버를 통한 음식 사진 객체 검출 API
   * @param file
   * @summary 외부 AI 서버 기반 식단 검출 및 매칭
   */
  @Post("food-vision/ai-detect")
  @Security("jwt")
  public async detectFoodFromAiServer(
    @UploadedFile("file") file: Express.Multer.File,
  ): Promise<ApiResponse<FoodVisionScanResponse>> {
    const data = await this.foodVisionService.detectFoodViaExternalAi(file);
    return this.success(data);
  }

  /**
   * [3.2] Food Log 확정 저장 API
   * @param request
   * @param body
   */
  @Post("food-log/confirm")
  @Security("jwt")
  public async confirmFoodLog(
    @Request() request: AuthenticatedRequest,
    @Body() body: FoodLogConfirmRequest,
  ): Promise<ApiResponse<FoodLogConfirmResponse>> {
    const res = await this.foodService.logMeal(this.getUserId(request), {
      mealType: body.mealType as MealType,
      imageId: body.imageId,
      foods: body.foods,
      comment: body.comment,
    });
    return this.success(FoodMapper.toFoodLogConfirmResponse(res));
  }
}
