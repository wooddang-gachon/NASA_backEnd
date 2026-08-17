import { Service, Inject } from "typedi";
import { FUEL_REWARDS, EXP_REWARDS } from "@/constants/gamification";
import AiService from "./aiService";
import Logger from "../loaders/logger";
import FoodRepository from "../repositories/FoodRepository";
import TravelRepository from "../repositories/TravelRepository";
import { UserNotFoundError } from "../errors";
import { FoodMapper, UserMapper } from "../mappers";
import type {
  MealLogRegisterResponse,
  FoodSearchResponse,
  FoodSmartMatchResultDto,
  FoodLogConfirmRequest,
} from "@/dto";
import { BadRequestError } from "../errors";

import { tokenizeFoodName } from "../utils/food/foodTokenizer";

@Service()
export default class FoodService {
  @Inject(() => AiService)
  private aiService!: AiService;

  @Inject(() => FoodRepository)
  private foodRepository!: FoodRepository;

  @Inject(() => TravelRepository)
  private travelRepository!: TravelRepository;

  /**
   * [FOD-005] 음식명 스마트 매칭 메서드 (foods 마스터 보호 원칙)
   * 1차: food_mappings 중간 테이블 조회
   * 2차: foods 마스터 DB 대표 키워드 부분 매칭 ('고추떡볶이' ➔ '떡볶이' id:10)
   * ➔ 매칭 성공 시 food_mappings에 'ALIAS'로 캐싱 저장!
   * @param rawName 검색할 음식명 원본
   * @returns 음식 스마트 매칭 결과 DTO
   */
  public async getOrMapFood(rawName: string): Promise<FoodSmartMatchResultDto> {
    // Step 1: food_mappings 중간 매칭 테이블 1차 검색
    const mapping = await this.foodRepository.findFoodMappingByRawName(rawName);

    if (mapping && mapping.food) {
      Logger.info(
        `[FOD-005] Food mapping hit for '${rawName}' ➔ Standard food: '${mapping.food.name}' (${mapping.match_type})`,
      );
      return FoodMapper.toFoodSmartMatchResultFromMapping(
        mapping as unknown as Parameters<
          typeof FoodMapper.toFoodSmartMatchResultFromMapping
        >[0],
        rawName,
      );
    }

    // Step 2: foods 마스터 DB 대표 키워드 검색 (토크나이저 기반 스마트 명사 정규화)
    const tokenAnalysis = tokenizeFoodName(rawName);
    const keywordCleaned = tokenAnalysis.normalizedName;

    const masterFood = await this.foodRepository.findFoodMasterByNameOrKeyword(
      rawName,
      keywordCleaned,
    );

    if (masterFood) {
      Logger.info(
        `[FOD-005] Keyword match in foods master: '${masterFood.name}' for rawName '${rawName}'`,
      );

      // foods 테이블에는 새 레코드를 절대 추가하지 않고, food_mappings에만 ALIAS 연결 등록!
      const matchType = masterFood.name === rawName ? "EXACT" : "ALIAS";
      const newMapping = await this.foodRepository.createFoodMapping(
        rawName,
        masterFood.id,
        matchType,
      );

      return FoodMapper.toFoodSmartMatchResultFromMaster(
        masterFood as unknown as Parameters<
          typeof FoodMapper.toFoodSmartMatchResultFromMaster
        >[0],
        rawName,
        newMapping.match_type,
      );
    }

    // Step 3: foods DB에 상위 키워드조차 없는 생소한 음식일 경우
    // foods 마스터 DB는 훼손하지 않고, AI 웹 검색 영양 조회값만 안전하게 반환
    Logger.info(
      `[FOD-005] Food '${rawName}' not in foods master. Fallback to AI nutrition lookup without modifying foods master.`,
    );

    // 영양 조회는 비전이 아니라 /v1/nutrition/lookup 담당이다. 비전
    // 엔드포인트는 이미지가 없으면 IMAGE_REQUIRED(400)를 돌려주므로
    // 음식명만으로는 호출할 수 없다.
    let detected: {
      estimatedGram: number;
      calories: number;
      carbs: number;
      protein: number;
      fat: number;
    } | null = null;
    try {
      const lookup = await this.aiService.lookupNutrition([rawName]);
      const item = lookup?.items?.[0];

      // 검색으로 확인하지 못한 음식은 수치가 0, confidence가 0으로 온다.
      if (item && item.confidence > 0) {
        detected = {
          estimatedGram: item.servingSizeG || 100,
          calories: item.caloriesKcal,
          carbs: item.carbohydrateG,
          protein: item.proteinG,
          fat: item.fatG,
        };
      }
    } catch (err) {
      // 조회에 실패해도 스캔 전체가 무너지지 않도록 기본값으로 이어간다.
      Logger.warn(`[FOD-005] Nutrition lookup failed for '${rawName}': ${err}`);
    }

    return FoodMapper.toFoodSmartMatchResultFromFallback(rawName, detected);
  }

