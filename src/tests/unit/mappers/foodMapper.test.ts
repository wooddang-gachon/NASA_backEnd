import { FoodMapper } from "../../../mappers/foodMapper";
import { MealType } from "../../../interfaces/enums";

describe("foodMapper", () => {
  it("toFoodSmartMatchResultFromMapping", () => {
    const dbMapping = {
      food: {
        id: 1,
        standard_serving_g: 100,
        calories_kcal: 200,
        carbohydrate_g: 10,
        protein_g: 20,
        fat_g: 30,
      },
      match_type: "EXACT",
    };
    const res = FoodMapper.toFoodSmartMatchResultFromMapping(
      dbMapping as any,
      "Pizza",
    );
    expect(res.rawName).toBe("Pizza");
    expect(res.matchType).toBe("EXACT");
  });

  it("toFoodSmartMatchResultFromMaster", () => {
    const master = {
      id: 2,
      standard_serving_g: 200,
      calories_kcal: 300,
      carbohydrate_g: 50,
      protein_g: 10,
      fat_g: 5,
    };
    const res = FoodMapper.toFoodSmartMatchResultFromMaster(
      master as any,
      "Burger",
      "SIMILAR",
    );
    expect(res.matchType).toBe("SIMILAR");
  });

  it("toFoodSmartMatchResultFromFallback", () => {
    const res = FoodMapper.toFoodSmartMatchResultFromFallback("Unknown", null);
    expect(res.standardServingG).toBe(100);

    const res2 = FoodMapper.toFoodSmartMatchResultFromFallback("Known", {
      estimatedGram: 50,
    });
    expect(res2.standardServingG).toBe(50);
  });

  it("toMealCreateInput", () => {
    // object mode
    const res1 = FoodMapper.toMealCreateInput({
      userId: 1,
      mealType: MealType.BREAKFAST,
      calories: 100,
      carbs: 10,
      protein: 10,
      fat: 10,
      comment: "Test",
    });
    expect(res1.user_id).toBe(1);

    // parameter mode
    const res2 = FoodMapper.toMealCreateInput(
      2,
      MealType.LUNCH,
      200,
      20,
      20,
      20,
      "L",
    );
    expect(res2.user_id).toBe(2);
  });

  it("toMealItemCreateInput", () => {
    // object mode
    const res1 = FoodMapper.toMealItemCreateInput({
      mealId: BigInt(1),
      foodName: "Rice",
      intakeGram: 100,
      foodId: 5,
      boundingBox: {},
      confidence: 0.9,
      mealImageId: "10",
    });
    expect(res1.meal_id).toBe(BigInt(1));

    // parameter mode
    const res2 = FoodMapper.toMealItemCreateInput(
      BigInt(2),
      "Bread",
      50,
      6,
      null,
      null,
      null,
    );
    expect(res2.meal_id).toBe(BigInt(2));
  });

  it("toMealImageCreateInput", () => {
    const res = FoodMapper.toMealImageCreateInput(BigInt(1), "url");
    expect(res.image_url).toBe("url");
  });

  it("toMealLogRegisterResponse", () => {
    const res = FoodMapper.toMealLogRegisterResponse(BigInt(1), 10, 100, 50);
    expect(res.logId).toBe(1);
  });

  it("toFoodSearchResponse", () => {
    const res = FoodMapper.toFoodSearchResponse([
      {
        id: 1,
        name: "Rice",
        standard_serving_g: 100,
        calories_kcal: 100,
        carbohydrate_g: 20,
        protein_g: 2,
        fat_g: 0,
        category: "Grain",
      } as any,
    ]);
    expect(res.foods[0]!.name).toBe("Rice");
  });

  it("toFoodLogConfirmResponse", () => {
    const res = FoodMapper.toFoodLogConfirmResponse({
      mealId: "10",
      earnedFuel: 20,
      totalCalories: 500,
    });
    expect(res.mealId).toBe("10");
    expect(res.earnedFuel).toBe(20);
    expect(res.totalCalories).toBe(500);
  });

  it("covers missing branches", () => {
    // toMealCreateInput with object missing comment/confidence etc
    FoodMapper.toMealCreateInput({
      userId: 1,
      mealType: MealType.BREAKFAST,
      comment: "Hello",
    } as any);

    // toMealItemCreateInput with object
    FoodMapper.toMealItemCreateInput({
      mealId: BigInt(1),
      confidence: 0.99,
      mealImageId: 10,
    } as any);
  });
});
