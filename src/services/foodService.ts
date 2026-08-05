import { Service, Container } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";
import { MealType } from "../interfaces/enums";

@Service()
export default class FoodService {
  private aiService: AiService;

  constructor(aiService?: AiService) {
    this.aiService = aiService || Container.get(AiService);
  }

  public async analyzeFoodVision(imageUrl: string, mealType?: string) {
    try {
      const aiVisionResult = await this.aiService.analyzeFoodVision(imageUrl, mealType);
      return aiVisionResult;
    } catch (e) {
      Logger.warn(`[FoodService] AI Vision scan fallback mock triggered: ${e}`);
      return {
        scanEngine: "YOLO" as const,
        detectedFoods: [
          {
            foodName: "닭가슴살 샐러드",
            estimatedGram: 200,
            calories: 250,
            carbs: 10,
            protein: 30,
            fat: 5,
          },
        ],
      };
    }
  }

  public async logMeal(
    userId: number,
    data: {
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
  ) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const totalCalories = data.foods.reduce((acc, cur) => acc + cur.calories, 0);
    const totalCarbs = data.foods.reduce((acc, cur) => acc + cur.carbs, 0);
    const totalProtein = data.foods.reduce((acc, cur) => acc + cur.protein, 0);
    const totalFat = data.foods.reduce((acc, cur) => acc + cur.fat, 0);

    const meal = await prisma.meals.create({
      data: {
        user_id: userId,
        meal_type: data.mealType,
        comment: data.comment || data.foods.map((f) => f.foodName).join(", "),
        total_calories_kcal: totalCalories,
        total_carbohydrate_g: totalCarbs,
        total_protein_g: totalProtein,
        total_fat_g: totalFat,
      },
    });

    if (data.foods && data.foods.length > 0) {
      await prisma.meal_items.createMany({
        data: data.foods.map((f) => ({
          meal_id: meal.id,
          custom_food_name: f.foodName,
          intake_gram: f.intakeGram,
          calories_kcal: f.calories,
          carbohydrate_g: f.carbs,
          protein_g: f.protein,
          fat_g: f.fat,
        })),
      });
    }

    if (data.imageUrl) {
      await prisma.meal_images.create({
        data: {
          meal_id: meal.id,
          image_url: data.imageUrl,
          is_cover: true,
        },
      });
    }

    const gainedFuel = 50;
    const gainedExp = 30;

    const updatedUser = await prisma.users.update({
      where: { id: userId },
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
      mealId: meal.id.toString(),
      earnedFuel: gainedFuel,
      totalCalories,
      currentFuel: updatedUser.current_fuel ?? 0,
    };
  }

  public async searchFoods(keyword: string) {
    const prisma = getPrisma();
    const dbFoods = await prisma.foods.findMany({
      where: {
        name: { contains: keyword },
      },
      take: 10,
    });

    return {
      foods: dbFoods.map((f) => ({
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
