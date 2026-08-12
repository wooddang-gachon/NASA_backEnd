import { Container } from "typedi";
import { FoodController } from "../../../api/routes/FoodController";
import FoodService from "../../../services/foodService";
import { MealType } from "../../../interfaces/enums";
import { AuthenticatedRequest } from "../../../interfaces/express";

jest.mock("../../../services/foodService");

describe("FoodController", () => {
  let foodController: FoodController;
  let mockFoodService: jest.Mocked<FoodService>;

  beforeEach(() => {
    mockFoodService = new FoodService() as jest.Mocked<FoodService>;
    
    // Inject mocked FoodService to Container
    Container.set(FoodService, mockFoodService);
    
    foodController = new FoodController();

    // Mock BaseController methods to isolate the controller logic
    (foodController as any).getUserId = jest.fn().mockReturnValue(1);
    (foodController as any).success = jest.fn().mockImplementation((data: any) => ({ status: 200, data }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("scanFoodVision", () => {
    it("should upload file and return scan result", async () => {
      const mockFile = { originalname: "test.jpg", buffer: Buffer.from("test") } as Express.Multer.File;
      const mockResult = { scanEngine: "YOLO", detectedFoods: [] };
      mockFoodService.uploadAndAnalyzeFoodVision.mockResolvedValue(mockResult as any);

      const result = await foodController.scanFoodVision(mockFile, MealType.BREAKFAST);

      expect(mockFoodService.uploadAndAnalyzeFoodVision).toHaveBeenCalledWith(mockFile, MealType.BREAKFAST);
      expect((foodController as any).success).toHaveBeenCalledWith(mockResult);
      expect(result).toEqual({ status: 200, data: mockResult });
    });
  });

  describe("confirmFoodLog", () => {
    it("should log meal and return confirm response", async () => {
      const mockRequest = {} as AuthenticatedRequest;
      const mockBody = {
        mealType: MealType.LUNCH,
        foodName: "Apple",
        intakeGram: 150
      };
      
      const mockServiceResponse = {
        mealId: 10,
        earnedFuel: 50,
        totalCalories: 200,
        currentFuel: 100
      };
      
      mockFoodService.logMeal.mockResolvedValue(mockServiceResponse as any);

      const result = await foodController.confirmFoodLog(mockRequest, mockBody);

      expect((foodController as any).getUserId).toHaveBeenCalledWith(mockRequest);
      expect(mockFoodService.logMeal).toHaveBeenCalledWith(1, {
        mealType: MealType.LUNCH,
        imageId: undefined,
        imageUrl: undefined,
        foods: undefined,
        foodName: "Apple",
        intakeGram: 150,
        comment: undefined,
      });

      const expectedResponseData = {
        mealId: 10,
        earnedFuel: 50,
        totalCalories: 200,
      };
      expect((foodController as any).success).toHaveBeenCalledWith(expectedResponseData);
      expect(result).toEqual({ status: 200, data: expectedResponseData });
    });
  });
});
