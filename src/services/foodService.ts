import { Service, Container } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "@/loaders/prisma";
import Logger from "@/loaders/logger";
import { UserNotFoundError } from "@/errors";
import type {
  FoodAnalyzeResponse,
  MealLogRegisterRequest,
  MealLogRegisterResponse,
  FoodSearchResponse,
} from "@/interfaces";

@Service()
export default class FoodService {
  private aiService: AiService;

  constructor(aiService?: AiService) {
    this.aiService = aiService || Container.get(AiService);
  }

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
   * 식단 분석 결과 검수/수정 확정 등록 및 다중 이미지/보상 지급
   */
  public async logMeal(
    userId: number,
    request: MealLogRegisterRequest
  ): Promise<MealLogRegisterResponse> {
    const prisma = getPrisma();

    // 유저 검증
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    // 1. 식단 로그 DB 저장
    const meal = await prisma.meals.create({
      data: {
        user_id: userId,
        meal_type: request.mealType,
        image_url: request.imageUrl || (request.imageUrls && request.imageUrls[0]) || null,
        comment: request.foodName,
        total_calories_kcal: request.totalCaloriesKcal,
        total_carbohydrate_g: request.carbohydrateG,
        total_protein_g: request.proteinG,
        total_fat_g: request.fatG,
      },
    });

    // 2. 다중 이미지 독립 테이블(meal_images) 저장
    if (request.imageUrls && request.imageUrls.length > 0) {
      await prisma.meal_images.createMany({
        data: request.imageUrls.map((url, idx) => ({
          meal_id: meal.id,
          image_url: url,
          is_cover: idx === 0,
        })),
      });
    }

    // 3. 보상 매트릭스 적용 (연료 +50, EXP +30)
    const gainedFuel = 50;
    const gainedExp = 30;

    const travelState = await prisma.space_travel_states.update({
      where: { user_id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    const tammyStatus = await prisma.tammy_statuses.update({
      where: { user_id: userId },
      data: {
        current_exp: { increment: gainedExp },
      },
    });

    // 4. 타미 성장 히스토리 로그(tammy_status_logs) 연동
    await prisma.tammy_status_logs.create({
      data: {
        user_id: userId,
        change_reason: "MEAL_LOG",
        delta_exp: gainedExp,
        snapshot_level: tammyStatus.level,
        snapshot_total_exp: tammyStatus.current_exp,
      },
    });

    return {
      logId: Number(meal.id),
      gainedFuel,
      gainedExp,
      currentFuel: travelState.current_fuel,
    };
  }

  /**
   * 표준 음식 영양 마스터 자음/단어 검색 (foods 마스터 연동)
   */
  public async searchFoods(keyword: string): Promise<FoodSearchResponse> {
    const prisma = getPrisma();
    const dbFoods = await prisma.foods.findMany({
      where: {
        name: { contains: keyword },
      },
      take: 10,
    });

    return {
      foods: dbFoods.map((f: any) => ({
        id: f.id,
        name: f.name,
        standardServingG: Number(f.standard_serving_g),
        caloriesKcal: f.calories_kcal,
        carbohydrateG: Number(f.carbohydrate_g),
        proteinG: Number(f.protein_g),
        fatG: Number(f.fat_g),
        category: f.category,
      })),
    };
  }
}
