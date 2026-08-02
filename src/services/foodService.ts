import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "@/loaders/prisma";
import Logger from "@/loaders/logger";
import { UserNotFoundError } from "@/utils/errors";
import type {
  FoodAnalyzeResponse,
  MealLogRegisterRequest,
  MealLogRegisterResponse,
} from "@/interfaces";

@Service()
export default class FoodService {
  constructor(@Inject() private aiService: AiService) {}

  /**
   * 사진 업로드 및 AI 비전 분석 스캔
   */
  public async analyzeFoodVision(imageUrl: string, mealType?: string): Promise<FoodAnalyzeResponse> {
    const aiVisionResult = await this.aiService.analyzeFoodVision(imageUrl, mealType);

    if (!aiVisionResult.isIdentified) {
      return {
        isIdentified: false,
        fallbackUi: "SHOW_RETRY_AND_MANUAL_INPUT",
      };
    }

    return {
      isIdentified: true,
      foodName: aiVisionResult.foodName,
      totalCaloriesKcal: aiVisionResult.totalCaloriesKcal,
      carbohydrateG: aiVisionResult.carbohydrateG,
      proteinG: aiVisionResult.proteinG,
      fatG: aiVisionResult.fatG,
      vitaminPercent: aiVisionResult.vitaminPercent,
      mineralPercent: aiVisionResult.mineralPercent,
      comment: aiVisionResult.comment,
    };
  }

  /**
   * 식단 분석 결과 검수/수정 확정 등록 및 보상 지급
   */
  public async logMeal(
    userId: number,
    request: MealLogRegisterRequest
  ): Promise<MealLogRegisterResponse> {
    const prisma = getPrisma();

    // 유저 검증 (자동 생성 금지)
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    // 1. 식단 로그 DB 저장
    const meal = await prisma.meals.create({
      data: {
        user_id: userId,
        meal_type: request.mealType,
        image_url: request.imageUrl || null,
        comment: request.foodName,
        total_calories_kcal: request.totalCaloriesKcal,
        total_carbohydrate_g: request.carbohydrateG,
        total_protein_g: request.proteinG,
        total_fat_g: request.fatG,
      },
    });

    // 2. 보상 매트릭스 적용 (연료 +50, EXP +30)
    const gainedFuel = 50;
    const gainedExp = 30;

    const travelState = await prisma.space_travel_states.update({
      where: { user_id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    await prisma.tammy_statuses.update({
      where: { user_id: userId },
      data: {
        current_exp: { increment: gainedExp },
      },
    });

    return {
      logId: Number(meal.id),
      gainedFuel,
      gainedExp,
      currentFuel: travelState.current_fuel,
    };
  }
}
