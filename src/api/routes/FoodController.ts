import { Controller, Route, Post, Body, Security, Request, UploadedFile, FormField } from "tsoa";
import { Service, Container } from "typedi";
import FoodService from "../../services/foodService";
import { MealType } from "../../interfaces/enums";
import path from "path";
import fs from "fs";

export interface FoodVisionScanResponse {
  success: boolean;
  data: {
    scanEngine: "YOLO" | "VISION_LLM";
    imageUrl?: string;
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
   * [3.2] Food Vision 스캔 API (URL 기반)
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
   * [3.2] Food Vision 파일 직접 업로드 & 스캔 API (multipart/form-data)
   */
  @Post("food-vision/upload-and-scan")
  @Security("jwt")
  public async uploadAndScanFoodVision(
    @UploadedFile("file") file: Express.Multer.File,
    @FormField("mealType") mealType?: MealType
  ): Promise<FoodVisionScanResponse> {
    if (!file) {
      throw new Error("업로드할 이미지 파일(file)이 누락되었습니다.");
    }

    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || ".jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    const imageUrl = `/uploads/${filename}`;
    const res = await this.foodService.analyzeFoodVision(imageUrl, mealType);

    return {
      success: true,
      data: {
        ...(res as any),
        imageUrl,
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
