import FoodService from '../../../services/foodService';
import AiService from '../../../services/aiService';
import LocalVisionService from '../../../services/localVisionService';
import FoodRepository from '../../../repositories/FoodRepository';
import { Container } from 'typedi';
import fs from 'fs';
import { UserNotFoundError } from '../../../errors';

jest.mock('../../../services/aiService');
jest.mock('../../../services/localVisionService');
jest.mock('../../../repositories/FoodRepository');
jest.mock('fs');
jest.mock('../../../utils/imageAnnotator', () => ({
  drawBoundingBoxesAndSave: jest.fn(),
}));

describe('FoodService', () => {
  let foodService: FoodService;
  let mockAiService: jest.Mocked<AiService>;
  let mockLocalVisionService: jest.Mocked<LocalVisionService>;
  let mockFoodRepository: jest.Mocked<FoodRepository>;

  beforeEach(() => {
    mockAiService = new AiService() as jest.Mocked<AiService>;
    mockLocalVisionService = new LocalVisionService() as jest.Mocked<LocalVisionService>;
    mockFoodRepository = new FoodRepository() as jest.Mocked<FoodRepository>;

    foodService = new FoodService();
    (foodService as any).aiService = mockAiService;
    (foodService as any).localVisionService = mockLocalVisionService;
    (foodService as any).foodRepository = mockFoodRepository;

    // Mock fs functions
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('dummy'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe('uploadAndAnalyzeFoodVision', () => {
    it('should throw error if file is missing', async () => {
      await expect(foodService.uploadAndAnalyzeFoodVision(undefined)).rejects.toThrow(
        '업로드할 이미지 파일(file)이 누락되었습니다.',
      );
    });

    it('should process file and call analyzeFoodVision', async () => {
      const file = { originalname: 'test.jpg', buffer: Buffer.from('test') } as Express.Multer.File;

      mockFoodRepository.createMealImage.mockResolvedValue({ id: 1 } as any);

      jest.spyOn(foodService, 'analyzeFoodVision').mockResolvedValue({
        scanEngine: 'YOLO',
        detectedFoods: [],
      } as any);

      const result = await foodService.uploadAndAnalyzeFoodVision(file, 'BREAKFAST');

      expect(mockFoodRepository.createMealImage).toHaveBeenCalled();
      expect(foodService.analyzeFoodVision).toHaveBeenCalled();
      expect(result).toHaveProperty('imageId', '1');
    });
  });

  describe('logMeal', () => {
    it('should throw UserNotFoundError if user does not exist', async () => {
      mockFoodRepository.findUserById.mockResolvedValue(null);
      await expect(foodService.logMeal(999, { mealType: 'LUNCH' } as any)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it('should log meal successfully', async () => {
      mockFoodRepository.findUserById.mockResolvedValue({ id: 1 } as any);
      mockFoodRepository.createMealLogWithTransaction.mockResolvedValue({
        meal: { id: 100 },
        gainedFuel: 10,
        updatedUser: { current_fuel: 50 },
      } as any);

      jest.spyOn(foodService, 'getOrMapFood').mockResolvedValue({
        foodId: 1,
        standardServingG: 100,
        caloriesKcal: 200,
        carbohydrateG: 20,
        proteinG: 10,
        fatG: 5,
        rawName: 'Apple',
        matchType: 'EXACT',
      } as any);

      const result = await foodService.logMeal(1, {
        mealType: 'LUNCH',
        foodName: 'Apple',
        intakeGram: 100,
      } as any);

      expect(mockFoodRepository.findUserById).toHaveBeenCalledWith(1);
      expect(mockFoodRepository.createMealLogWithTransaction).toHaveBeenCalled();
      expect(String(result.mealId)).toBe('100');
      expect(result.earnedFuel).toBe(10);
      expect(result.totalCalories).toBe(200);
    });
  });

  describe('searchFoods', () => {
    it('should search foods by keyword and return mapped response', async () => {
      mockFoodRepository.searchFoodsByKeyword.mockResolvedValue([
        {
          id: 1,
          name: 'Apple',
          manufacturer: 'None',
          calories_kcal: 50,
          carbohydrate_g: 10,
          protein_g: 0,
          fat_g: 0,
          category: 'Fruit',
          standard_serving_g: 100,
        },
      ] as any);

      const result = await foodService.searchFoods('Apple');
      expect(mockFoodRepository.searchFoodsByKeyword).toHaveBeenCalledWith('Apple', 10);
      expect(result.foods).toHaveLength(1);
      expect(result.foods[0]!.name).toBe('Apple');
    });
  });
});
