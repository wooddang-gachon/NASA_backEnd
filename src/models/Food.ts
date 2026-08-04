export interface Food {
  id: number;
  name: string;
  standardServingG: number;
  caloriesKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
  createdAt?: Date;
}

export interface MealImage {
  id: number;
  mealId: number;
  imageUrl: string;
  orderIndex: number;
}

export class FoodModel {
  /**
   * 키워드로 표준 음식 데이터 검색 (스텁)
   */
  public static async searchByName(keyword: string): Promise<Food[]> {
    throw new Error("Method not implemented.");
  }
}
