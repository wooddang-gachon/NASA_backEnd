import { getPrisma } from "../loaders/prisma";
import { Prisma } from "@prisma/client";

// 1. 개별 음식 아이템 인터페이스 (meal_items)
export interface MealItem {
  id?: number;
  meal_id?: number;
  food_name: string;
  calories_kcal: number;
  carbohydrate_g: number;
  protein_g: number;
  fat_g: number;
}

// 2. 전체 식사 정보 인터페이스 (meals)
export interface Meal {
  id: number;
  user_id: number;
  meal_type: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  image_url?: string;
  comment?: string;
  total_calories_kcal: number;
  total_carbohydrate_g: number;
  total_protein_g: number;
  total_fat_g: number;
  registered_at?: Date;

  // 세부 영양 성분 아이템들 (조인용)
  items?: MealItem[];
}

export class MealModel {
  /**
   * 사용자의 식사 로그 목록을 세부 음식 정보(meal_items)와 함께 조회합니다.
   */
  public static async findLogsByUserId(userId: number, limit = 10): Promise<Meal[]> {
    const prisma = getPrisma();
    
    const meals = await prisma.meals.findMany({
      where: { user_id: userId },
      include: {
        meal_items: true
      },
      orderBy: { registered_at: "desc" },
      take: limit
    });

    return meals.map(m => ({
      id: Number(m.id),
      user_id: m.user_id,
      meal_type: m.meal_type as any,
      image_url: m.image_url || undefined,
      comment: m.comment || undefined,
      total_calories_kcal: m.total_calories_kcal,
      total_carbohydrate_g: Number(m.total_carbohydrate_g),
      total_protein_g: Number(m.total_protein_g),
      total_fat_g: Number(m.total_fat_g),
      registered_at: m.registered_at,
      items: m.meal_items.map(i => ({
        id: Number(i.id),
        meal_id: Number(i.meal_id),
        food_name: i.food_name,
        calories_kcal: i.calories_kcal,
        carbohydrate_g: Number(i.carbohydrate_g),
        protein_g: Number(i.protein_g),
        fat_g: Number(i.fat_g)
      }))
    }));
  }

  /**
   * 새로운 식사 및 하위 음식 정보 목록을 하나의 프리즈마 트랜잭션으로 안전하게 저장합니다.
   */
  public static async createMeal(
    userId: number,
    mealData: Omit<Meal, "id" | "user_id" | "registered_at">,
    items: Omit<MealItem, "id" | "meal_id">[]
  ): Promise<number> {
    const prisma = getPrisma();

    // 트랜잭션 내부에서 일련의 작업을 수행합니다.
    const createdMeal = await prisma.$transaction(async (tx) => {
      // 1. meals 적재
      const meal = await tx.meals.create({
        data: {
          user_id: userId,
          meal_type: mealData.meal_type as any,
          image_url: mealData.image_url || null,
          comment: mealData.comment || null,
          total_calories_kcal: mealData.total_calories_kcal,
          total_carbohydrate_g: new Prisma.Decimal(mealData.total_carbohydrate_g),
          total_protein_g: new Prisma.Decimal(mealData.total_protein_g),
          total_fat_g: new Prisma.Decimal(mealData.total_fat_g)
        }
      });

      const mealId = meal.id;

      // 2. meal_items 일괄 적재
      if (items.length > 0) {
        await tx.meal_items.createMany({
          data: items.map(item => ({
            meal_id: mealId,
            food_name: item.food_name,
            calories_kcal: item.calories_kcal,
            carbohydrate_g: new Prisma.Decimal(item.carbohydrate_g),
            protein_g: new Prisma.Decimal(item.protein_g),
            fat_g: new Prisma.Decimal(item.fat_g)
          }))
        });
      }

      return meal;
    });

    return Number(createdMeal.id);
  }
}
