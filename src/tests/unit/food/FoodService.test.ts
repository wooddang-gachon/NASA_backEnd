import FoodService from "../../../services/foodService";
import AiService from "../../../services/aiService";
import LocalVisionService from "../../../services/localVisionService";
import FoodRepository from "../../../repositories/FoodRepository";
import { Container } from "typedi";
import fs from "fs";
import { UserNotFoundError } from "../../../errors";
import StorageAdapter from "../../../adapters/StorageAdapter";

jest.mock("../../../services/aiService");
jest.mock("../../../services/localVisionService");
jest.mock("../../../repositories/FoodRepository");
jest.mock("../../../adapters/StorageAdapter");
jest.mock("fs");
jest.mock("../../../utils/imageAnnotator", () => ({
  drawBoundingBoxesAndSave: jest.fn(),
}));

describe("FoodService", () => {
  let foodService: FoodService;
  let mockAiService: jest.Mocked<AiService>;
  let mockLocalVisionService: jest.Mocked<LocalVisionService>;
  let mockFoodRepository: jest.Mocked<FoodRepository>;
  let mockStorageAdapter: jest.Mocked<StorageAdapter>;

  beforeEach(() => {
    mockAiService = new AiService() as jest.Mocked<AiService>;
    mockLocalVisionService =
      new LocalVisionService() as jest.Mocked<LocalVisionService>;
    mockFoodRepository = new FoodRepository() as jest.Mocked<FoodRepository>;
    mockStorageAdapter = new StorageAdapter() as jest.Mocked<StorageAdapter>;

    foodService = new FoodService();
    Object.assign(foodService, {
      aiService: mockAiService,
      localVisionService: mockLocalVisionService,
      foodRepository: mockFoodRepository,
      storageAdapter: mockStorageAdapter,
    });

    mockStorageAdapter.saveFile.mockReturnValue({
      absolutePath: "/tmp/a.jpg",
      urlPath: "/uploads/a.jpg",
    });
    mockStorageAdapter.readFile.mockReturnValue(Buffer.from("dummy"));

    // Mock fs functions
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from("dummy"));
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("logMeal", () => {
    it("should throw UserNotFoundError if user does not exist", async () => {
      mockFoodRepository.findUserById.mockResolvedValue(null);
      await expect(
        foodService.logMeal(999, { mealType: "LUNCH" } as never),
      ).rejects.toThrow(UserNotFoundError);
    });

    it("should log meal successfully", async () => {
      mockFoodRepository.findUserById.mockResolvedValue({ id: 1 } as never);
      mockFoodRepository.createMealLogWithTransaction.mockResolvedValue({
        meal: { id: 100 },
        gainedFuel: 10,
        updatedUser: { current_fuel: 50 },
      } as never);

      jest.spyOn(foodService, "getOrMapFood").mockResolvedValue({
        foodId: 1,
        standardServingG: 100,
        caloriesKcal: 200,
        carbohydrateG: 20,
        proteinG: 10,
        fatG: 5,
        rawName: "Apple",
        matchType: "EXACT",
      } as never);

      const result = await foodService.logMeal(1, {
        mealType: "LUNCH",
        foods: [{ foodName: "Apple", gram: 100 }],
      } as never);

      expect(mockFoodRepository.findUserById).toHaveBeenCalledWith(1);
      expect(
        mockFoodRepository.createMealLogWithTransaction,
      ).toHaveBeenCalled();
      expect(String(result.mealId)).toBe("100");
      expect(result.earnedFuel).toBe(50);
      expect(result.totalCalories).toBe(200);
    });
  });

  describe("searchFoods", () => {
    it("should search foods by keyword and return mapped response", async () => {
      mockFoodRepository.searchFoodsByKeyword.mockResolvedValue([
        {
          id: 1,
          name: "Apple",
          manufacturer: "None",
          calories_kcal: 50,
          carbohydrate_g: 10,
          protein_g: 0,
          fat_g: 0,
          category: "Fruit",
          standard_serving_g: 100,
        },
      ] as never);

      const result = await foodService.searchFoods("Apple");
      expect(mockFoodRepository.searchFoodsByKeyword).toHaveBeenCalledWith(
        "Apple",
        10,
      );
      expect(result.foods).toHaveLength(1);
      expect(result.foods[0]!.name).toBe("Apple");
    });
  });

  describe("getOrMapFood", () => {
    it("should return mapping if exactly matched in alias DB", async () => {
      mockFoodRepository.findFoodMappingByRawName.mockResolvedValue({
        food: {
          id: 1,
          calories_kcal: 100,
          carbohydrate_g: 10,
          protein_g: 10,
          fat_g: 10,
          standard_serving_g: 100,
        },
        match_type: "EXACT",
      } as never);
      const res = await foodService.getOrMapFood("Pizza");
      expect(res.matchType).toBe("EXACT");
    });

    it("should return master mapping if similar match found in master DB", async () => {
      mockFoodRepository.findFoodMappingByRawName.mockResolvedValue(null);
      mockFoodRepository.findFoodMasterByNameOrKeyword.mockResolvedValue({
        name: "Burger",
        id: 2,
        calories_kcal: 200,
        carbohydrate_g: 20,
        protein_g: 20,
        fat_g: 20,
        standard_serving_g: 200,
      } as never);
      mockFoodRepository.createFoodMapping.mockResolvedValue({
        match_type: "SIMILAR",
      } as never);
      const res = await foodService.getOrMapFood("Burger");
      expect(res.matchType).toBe("SIMILAR");
    });

    it("should fallback to AI if no matches found", async () => {
      mockFoodRepository.findFoodMappingByRawName.mockResolvedValue(null);
      mockFoodRepository.findFoodMasterByNameOrKeyword.mockResolvedValue(null);
      mockAiService.lookupNutrition.mockResolvedValue({
        items: [
          {
            servingSizeG: 100,
            caloriesKcal: 100,
            carbohydrateG: 10,
            proteinG: 10,
            fatG: 10,
            confidence: 1,
          },
        ],
      } as never);
      const res = await foodService.getOrMapFood("AlienFood");
      expect(res.matchType).toBe("USER_CONFIRMED");
      expect(res.caloriesKcal).toBe(100);
    });
  });

  describe("getOrMapFood Error Branches", () => {
    it("should handle lookupNutrition error gracefully", async () => {
      mockFoodRepository.findFoodMappingByRawName.mockResolvedValue(null);
      mockFoodRepository.findFoodMasterByNameOrKeyword.mockResolvedValue(null);
      mockAiService.lookupNutrition.mockRejectedValue(
        new Error("Network Error"),
      );

      const res = await foodService.getOrMapFood("UnknownFood");
      expect(mockAiService.lookupNutrition).toHaveBeenCalled();
      expect(res.matchType).toBe("USER_CONFIRMED");
    });
  });

  describe("logMeal details", () => {
    it("should process and log meal successfully with all matchTypes", async () => {
      mockFoodRepository.findUserById.mockResolvedValue({ id: 1 } as never);
      mockFoodRepository.createMealLogWithTransaction.mockResolvedValue({
        meal: { id: 100 },
        gainedFuel: 10,
        updatedUser: { current_fuel: 50 },
      } as never);
      mockFoodRepository.createFoodMapping.mockResolvedValue({} as never);
      mockFoodRepository.findFoodMasterByNameOrKeyword.mockResolvedValue({
        id: 2,
        name: "Burger",
      } as never);

      const payload = {
        mealType: "DINNER",
        foods: [
          {
            foodName: "Pizza",
            foodId: 2,
            matchType: "SIMILAR",
            gram: 100,
            caloriesKcal: 10,
            carbohydrateG: 1,
            proteinG: 1,
            fatG: 1,
          },
          {
            foodName: "Burger",
            foodId: 3,
            matchType: "EXACT",
            gram: 100,
            caloriesKcal: 10,
            carbohydrateG: 1,
            proteinG: 1,
            fatG: 1,
          },
          {
            foodName: "Unknown",
            matchType: "AI_GENERATED",
            gram: 100,
            caloriesKcal: 10,
            carbohydrateG: 1,
            proteinG: 1,
            fatG: 1,
          },
        ],
      } as any;

      const res = await foodService.logMeal(1, payload);
      expect(res.earnedFuel).toBe(50);
      expect(
        mockFoodRepository.createMealLogWithTransaction,
      ).toHaveBeenCalled();
    });
  });
});
