import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";
import { MealType } from "../interfaces/enums";
import { FoodMapper, UserMapper } from "../mappers";
import { MealLogRegisterResponse, FoodSearchResponse, FoodSmartMatchResultDto, FoodVisionScanResponse, FoodLogConfirmRequest } from "../dto";

import { cleanFoodKeyword } from "../utils/foodUtils";
import { tokenizeFoodName } from "../utils/foodTokenizer";

import path from "path";
import fs from "fs";

@Service()
export default class FoodService {
  @Inject(type => AiService)
  private aiService!: AiService;

  public async uploadAndAnalyzeFoodVision(file?: Express.Multer.File, mealType?: string): Promise<FoodVisionScanResponse> {
    if (!file) {
      Logger.error("[FoodService] Upload image file is missing.");
      throw new Error("업로드할 이미지 파일(file)이 누락되었습니다.");
    }

    Logger.info(`[FoodService] Uploading and analyzing food vision file: ${file.originalname}`);

    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || ".jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    Logger.info(`[FoodService] Saved uploaded file to ${filePath}`);

    const imageUrl = `/uploads/${filename}`;

    // 1. 이미지가 업로드되는 즉시 meal_images DB 테이블에 바로 연동/저장 (meal_id는 아직 null)
    const prisma = getPrisma();
    const savedImage = await prisma.meal_images.create({
      data: {
        image_url: imageUrl,
        is_cover: true,
      },
    });
    Logger.info(`[FoodService] Immediate image registration created in DB: meal_images ID ${savedImage.id}`);

    const res = await this.analyzeFoodVision(imageUrl, mealType);

    return {
      ...(res as any),
      imageId: savedImage.id.toString(),
      imageUrl,
    };
  }

  /**
   * [FOD-005] 음식명 스마트 매칭 메서드 (foods 마스터 보호 원칙)
   * 1차: food_mappings 중간 테이블 조회
   * 2차: foods 마스터 DB 대표 키워드 부분 매칭 ('고추떡볶이' ➔ '떡볶이' id:10)
   * ➔ 매칭 성공 시 food_mappings에 'ALIAS'로 캐싱 저장!
   */
  public async getOrMapFood(rawName: string): Promise<FoodSmartMatchResultDto> {
    const prisma = getPrisma();

    // Step 1: food_mappings 중간 매칭 테이블 1차 검색
    const mapping = await prisma.food_mappings.findFirst({
      where: { raw_name: rawName },
      include: { food: true },
    });

    if (mapping && mapping.food) {
      Logger.info(`[FOD-005] Food mapping hit for '${rawName}' ➔ Standard food: '${mapping.food.name}' (${mapping.match_type})`);
      return FoodMapper.toFoodSmartMatchResultFromMapping(mapping as any, rawName);
    }

    // Step 2: foods 마스터 DB 대표 키워드 검색 (토크나이저 기반 스마트 명사 정규화)
    const tokenAnalysis = tokenizeFoodName(rawName);
    const keywordCleaned = tokenAnalysis.normalizedName;

    const masterFood = await prisma.foods.findFirst({
      where: {
        OR: [
          { name: { contains: rawName } },
          { name: { contains: keywordCleaned } },
        ],
      },
    });

    if (masterFood) {
      Logger.info(`[FOD-005] Keyword match in foods master: '${masterFood.name}' for rawName '${rawName}'`);
      
      // foods 테이블에는 새 레코드를 절대 추가하지 않고, food_mappings에만 ALIAS 연결 등록!
      const newMapping = await prisma.food_mappings.create({
        data: {
          raw_name: rawName,
          food_id: masterFood.id,
          match_type: masterFood.name === rawName ? "EXACT" : "ALIAS",
        },
        include: { food: true },
      });

      return FoodMapper.toFoodSmartMatchResultFromMaster(masterFood as any, rawName, newMapping.match_type);
    }

    // Step 3: foods DB에 상위 키워드조차 없는 생소한 음식일 경우
    // foods 마스터 DB는 훼손하지 않고, AI 영양소 추정값만 안전하게 반환
    Logger.info(`[FOD-005] Food '${rawName}' not in foods master. Fallback to AI estimation without modifying foods master.`);
    let fallbackVision: any;
    try {
      fallbackVision = await this.aiService.analyzeFoodVision("", rawName);
    } catch {
      fallbackVision = null;
    }

    const detected =
      fallbackVision && fallbackVision.detectedFoods && fallbackVision.detectedFoods.length > 0
        ? fallbackVision.detectedFoods[0]
        : { estimatedGram: 100, calories: 250, carbs: 30, protein: 20, fat: 5 };

    return FoodMapper.toFoodSmartMatchResultFromFallback(rawName, detected);
  }

