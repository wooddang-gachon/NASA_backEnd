import { Container } from "typedi";
import { FoodController } from "../../../api/routes/FoodController";
import FoodService from "../../../services/foodService";
import FoodVisionService from "../../../services/foodVisionService";
import { MealType } from "../../../interfaces/enums";
import type { AuthenticatedRequest } from "../../../interfaces/express";

jest.mock("../../../services/foodService");
jest.mock("../../../services/foodVisionService");

describe("FoodController", () => {
  let foodController: FoodController;
  let mockFoodService: jest.Mocked<FoodService>;
  let mockFoodVisionService: jest.Mocked<FoodVisionService>;

  beforeEach(() => {
    mockFoodService = new FoodService() as jest.Mocked<FoodService>;
    mockFoodVisionService =
      new FoodVisionService() as jest.Mocked<FoodVisionService>;

    // Inject mocked services to Container
    Container.set(FoodService, mockFoodService);
    Container.set(FoodVisionService, mockFoodVisionService);

    foodController = new FoodController();

    // Mock BaseController methods to isolate the controller logic
    (foodController as unknown as Record<string, unknown>).getUserId = jest
      .fn()
      .mockReturnValue(1);
    (foodController as unknown as Record<string, unknown>).success = jest
      .fn()
      .mockImplementation((data: unknown) => ({ status: 200, data }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("scanFoodVision", () => {
    it("should upload file and return scan result", async () => {
      const mockFile = {
        originalname: "test.jpg",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;
      const mockResult = { scanEngine: "YOLO", detectedFoods: [] };
      mockFoodVisionService.uploadAndAnalyzeFoodVision.mockResolvedValue(
        mockResult as never,
      );

      const result = await foodController.scanFoodVision(
        mockFile,
        MealType.BREAKFAST,
      );

      expect(
        mockFoodVisionService.uploadAndAnalyzeFoodVision,
      ).toHaveBeenCalledWith(mockFile, MealType.BREAKFAST);
      expect(
        (foodController as unknown as Record<string, unknown>).success,
      ).toHaveBeenCalledWith(mockResult);
      expect(result).toEqual({ status: 200, data: mockResult });
    });
  });

  describe("confirmFoodLog", () => {
    it("should log meal and return confirm response", async () => {
      const mockRequest = {} as AuthenticatedRequest;
      const mockBody = {
        mealType: MealType.LUNCH,
        imageId: "123",
        foods: [{ foodName: "Apple", gram: 150 }],
      };

      const mockServiceResponse = {
        mealId: 10,
        earnedFuel: 50,
        totalCalories: 200,
        currentFuel: 100,
      };

      mockFoodService.logMeal.mockResolvedValue(mockServiceResponse as never);

      const result = await foodController.confirmFoodLog(
        mockRequest,
        mockBody as never,
      );

      expect(
        (foodController as unknown as Record<string, unknown>).getUserId,
      ).toHaveBeenCalledWith(mockRequest);
      expect(mockFoodService.logMeal).toHaveBeenCalledWith(1, {
        mealType: MealType.LUNCH,
        imageId: "123",
        foods: [{ foodName: "Apple", gram: 150 }],
        comment: undefined,
      });

      const expectedResponseData = {
        mealId: 10,
        earnedFuel: 50,
        totalCalories: 200,
      };
      expect(
        (foodController as unknown as Record<string, unknown>).success,
      ).toHaveBeenCalledWith(expectedResponseData);
      expect(result).toEqual({ status: 200, data: expectedResponseData });
    });
  });
});
