import { Service, Inject } from 'typedi';
import { FUEL_REWARDS, EXP_REWARDS } from '@/constants/gamification';
import AiService from './aiService';
import LocalVisionService from './localVisionService';
import { getPrisma } from '../loaders/prisma';
import Logger from '../loaders/logger';
import FoodRepository from '../repositories/FoodRepository';
import { UserNotFoundError } from '../errors';
import { MealType } from '../interfaces/enums';
import { FoodMapper, UserMapper } from '../mappers';
import {
  MealLogRegisterResponse,
  FoodSearchResponse,
  FoodSmartMatchResultDto,
  FoodVisionScanResponse,
  FoodLogConfirmRequest,
} from '../dto';

import { cleanFoodKeyword } from '../utils/food/foodUtils';
import { tokenizeFoodName } from '../utils/food/foodTokenizer';
import { drawBoundingBoxesAndSave } from '../utils/imageAnnotator';

import path from 'path';
import fs from 'fs';

@Service()
export default class FoodService {
  @Inject((type) => AiService)
  private aiService!: AiService;

  @Inject((type) => LocalVisionService)
  private localVisionService!: LocalVisionService;

  @Inject((type) => FoodRepository)
  private foodRepository!: FoodRepository;

  public async uploadAndAnalyzeFoodVision(
    file?: Express.Multer.File,
    mealType?: string,
  ): Promise<FoodVisionScanResponse> {
    if (!file) {
      Logger.error('[FoodService] Upload image file is missing.');
      throw new Error('업로드할 이미지 파일(file)이 누락되었습니다.');
    }

    Logger.info(`[FoodService] Uploading and analyzing food vision file: ${file.originalname}`);

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    Logger.info(`[FoodService] Saved uploaded file to ${filePath}`);

    const imageUrl = `/uploads/${filename}`;

    // 1. 이미지가 업로드되는 즉시 meal_images DB 테이블에 바로 연동/저장 (meal_id는 아직 null)
    const savedImage = await this.foodRepository.createMealImage(imageUrl, true);
    Logger.info(
      `[FoodService] Immediate image registration created in DB: meal_images ID ${savedImage.id}`,
    );

    const res = await this.analyzeFoodVision(imageUrl, mealType);

    // [테스트/디버그 용] Bounding Box가 존재하는 경우 네모 표시가 된 추가 이미지 생성 및 저장 (_debug.jpg)
    if (res && res.detectedFoods && res.detectedFoods.length > 0) {
      await drawBoundingBoxesAndSave(filePath, res.detectedFoods);
    }

    return {
      ...res,
      imageId: savedImage.id.toString(),
    };
  }

  /**
   * [FOD-005] 음식명 스마트 매칭 메서드 (foods 마스터 보호 원칙)
   * 1차: food_mappings 중간 테이블 조회
   * 2차: foods 마스터 DB 대표 키워드 부분 매칭 ('고추떡볶이' ➔ '떡볶이' id:10)
   * ➔ 매칭 성공 시 food_mappings에 'ALIAS'로 캐싱 저장!
   */
  public async getOrMapFood(rawName: string): Promise<FoodSmartMatchResultDto> {
    // Step 1: food_mappings 중간 매칭 테이블 1차 검색
    const mapping = await this.foodRepository.findFoodMappingByRawName(rawName);

    if (mapping && mapping.food) {
      Logger.info(
        `[FOD-005] Food mapping hit for '${rawName}' ➔ Standard food: '${mapping.food.name}' (${mapping.match_type})`,
      );
      return FoodMapper.toFoodSmartMatchResultFromMapping(mapping as any, rawName);
    }

    // Step 2: foods 마스터 DB 대표 키워드 검색 (토크나이저 기반 스마트 명사 정규화)
    const tokenAnalysis = tokenizeFoodName(rawName);
    const keywordCleaned = tokenAnalysis.normalizedName;

    const masterFood = await this.foodRepository.findFoodMasterByNameOrKeyword(
      rawName,
      keywordCleaned,
    );

    if (masterFood) {
      Logger.info(
        `[FOD-005] Keyword match in foods master: '${masterFood.name}' for rawName '${rawName}'`,
      );

      // foods 테이블에는 새 레코드를 절대 추가하지 않고, food_mappings에만 ALIAS 연결 등록!
      const matchType = masterFood.name === rawName ? 'EXACT' : 'ALIAS';
      const newMapping = await this.foodRepository.createFoodMapping(
        rawName,
        masterFood.id,
        matchType,
      );

      return FoodMapper.toFoodSmartMatchResultFromMaster(
        masterFood as any,
        rawName,
        newMapping.match_type,
      );
    }

    // Step 3: foods DB에 상위 키워드조차 없는 생소한 음식일 경우
    // foods 마스터 DB는 훼손하지 않고, AI 웹 검색 영양 조회값만 안전하게 반환
    Logger.info(
      `[FOD-005] Food '${rawName}' not in foods master. Fallback to AI nutrition lookup without modifying foods master.`,
    );

    // 영양 조회는 비전이 아니라 /v1/nutrition/lookup 담당이다. 비전
    // 엔드포인트는 이미지가 없으면 IMAGE_REQUIRED(400)를 돌려주므로
    // 음식명만으로는 호출할 수 없다.
    let detected: any = null;
    try {
      const lookup = await this.aiService.lookupNutrition([rawName]);
      const item = lookup?.items?.[0];

      // 검색으로 확인하지 못한 음식은 수치가 0, confidence가 0으로 온다.
      if (item && item.confidence > 0) {
        detected = {
          estimatedGram: item.servingSizeG,
          calories: item.caloriesKcal,
          carbs: item.carbohydrateG,
          protein: item.proteinG,
          fat: item.fatG,
        };
      }
    } catch (err) {
      // 조회에 실패해도 스캔 전체가 무너지지 않도록 기본값으로 이어간다.
      Logger.warn(`[FOD-005] Nutrition lookup failed for '${rawName}': ${err}`);
    }

    return FoodMapper.toFoodSmartMatchResultFromFallback(rawName, detected);
  }