  public async analyzeFoodVision(imageUrl: string, mealType?: string): Promise<FoodVisionScanResponse> {
    Logger.info(`[FoodService] Analyzing food vision for image: ${imageUrl}, mealType: ${mealType || "N/A"}`);
    let aiVisionResult: any;
    try {
      aiVisionResult = await this.aiService.analyzeFoodVision(imageUrl, mealType);
    } catch (e) {
      Logger.warn(`[FoodService] AI Vision scan fallback mock triggered: ${e}`);
      aiVisionResult = {
        scanEngine: "YOLO" as const,
        detectedFoods: [
          {
            foodName: "연어 샐러드",
            estimatedGram: 200,
            calories: 250,
            carbs: 10,
            protein: 30,
            fat: 5,
          },
        ],
      };
    }

    if (aiVisionResult.detectedFoods && aiVisionResult.detectedFoods.length > 0) {
      const enrichedFoods = [];
      let idx = 0;
      for (const item of aiVisionResult.detectedFoods) {
        const rawFoodName = item.foodName || item.name || "음식";
        const mapping = await this.getOrMapFood(rawFoodName);
        enrichedFoods.push({
          boxId: item.boxId !== undefined ? item.boxId : idx++,
          ...item,
          foodName: rawFoodName,
          matchedStandardFoodName: mapping.foodId > 0 ? mapping.rawName : rawFoodName,
          matchedFoodId: mapping.foodId > 0 ? mapping.foodId : undefined,
          matchType: mapping.matchType,
        });
      }
      return {
        ...aiVisionResult,
        detectedFoods: enrichedFoods,
      };
    }

    return aiVisionResult;
  }

  public async logMeal(
    userId: number,
    data: FoodLogConfirmRequest
  ): Promise<MealLogRegisterResponse> {
    Logger.info(`[FoodService] Logging meal for userId: ${userId}, mealType: ${data.mealType}`);

    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      Logger.error(`[FoodService] User not found for userId: ${userId}`);
      throw new UserNotFoundError(userId);
    }

    let itemsInput: Array<{
      foodName: string;
      gram: number;
      boxId?: number;
      calories?: number;
      carbs?: number;
      protein?: number;
      fat?: number;
      boundingBox?: any;
      confidence?: number;
      imageId?: string | number;
    }> = [];

    if (data.foods && data.foods.length > 0) {
      itemsInput = data.foods.map((f) => ({
        foodName: f.foodName,
        gram: f.gram || 100,
        boxId: f.boxId,
        calories: f.calories,
        carbs: f.carbs,
        protein: f.protein,
        fat: f.fat,
        boundingBox: f.boundingBox,
        confidence: f.confidence,
        imageId: f.imageId,
      }));
    } else if (data.foodName) {
      itemsInput = [
        {
          foodName: data.foodName,
          gram: data.intakeGram || 100,
        },
      ];
    } else {
      itemsInput = [
        {
          foodName: "식단 기록",
          gram: 100,
        },
      ];
    }

    const processedItems: Array<{
      foodName: string;
      intakeGram: number;
      foodId?: number | null;
      calories: number;
      carbs: number;
      protein: number;
      fat: number;
      boxId?: number;
      boundingBox?: any;
      confidence?: number;
      imageId?: string | number;
    }> = [];

    for (const item of itemsInput) {
      const intakeG = item.gram;
      let itemCal = 0;
      let itemCarbs = 0;
      let itemProtein = 0;
      let itemFat = 0;
      let matchedFoodId: number | null = null;

      if (
        item.calories !== undefined &&
        item.carbs !== undefined &&
        item.protein !== undefined &&
        item.fat !== undefined
      ) {
        itemCal = item.calories;
        itemCarbs = item.carbs;
        itemProtein = item.protein;
        itemFat = item.fat;
      } else {
        const mapped = await this.getOrMapFood(item.foodName);
        matchedFoodId = mapped.foodId;
        const ratio = intakeG / (mapped.standardServingG || 100);
        itemCal = Math.round(mapped.caloriesKcal * ratio);
        itemCarbs = Math.round(mapped.carbohydrateG * ratio);
        itemProtein = Math.round(mapped.proteinG * ratio);
        itemFat = Math.round(mapped.fatG * ratio);
      }

      processedItems.push({
        foodName: item.foodName,
        intakeGram: intakeG,
        foodId: matchedFoodId,
        calories: itemCal,
        carbs: itemCarbs,
        protein: itemProtein,
        fat: itemFat,
        boxId: item.boxId,
        boundingBox: item.boundingBox,
        confidence: item.confidence,
        imageId: item.imageId,
      });
    }

