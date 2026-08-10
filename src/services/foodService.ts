import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import FoodRepository from "../repositories/FoodRepository";
import { UserNotFoundError } from "../errors";
import { MealType } from "../interfaces/enums";
import { FoodMapper, UserMapper } from "../mappers";
import { MealLogRegisterResponse, FoodSearchResponse, FoodSmartMatchResultDto, FoodVisionScanResponse, FoodLogConfirmRequest } from "../dto";

import { cleanFoodKeyword } from "../utils/food/foodUtils";
import { tokenizeFoodName } from "../utils/food/foodTokenizer";

import path from "path";
import fs from "fs";

@Service()
export default class FoodService {
  @Inject(type => AiService)
  private aiService!: AiService;

  @Inject(type => FoodRepository)
  private foodRepository!: FoodRepository;

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
    const savedImage = await this.foodRepository.createMealImage(imageUrl, true);
    Logger.info(`[FoodService] Immediate image registration created in DB: meal_images ID ${savedImage.id}`);

    const res = await this.analyzeFoodVision(imageUrl, mealType);

    return {
      ...res,
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
    // Step 1: food_mappings 중간 매칭 테이블 1차 검색
    const mapping = await this.foodRepository.findFoodMappingByRawName(rawName);

    if (mapping && mapping.food) {
      Logger.info(`[FOD-005] Food mapping hit for '${rawName}' ➔ Standard food: '${mapping.food.name}' (${mapping.match_type})`);
      return FoodMapper.toFoodSmartMatchResultFromMapping(mapping as any, rawName);
    }

    // Step 2: foods 마스터 DB 대표 키워드 검색 (토크나이저 기반 스마트 명사 정규화)
    const tokenAnalysis = tokenizeFoodName(rawName);
    const keywordCleaned = tokenAnalysis.normalizedName;

    const masterFood = await this.foodRepository.findFoodMasterByNameOrKeyword(rawName, keywordCleaned);

    if (masterFood) {
      Logger.info(`[FOD-005] Keyword match in foods master: '${masterFood.name}' for rawName '${rawName}'`);
      
      // foods 테이블에는 새 레코드를 절대 추가하지 않고, food_mappings에만 ALIAS 연결 등록!
      const matchType = masterFood.name === rawName ? "EXACT" : "ALIAS";
      const newMapping = await this.foodRepository.createFoodMapping(rawName, masterFood.id, matchType);

      return FoodMapper.toFoodSmartMatchResultFromMaster(masterFood as any, rawName, newMapping.match_type);
    }

    // Step 3: foods DB에 상위 키워드조차 없는 생소한 음식일 경우
    // foods 마스터 DB는 훼손하지 않고, AI 영양소 추정값만 안전하게 반환
    Logger.info(`[FOD-005] Food '${rawName}' not in foods master. Fallback to AI estimation without modifying foods master.`);
    let fallbackVision: any = null;
    try {
      fallbackVision = await this.aiService.analyzeFoodVision("", rawName);
    } catch {
      fallbackVision = null;
    }

    const detected = fallbackVision && fallbackVision.detectedFoods && fallbackVision.detectedFoods.length > 0
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
        message: "AI 서버 연동이 지연되어 기본 식단 정보를 제공합니다.",
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

    const user = await this.foodRepository.findUserById(userId);
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

    // 트랜잭션(Interactive Transaction)으로 전체 데이터 생성/업데이트를 감싸서 무결성 보장
    const mealData = FoodMapper.toMealCreateInput(
      userId,
      data.mealType,
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
      mainComment
    );

    const result = await this.foodRepository.createMealLogWithTransaction(
      userId,
      mealData,
      processedItems,
      { imageId: data.imageId, imageUrl: data.imageUrl },
      50, // gainedFuel
      30, // gainedExp
      FoodMapper.toMealItemCreateInput,
      FoodMapper.toMealImageCreateInput,
      UserMapper.toStatusLogCreateInput
    );

    Logger.info(
      `[FoodService] Meal logged successfully (mealId: ${result.meal.id}, userId: ${userId}, itemsCount: ${processedItems.length}, totalCalories: ${totalCalories})`
    );

    return FoodMapper.toMealLogRegisterResponse(
      result.meal.id,
      result.gainedFuel,
      totalCalories,
      result.updatedUser.current_fuel ?? 0
    );
  }

  public async searchFoods(keyword: string): Promise<FoodSearchResponse> {
    Logger.info(`[FoodService] Searching foods with keyword: '${keyword}'`);
    const dbFoods = await this.foodRepository.searchFoodsByKeyword(keyword, 10);

    Logger.info(`[FoodService] Found ${dbFoods.length} food items matching keyword: '${keyword}'`);
    return FoodMapper.toFoodSearchResponse(dbFoods);
  }
}