  public async analyzeFoodVision(
    imageUrl: string,
    mealType?: string,
  ): Promise<FoodVisionScanResponse> {
    Logger.info(
      `[FoodService] Analyzing food vision for image: ${imageUrl}, mealType: ${mealType || 'N/A'}`,
    );

    let aiVisionResult: any = null;
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    const imagePath = path.join(process.cwd(), cleanPath);

    let yoloContext = {
      attempted: true,
      detected: false,
      reason: '',
    };

    // [FOD-001] 1차: 자체 경량 YOLO 모델(ONNX) 스캔
    if (fs.existsSync(imagePath)) {
      try {
        const imageBuffer = fs.readFileSync(imagePath);
        const localResults = await this.localVisionService.detectFoodObjects(imageBuffer);

        if (localResults && localResults.length > 0) {
          Logger.info(`[FoodService] YOLO 1차 스캔 성공! ${localResults.length}개 객체 탐지.`);
          yoloContext.detected = true;
          aiVisionResult = {
            scanEngine: 'YOLO',
            detectedFoods: localResults.map((r, idx) => ({
              boxId: idx,
              foodName: r.className,
              boundingBox: r.bbox,
              confidence: r.confidence,
            })),
          };
        } else {
          yoloContext.reason = 'NO_OBJECTS_DETECTED';
          Logger.info('[FoodService] YOLO 1차 스캔 결과 없음. Vision LLM Fallback 실행.');
        }
      } catch (err) {
        yoloContext.reason = 'SCAN_ERROR';
        Logger.warn(`[FoodService] YOLO 1차 스캔 에러 발생. Vision LLM Fallback 실행: ${err}`);
      }
    } else {
      yoloContext.reason = 'FILE_NOT_FOUND';
      Logger.warn(
        `[FoodService] Image file not found for YOLO scan: ${imagePath}. Vision LLM Fallback 실행.`,
      );
    }

    // 2차: 미식별/불분명 시 Vision LLM Fallback 추가 분석 요청
    if (!aiVisionResult) {
      aiVisionResult = await this.aiService.analyzeFoodVision(
        imageUrl,
        mealType,
        undefined,
        yoloContext,
      );
      if (aiVisionResult) aiVisionResult.scanEngine = 'VisionLLM';
    }

    if (aiVisionResult.detectedFoods && aiVisionResult.detectedFoods.length > 0) {
      const enrichedFoods = [];
      let idx = 0;
      for (const item of aiVisionResult.detectedFoods) {
        const rawFoodName = item.foodName || item.name || '음식';
        const mapping = await this.getOrMapFood(rawFoodName);
        enrichedFoods.push({
          boxId: item.boxId !== undefined ? item.boxId : idx++,
          ...item,
          foodName: rawFoodName,
          // 영양 수치는 foods 마스터 DB에서 온다. YOLO도 Vision LLM도
          // 음식명과 좌표만 주므로, 여기서 채우지 않으면
          // DetectedFoodItem의 필수 필드가 빈 채로 나간다.
          estimatedGram: mapping.standardServingG,
          calories: mapping.caloriesKcal,
          carbs: mapping.carbohydrateG,
          protein: mapping.proteinG,
          fat: mapping.fatG,
          matchedStandardFoodName: mapping.foodId > 0 ? mapping.rawName : rawFoodName,
          matchedFoodId: mapping.foodId > 0 ? mapping.foodId : undefined,
          matchType: mapping.matchType,
        });
      }
      return {
        ...aiVisionResult,
        detectedFoods: enrichedFoods,
      };
    }

    return aiVisionResult;
  }

