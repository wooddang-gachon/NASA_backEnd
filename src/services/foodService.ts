import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";
import { MealType } from "../interfaces/enums";
import { FoodMapper, UserMapper } from "../mappers";
import { MealLogRegisterResponse, FoodSearchResponse } from "../dto";

import path from "path";
import fs from "fs";

@Service()
export default class FoodService {
  @Inject(type => AiService)
  private aiService!: AiService;

  public async uploadAndAnalyzeFoodVision(file?: Express.Multer.File, mealType?: string) {
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
    const res = await this.analyzeFoodVision(imageUrl, mealType);

    return {
      ...(res as any),
      imageUrl,
    };
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
      foodName: string;
      intakeGram?: number;
      imageUrl?: string;
      comment?: string;
    }
  ): Promise<MealLogRegisterResponse> {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const intakeG = data.intakeGram || 100;
    let calories = 0;
    let carbs = 0;
    let protein = 0;
    let fat = 0;

    // 1. 로컬 DB(foods)에서 음식명으로 영양 성분 검색
    const dbFood = await prisma.foods.findFirst({
      where: {
        name: { contains: data.foodName },
      },
    });

    if (dbFood) {
      const ratio = intakeG / (Number(dbFood.standard_serving_g) || 100);
      calories = Math.round(dbFood.calories_kcal * ratio);
      carbs = Math.round(Number(dbFood.carbohydrate_g) * ratio);
      protein = Math.round(Number(dbFood.protein_g) * ratio);
      fat = Math.round(Number(dbFood.fat_g) * ratio);
    } else {
      // 2. DB에 검색되지 않는 경우 AI 서비스로 영양 성분 검색 및 추정
      const aiResult: any = await this.analyzeFoodVision("", data.foodName);
      const detected = aiResult && aiResult.detectedFoods && aiResult.detectedFoods.length > 0
        ? aiResult.detectedFoods[0]
        : { calories: 250, carbs: 30, protein: 20, fat: 5, estimatedGram: 100 };

      const ratio = intakeG / (detected.estimatedGram || 100);
      calories = Math.round(detected.calories * ratio);
      carbs = Math.round(detected.carbs * ratio);
      protein = Math.round(detected.protein * ratio);
      fat = Math.round(detected.fat * ratio);
    }

    const meal = await prisma.meals.create({
      data: FoodMapper.toMealCreateInput(userId, data.mealType, calories, carbs, protein, fat, data.comment || data.foodName),
    });

    await prisma.meal_items.create({
      data: FoodMapper.toMealItemCreateInput(meal.id, data.foodName, intakeG, calories, carbs, protein, fat),
    });

    if (data.imageUrl) {
      await prisma.meal_images.create({
        data: FoodMapper.toMealImageCreateInput(meal.id, data.imageUrl),
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
      data: UserMapper.toStatusLogCreateInput(userId, "MEAL_LOG", gainedExp, tammyStatus.level, tammyStatus.current_exp),
    });

    return FoodMapper.toMealLogRegisterResponse(meal.id, gainedFuel, calories, updatedUser.current_fuel ?? 0);
  }

  public async searchFoods(keyword: string): Promise<FoodSearchResponse> {
    const prisma = getPrisma();
    const dbFoods = await prisma.foods.findMany({
      where: {
        name: { contains: keyword },
      },
      take: 10,
    });

    return FoodMapper.toFoodSearchResponse(dbFoods);
  }
}