  public async logMeal(
    userId: number,
    data: FoodLogConfirmRequest,
  ): Promise<MealLogRegisterResponse> {
    Logger.info(
      `[FoodService] Logging meal for userId: ${userId}, mealType: ${data.mealType}`,
    );

    const user = await this.foodRepository.findUserById(userId);
    if (!user) {
      Logger.error(`[FoodService] User not found for userId: ${userId}`);
      throw new UserNotFoundError(userId);
    }

    let itemsInput: Array<{ foodName: string; gram: number }> = [];

    if (data.foods && data.foods.length > 0) {
      itemsInput = data.foods.map((f) => ({
        foodName: f.foodName,
        gram: f.gram || 100,
      }));
    } else {
      throw new BadRequestError(
        "음식 항목(foods)은 최소 1개 이상 전송해야 합니다.",
      );
    }

    const processedItems: Array<{
      foodName: string;
      intakeGram: number;
      foodId?: number;
      calories: number;
      carbs: number;
      protein: number;
      fat: number;
    }> = [];

    for (const item of itemsInput) {
      const intakeG = item.gram;
      const mapped = await this.getOrMapFood(item.foodName);

      const ratio = intakeG / (mapped.standardServingG || 100);
      processedItems.push({
        foodName: item.foodName,
        intakeGram: intakeG,
        foodId: mapped.foodId,
        calories: Math.round(mapped.caloriesKcal * ratio),
        carbs: Math.round(mapped.carbohydrateG * ratio),
        protein: Math.round(mapped.proteinG * ratio),
        fat: Math.round(mapped.fatG * ratio),
      });
    }

    // 3. 식사 전체 합계(SUM) 영양 성분 집계
    const totalCalories = processedItems.reduce(
      (acc, curr) => acc + curr.calories,
      0,
    );
    const totalCarbs = processedItems.reduce(
      (acc, curr) => acc + curr.carbs,
      0,
    );
    const totalProtein = processedItems.reduce(
      (acc, curr) => acc + curr.protein,
      0,
    );
    const totalFat = processedItems.reduce((acc, curr) => acc + curr.fat, 0);

    const mainComment =
      data.comment ||
      (processedItems.length > 0
        ? processedItems.map((i) => i.foodName).join(", ")
        : "식단 기록");

    // 트랜잭션(Interactive Transaction)으로 전체 데이터 생성/업데이트를 감싸서 무결성 보장
    const mealData = FoodMapper.toMealCreateInput(
      userId,
      data.mealType,
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
      mainComment,
    );

    const result = await this.foodRepository.createMealLogWithTransaction(
      userId,
      mealData,
      processedItems,
      { imageId: data.imageId },
      0, // gainedFuel은 TravelRepository에서 통합 관리
      EXP_REWARDS.FOOD_CONFIRM, // gainedExp
      FoodMapper.toMealItemCreateInput,
      FoodMapper.toMealImageCreateInput,
      UserMapper.toStatusLogCreateInput,
    );

    let gauge = {
      isDuplicateRequest: false,
      gainedFuel: 10,
      distanceReduced: 10,
      currentFuel: result.updatedUser.current_fuel ?? 0,
      currentDistance: 90,
      planetId: "meal",
    };

    if (this.travelRepository?.recordActivityAndGauge) {
      gauge = await this.travelRepository.recordActivityAndGauge({
        userId,
        planetId: "meal",
        fuelGain: 10,
        distanceReduction: 10,
        source: "food_confirm",
        sourceRefId: result.meal.id,
      });
    }

    Logger.info(
      `[FoodService] Meal logged successfully (mealId: ${result.meal.id}, userId: ${userId}, itemsCount: ${processedItems.length}, totalCalories: ${totalCalories})`,
    );

    return FoodMapper.toMealLogRegisterResponse(
      result.meal.id,
      FUEL_REWARDS.FOOD_CONFIRM,
      totalCalories,
      gauge.currentFuel,
    );
  }

  public async searchFoods(keyword: string): Promise<FoodSearchResponse> {
    Logger.info(`[FoodService] Searching foods with keyword: '${keyword}'`);
    const dbFoods = await this.foodRepository.searchFoodsByKeyword(keyword, 10);

    Logger.info(
      `[FoodService] Found ${dbFoods.length} food items matching keyword: '${keyword}'`,
    );
    return FoodMapper.toFoodSearchResponse(dbFoods);
  }
}
