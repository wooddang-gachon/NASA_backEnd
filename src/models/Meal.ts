export interface MealItem {
  id?: number;
  mealId?: number;
  foodName: string;
  caloriesKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
}

export interface Meal {
  id: number;
  userId: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  imageUrl?: string;
  comment?: string;
  totalCaloriesKcal: number;
  totalCarbohydrateG: number;
  totalProteinG: number;
  totalFatG: number;
  registeredAt?: Date;
  items?: MealItem[];
}

export class MealModel {
  /**
   * 사용자의 식사 로그 목록을 세부 음식 정보와 함께 조회합니다. (스텁)
   */
  public static async findLogsByUserId(userId: number, limit = 10): Promise<Meal[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * 식사 및 세부 음식 정보 목록을 저장합니다. (스텁)
   */
  public static async createMeal(
    userId: number,
    mealData: Omit<Meal, "id" | "userId" | "registeredAt">,
    items: Omit<MealItem, "id" | "mealId">[]
  ): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