    // 3. 식사 전체 합계(SUM) 영양 성분 집계
    const totalCalories = processedItems.reduce((acc, curr) => acc + curr.calories, 0);
    const totalCarbs = processedItems.reduce((acc, curr) => acc + curr.carbs, 0);
    const totalProtein = processedItems.reduce((acc, curr) => acc + curr.protein, 0);
    const totalFat = processedItems.reduce((acc, curr) => acc + curr.fat, 0);

    const mainComment =
      data.comment ||
      (processedItems.length > 0 ? processedItems.map((i) => i.foodName).join(", ") : "식단 기록");

    // 4. meals 1건 생성 (합계 데이터 저장)
    const meal = await prisma.meals.create({
      data: FoodMapper.toMealCreateInput(
        userId,
        data.mealType,
        totalCalories,
        totalCarbs,
        totalProtein,
        totalFat,
        mainComment
      ),
    });

    let defaultImageRecord: any = null;

    // 4-1. imageId (PK) 전달 시 우선 조회
    if (data.imageId) {
      try {
        const imgId = BigInt(data.imageId);
        defaultImageRecord = await prisma.meal_images.findUnique({
          where: { id: imgId },
        });

        if (defaultImageRecord) {
          await prisma.meal_images.update({
            where: { id: imgId },
            data: { meal_id: meal.id },
          });
          Logger.info(`[FoodService] Linked existing meal_images via imageId (ID: ${imgId}) to mealId: ${meal.id}`);
        }
      } catch (err) {
        Logger.warn(`[FoodService] Failed to find meal_images with imageId: ${data.imageId}`);
      }
    }

    // 4-2. imageId로 조회가 안 되었고 imageUrl이 있는 경우 폴백 검색
    if (!defaultImageRecord && data.imageUrl) {
      const existingImage = await prisma.meal_images.findFirst({
        where: { image_url: data.imageUrl },
      });

      if (existingImage) {
        defaultImageRecord = existingImage;
        await prisma.meal_images.update({
          where: { id: existingImage.id },
          data: { meal_id: meal.id },
        });
        Logger.info(`[FoodService] Linked existing meal_images via imageUrl (ID: ${existingImage.id}) to mealId: ${meal.id}`);
      } else {
        defaultImageRecord = await prisma.meal_images.create({
          data: FoodMapper.toMealImageCreateInput(meal.id, data.imageUrl),
        });
        Logger.info(`[FoodService] Created new meal_images record for mealId: ${meal.id}`);
      }
    }

    // 5. meal_items N건 생성 (food_id + intake_gram + boundingBox + meal_image_id 연동)
    for (const item of processedItems) {
      const targetImageId = item.imageId || (defaultImageRecord ? defaultImageRecord.id : null);
      await prisma.meal_items.create({
        data: FoodMapper.toMealItemCreateInput(
          meal.id,
          item.foodName,
          item.intakeGram,
          item.foodId,
          item.boundingBox,
          item.confidence,
          targetImageId
        ),
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
      data: UserMapper.toStatusLogCreateInput(
        userId,
        "MEAL_LOG",
        gainedExp,
        tammyStatus.level,
        tammyStatus.current_exp
      ),
    });

    Logger.info(
      `[FoodService] Meal logged successfully (mealId: ${meal.id}, userId: ${userId}, itemsCount: ${processedItems.length}, totalCalories: ${totalCalories})`
    );

    return FoodMapper.toMealLogRegisterResponse(meal.id, gainedFuel, totalCalories, updatedUser.current_fuel ?? 0);
  }

  public async searchFoods(keyword: string): Promise<FoodSearchResponse> {
    Logger.info(`[FoodService] Searching foods with keyword: '${keyword}'`);
    const prisma = getPrisma();
    const dbFoods = await prisma.foods.findMany({
      where: {
        name: { contains: keyword },
      },
      take: 10,
    });

    Logger.info(`[FoodService] Found ${dbFoods.length} food items matching keyword: '${keyword}'`);
    return FoodMapper.toFoodSearchResponse(dbFoods);
  }
}

