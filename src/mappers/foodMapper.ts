import { MealType } from "../interfaces/enums";
import { MealLogRegisterResponse, FoodSearchResponse, FoodDto } from "../dto";

export class FoodMapper {
  /**
   * 식단(Meal) DB 생성 인풋 객체 생성
   */
  public static toMealCreateInput(
    userId: number,
    mealType: MealType,
    calories: number,
    carbs: number,
    protein: number,
    fat: number,
    comment?: string
  ) {
    return {
      user_id: userId,
      meal_type: mealType,
      comment: comment || null,
      total_calories_kcal: calories,
      total_carbohydrate_g: carbs,
      total_protein_g: protein,
      total_fat_g: fat,
    };
  }

  /**
   * 식단 상세 세부 음식(MealItem) DB 생성 인풋 객체 생성
   */
  public static toMealItemCreateInput(
    mealId: bigint,
    foodName: string,
    intakeGram: number,
    calories: number,
    carbs: number,
    protein: number,
    fat: number
  ) {
    return {
      meal_id: mealId,
      custom_food_name: foodName,
      intake_gram: intakeGram,
      calories_kcal: calories,
      carbohydrate_g: carbs,
      protein_g: protein,
      fat_g: fat,
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
  public static toFoodSearchResponse(dbFoods: any[]): FoodSearchResponse {
    const foods: FoodDto[] = dbFoods.map((f) => ({
      id: f.id,
      name: f.name,
      standardServingG: Number(f.standard_serving_g),
      caloriesKcal: f.calories_kcal,
      carbohydrateG: Number(f.carbohydrate_g),
      proteinG: Number(f.protein_g),
      fatG: Number(f.fat_g),
      category: f.category,
    }));

    return { foods };
  }
}