  public async logMeal(
    userId: number,
    data: FoodLogConfirmRequest,
  ): Promise<MealLogRegisterResponse> {
    Logger.info(`[FoodService] Logging meal for userId: ${userId}, mealType: ${data.mealType}`);

    const user = await this.foodRepository.findUserById(userId);
    if (!user) {
      Logger.error(`[FoodService] User not found for userId: ${userId}`);
      throw new UserNotFoundError(userId);
    }

    let itemsInput: Array<{ foodName: string; gram: number }> = [];

    if (data.foods && data.foods.length > 0) {
      itemsInput = data.foods.map((f) => ({
        foodName: f.foodName,
        gram: f.gram || 100,
      }));
    } else {
      throw new Error('음식 항목(foods)은 최소 1개 이상 전송해야 합니다.');
    }

    const processedItems: any[] = [];

    for (const item of itemsInput) {
      const intakeG = item.gram;
      const mapped = await this.getOrMapFood(item.foodName);

      const ratio = intakeG / (mapped.standardServingG || 100);
      processedItems.push({
        foodName: item.foodName,
        intakeGram: intakeG,
        foodId: mapped.foodId,
        calories: Math.round(mapped.caloriesKcal * ratio),
        carbs: Math.round(mapped.carbohydrateG * ratio),
        protein: Math.round(mapped.proteinG * ratio),
        fat: Math.round(mapped.fatG * ratio),
      });
    }

    // 3. 식사 전체 합계(SUM) 영양 성분 집계
    const totalCalories = processedItems.reduce((acc, curr) => acc + curr.calories, 0);
    const totalCarbs = processedItems.reduce((acc, curr) => acc + curr.carbs, 0);
    const totalProtein = processedItems.reduce((acc, curr) => acc + curr.protein, 0);
    const totalFat = processedItems.reduce((acc, curr) => acc + curr.fat, 0);

    const mainComment =
      data.comment ||
      (processedItems.length > 0 ? processedItems.map((i) => i.foodName).join(', ') : '식단 기록');

    // 트랜잭션(Interactive Transaction)으로 전체 데이터 생성/업데이트를 감싸서 무결성 보장
    const mealData = FoodMapper.toMealCreateInput(
      userId,
      data.mealType,
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
      mainComment,
    );

    const result = await this.foodRepository.createMealLogWithTransaction(
      userId,
      mealData,
      processedItems,
      { imageId: data.imageId },
      FUEL_REWARDS.FOOD_CONFIRM, // gainedFuel
      EXP_REWARDS.FOOD_CONFIRM, // gainedExp
      FoodMapper.toMealItemCreateInput,
      FoodMapper.toMealImageCreateInput,
      UserMapper.toStatusLogCreateInput,
    );

    Logger.info(
      `[FoodService] Meal logged successfully (mealId: ${result.meal.id}, userId: ${userId}, itemsCount: ${processedItems.length}, totalCalories: ${totalCalories})`,
    );

    return FoodMapper.toMealLogRegisterResponse(
      result.meal.id,
      result.gainedFuel,
      totalCalories,
      result.updatedUser.current_fuel ?? 0,
    );
  }

  public async searchFoods(keyword: string): Promise<FoodSearchResponse> {
    Logger.info(`[FoodService] Searching foods with keyword: '${keyword}'`);
    const dbFoods = await this.foodRepository.searchFoodsByKeyword(keyword, 10);

    Logger.info(`[FoodService] Found ${dbFoods.length} food items matching keyword: '${keyword}'`);
    return FoodMapper.toFoodSearchResponse(dbFoods);
  }

  public async detectFoodViaExternalAi(file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new Error('업로드할 이미지 파일이 없습니다.');
    }

    // 1. 이미지 임시 저장 (AiAdapter가 파일을 읽을 수 있도록)
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    const imageUrl = `/uploads/${filename}`;

    // 2. 로컬 YOLO를 건너뛰고, 메인 AI 서버(Vision LLM)로 바로 요청!
    let aiVisionResult: any = null;
    try {
      aiVisionResult = await this.aiService.analyzeFoodVision(imageUrl);
      if (aiVisionResult) aiVisionResult.scanEngine = 'VisionLLM_Direct';
    } catch (error) {
      Logger.error(`[FoodService] 메인 AI 서버 Vision 연동 실패: ${error}`);
      throw new Error('AI 서버에서 이미지를 분석하는 데 실패했습니다.');
    }

    // 3. 검출된 음식들을 getOrMapFood(매칭 테이블 조회 및 추가 로직)로 영양성분 매핑
    const enrichedFoods = [];
    let idx = 0;

    if (aiVisionResult && aiVisionResult.detectedFoods && aiVisionResult.detectedFoods.length > 0) {
      for (const item of aiVisionResult.detectedFoods) {
        const rawFoodName = item.foodName || item.name || '음식';
        const mapping = await this.getOrMapFood(rawFoodName);

        enrichedFoods.push({
          boxId: item.boxId !== undefined ? item.boxId : idx++,
          ...item,
          foodName: rawFoodName,
          estimatedGram: mapping.standardServingG,
          calories: mapping.caloriesKcal,
          carbs: mapping.carbohydrateG,
          protein: mapping.proteinG,
          fat: mapping.fatG,
          matchedStandardFoodName: mapping.foodId > 0 ? mapping.rawName : rawFoodName,
          matchedFoodId: mapping.foodId > 0 ? mapping.foodId : undefined,
          matchType: mapping.matchType,
        });
      }
    }

    return {
      ...(aiVisionResult || {}),
      detectedFoods: enrichedFoods,
    };
  }
}
