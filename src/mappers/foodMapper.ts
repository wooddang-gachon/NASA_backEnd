import { MealType } from "../interfaces/enums";
import { MatchType } from "@prisma/client";
import {
  MealLogRegisterResponse,
  FoodSearchResponse,
  FoodDto,
  FoodSmartMatchResultDto,
  FoodLogConfirmResponse,
} from "../dto";
import {
  DbFoodMappingItem,
  DbFoodItem,
  CreateMealInputParams,
  CreateMealItemInputParams,
} from "../repositories/models";
import { BaseMapper } from "./BaseMapper";

export class FoodMapper extends BaseMapper {
  /**
   * DB food_mappings 엔티티 ➔ FoodSmartMatchResultDto 변환
   * @param dbMapping - Food mapping DB item
   * @param rawName - Raw name of the food
   * @returns Smart match result DTO
   */
  public static toFoodSmartMatchResultFromMapping(
    dbMapping: DbFoodMappingItem,
    rawName: string,
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
      matchType: dbMapping.match_type as MatchType,
    };
  }

  /**
   * foods 마스터 DB 엔티티 ➔ FoodSmartMatchResultDto 변환
   * @param masterFood - Master food DB item
   * @param rawName - Raw name of the food
   * @param matchType - Match type string
   * @returns Smart match result DTO
   */
  public static toFoodSmartMatchResultFromMaster(
    masterFood: DbFoodItem,
    rawName: string,
    matchType: string,
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
   * @param rawName - Raw name of the food
   * @param detected - Detected fallback data
   * @returns Smart match result DTO
   */
  public static toFoodSmartMatchResultFromFallback(
    rawName: string,
    detected: Record<string, unknown> | null,
  ): FoodSmartMatchResultDto {
    return {
      rawName,
      foodId: 0,
      standardServingG: (detected?.estimatedGram as number) || 100,
      caloriesKcal: (detected?.calories as number) || 250,
      carbohydrateG: (detected?.carbs as number) || 30,
      proteinG: (detected?.protein as number) || 20,
      fatG: (detected?.fat as number) || 5,
      matchType: "USER_CONFIRMED",
    };
  }

  /**
   * 식단(Meal) DB 생성 인풋 객체 생성 (Param 객체 및 위치 기반 인자 모두 지원)
   * @param paramsOrUserId - User ID or CreateMealInputParams object
   * @param mealType - Meal type
   * @param calories - Total calories
   * @param carbs - Total carbohydrates
   * @param protein - Total protein
   * @param fat - Total fat
   * @param comment - Comment
   * @returns Created meal input object
   */
  public static toMealCreateInput(
    paramsOrUserId: CreateMealInputParams | number,
    mealType?: MealType,
    calories?: number,
    carbs?: number,
    protein?: number,
    fat?: number,
    comment?: string,
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
   * @param paramsOrMealId - Meal ID or CreateMealItemInputParams object
   * @param foodName - Custom food name
   * @param intakeGram - Intake in grams
   * @param foodId - Food ID
   * @param boundingBox - Bounding box array or object
   * @param confidence - Confidence score
   * @param mealImageId - Meal image ID
   * @returns Created meal item input object
   */
  public static toMealItemCreateInput(
    paramsOrMealId: CreateMealItemInputParams | bigint,
    foodName?: string,
    intakeGram?: number,
    foodId?: number | null,
    boundingBox?: unknown,
    confidence?: number | null,
    mealImageId?: bigint | string | null,
  ) {
    if (typeof paramsOrMealId === "object") {
      return {
        meal_id: paramsOrMealId.mealId,
        food_id: paramsOrMealId.foodId || null,
        custom_food_name: paramsOrMealId.foodName,
        intake_gram: paramsOrMealId.intakeGram,
        bounding_box: paramsOrMealId.boundingBox
          ? (paramsOrMealId.boundingBox as import("@prisma/client").Prisma.InputJsonValue)
          : undefined,
        confidence:
          paramsOrMealId.confidence !== undefined &&
          paramsOrMealId.confidence !== null
            ? paramsOrMealId.confidence
            : null,
        meal_image_id: paramsOrMealId.mealImageId
          ? BigInt(paramsOrMealId.mealImageId)
          : null,
      };
    }
    return {
      meal_id: paramsOrMealId,
      food_id: foodId || null,
      custom_food_name: foodName!,
      intake_gram: intakeGram!,
      bounding_box: boundingBox
        ? (boundingBox as import("@prisma/client").Prisma.InputJsonValue)
        : undefined,
      confidence:
        confidence !== undefined && confidence !== null ? confidence : null,
      meal_image_id: mealImageId ? BigInt(mealImageId) : null,
    };
  }

  /**
   * 식단 사진 이미지(MealImage) DB 생성 인풋 객체 생성
   * @param mealId - Meal ID
   * @param imageUrl - Image URL
   * @returns Created meal image input object
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
   * @param mealId - Meal ID
   * @param gainedFuel - Gained fuel amount
   * @param totalCalories - Total calories
   * @param currentFuel - Current fuel amount
   * @returns Meal log register response DTO
   */
  public static toMealLogRegisterResponse(
    mealId: bigint | string,
    gainedFuel: number,
    totalCalories: number,
    currentFuel: number,
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
   * @param dbFoods - Array of DB food items
   * @returns Food search response DTO
   */
  public static toFoodSearchResponse(
    dbFoods: DbFoodItem[],
  ): FoodSearchResponse {
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

  /**
   * 식단 확정 응답 DTO 변환
   * @param res - Meal log registration result
   * @returns Food log confirm response DTO
   */
  public static toFoodLogConfirmResponse(
    res: MealLogRegisterResponse,
  ): FoodLogConfirmResponse {
    return {
      mealId: res.mealId,
      earnedFuel: res.earnedFuel,
      totalCalories: res.totalCalories,
    };
  }
}

export const toFoodLogConfirmResponse = FoodMapper.toFoodLogConfirmResponse;
