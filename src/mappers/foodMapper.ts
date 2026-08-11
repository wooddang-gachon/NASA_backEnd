import { MealType } from "../interfaces/enums";
import { MatchType } from "@prisma/client";
import { MealLogRegisterResponse, FoodSearchResponse, FoodDto, FoodMappingDto, FoodSmartMatchResultDto } from "../dto";
import { DbFoodMappingItem, DbFoodItem, CreateMealInputParams, CreateMealItemInputParams } from "../repositories/models";
import { BaseMapper } from "./BaseMapper";

export class FoodMapper extends BaseMapper {
  /**
   * DB food_mappings 엔티티 ➔ FoodMappingDto 변환 [FOD-005]
   */
  public static toFoodMappingDto(dbMapping: DbFoodMappingItem): FoodMappingDto {
    const food = dbMapping.food;
    return {
      rawName: dbMapping.raw_name,
      matchedFoodId: food.id,
      matchedFoodName: food.name,
      matchType: dbMapping.match_type as MatchType,
      standardServingG: Number(food.standard_serving_g),
      caloriesKcal: food.calories_kcal,
      carbohydrateG: Number(food.carbohydrate_g),
      proteinG: Number(food.protein_g),
      fatG: Number(food.fat_g),
    };
  }

  /**
   * DB food_mappings 엔티티 ➔ FoodSmartMatchResultDto 변환
   */
  public static toFoodSmartMatchResultFromMapping(
    dbMapping: DbFoodMappingItem,
    rawName: string
  ): FoodSmartMatchResultDto {
    const food = dbMapping.food;
    return {
      rawName,
      foodId: food.id,
      standardServingG: Number(food.standard_serving_g),
      caloriesKcal: food.calories_kcal,
      carbohydrateG: Number(food.carbohydrate_g),
      proteinG: Number(food.protein_g),
      fatG: Number(food.fat_g),
      matchType: dbMapping.match_type as any,
    };
  }

  /**
   * foods 마스터 DB 엔티티 ➔ FoodSmartMatchResultDto 변환
   */
  public static toFoodSmartMatchResultFromMaster(
    masterFood: DbFoodItem,
    rawName: string,
    matchType: string
  ): FoodSmartMatchResultDto {
    return {
      rawName,
      foodId: masterFood.id,
      standardServingG: Number(masterFood.standard_serving_g),
      caloriesKcal: masterFood.calories_kcal,
      carbohydrateG: Number(masterFood.carbohydrate_g),
      proteinG: Number(masterFood.protein_g),
      fatG: Number(masterFood.fat_g),
      matchType,
    };
  }

  /**
   * AI Fallback 감지 데이터 ➔ FoodSmartMatchResultDto 변환
   */
  public static toFoodSmartMatchResultFromFallback(
    rawName: string,
    detected: any
  ): FoodSmartMatchResultDto {
    return {
      rawName,
      foodId: 0,
      standardServingG: detected?.estimatedGram || 100,
      caloriesKcal: detected?.calories || 250,
      carbohydrateG: detected?.carbs || 30,
      proteinG: detected?.protein || 20,
      fatG: detected?.fat || 5,
      matchType: "USER_CONFIRMED",
    };
  }

  /**
   * 식단(Meal) DB 생성 인풋 객체 생성 (Param 객체 및 위치 기반 인자 모두 지원)
   */
  public static toMealCreateInput(
    paramsOrUserId: CreateMealInputParams | number,
    mealType?: MealType,
    calories?: number,
    carbs?: number,
    protein?: number,
    fat?: number,
    comment?: string
  ) {
    if (typeof paramsOrUserId === "object") {
      return {
        user_id: paramsOrUserId.userId,
        meal_type: paramsOrUserId.mealType,
        comment: paramsOrUserId.comment || null,
        total_calories_kcal: paramsOrUserId.calories,
        total_carbohydrate_g: paramsOrUserId.carbs,
        total_protein_g: paramsOrUserId.protein,
        total_fat_g: paramsOrUserId.fat,
      };
    }
    return {
      user_id: paramsOrUserId,
      meal_type: mealType!,
      comment: comment || null,
      total_calories_kcal: calories!,
      total_carbohydrate_g: carbs!,
      total_protein_g: protein!,
      total_fat_g: fat!,
    };
  }

  /**
   * 식단 상세 세부 음식(MealItem) DB 생성 인풋 객체 생성 (Param 객체 및 위치 기반 인자 모두 지원)
   */
  public static toMealItemCreateInput(
    paramsOrMealId: CreateMealItemInputParams | bigint,
    foodName?: string,
    intakeGram?: number,
    foodId?: number | null,
    boundingBox?: any,
    confidence?: number | null,
    mealImageId?: bigint | string | null
  ) {
    if (typeof paramsOrMealId === "object") {
      return {
        meal_id: paramsOrMealId.mealId,
        food_id: paramsOrMealId.foodId || null,
        custom_food_name: paramsOrMealId.foodName,
        intake_gram: paramsOrMealId.intakeGram,
        bounding_box: paramsOrMealId.boundingBox || null,
        confidence: paramsOrMealId.confidence !== undefined && paramsOrMealId.confidence !== null ? paramsOrMealId.confidence : null,
        meal_image_id: paramsOrMealId.mealImageId ? BigInt(paramsOrMealId.mealImageId) : null,
      };
    }
    return {
      meal_id: paramsOrMealId,
      food_id: foodId || null,
      custom_food_name: foodName!,
      intake_gram: intakeGram!,
      bounding_box: boundingBox || null,
      confidence: confidence !== undefined && confidence !== null ? confidence : null,
      meal_image_id: mealImageId ? BigInt(mealImageId) : null,
    };
  }

  /**
   * 식단 사진 이미지(MealImage) DB 생성 인풋 객체 생성
   */
  public static toMealImageCreateInput(mealId: bigint, imageUrl: string) {
    return {
      meal_id: mealId,
      image_url: imageUrl,
      is_cover: true,
    };
  }

  /**
   * 식단 등록 서비스 응답 DTO 반환
   */
  public static toMealLogRegisterResponse(
    mealId: bigint | string,
    gainedFuel: number,
    totalCalories: number,
    currentFuel: number
  ): MealLogRegisterResponse {
    return {
      mealId: mealId.toString(),
      logId: Number(mealId),
      earnedFuel: gainedFuel,
      gainedFuel,
      gainedExp: 30,
      totalCalories,
      currentFuel,
    };
  }

  /**
   * DB 음식 검색 목록 ➔ FoodSearchResponse DTO 변환
   */
  public static toFoodSearchResponse(dbFoods: DbFoodItem[]): FoodSearchResponse {
    const foods: FoodDto[] = BaseMapper.mapList(dbFoods, (f) => ({
      id: f.id,
      name: f.name,
      standardServingG: Number(f.standard_serving_g),
      caloriesKcal: f.calories_kcal,
      carbohydrateG: Number(f.carbohydrate_g),
      proteinG: Number(f.protein_g),
      fatG: Number(f.fat_g),
      category: f.category || undefined,
    }));

    return { foods };
  }
}
