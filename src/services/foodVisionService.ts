import { Service, Inject } from "typedi";
import AiService from "./aiService";
import LocalVisionService from "./localVisionService";
import Logger from "../loaders/logger";
import FoodRepository from "../repositories/FoodRepository";
import FoodService from "./foodService";
import { BadRequestError } from "../errors";
import { FoodVisionScanResponse, DetectedFoodItem } from "../dto";
import { drawBoundingBoxesAndSave } from "../utils/imageAnnotator";
import StorageAdapter from "../adapters/StorageAdapter";

export interface UploadedImageFile {
  originalname: string;
  buffer: Buffer;
  mimetype?: string;
  size?: number;
}

@Service()
export default class FoodVisionService {
  @Inject(() => AiService)
  private aiService!: AiService;

  @Inject(() => LocalVisionService)
  private localVisionService!: LocalVisionService;

  @Inject(() => FoodRepository)
  private foodRepository!: FoodRepository;

  @Inject(() => StorageAdapter)
  private storageAdapter!: StorageAdapter;

  @Inject(() => FoodService)
  private foodService!: FoodService;

  public async uploadAndAnalyzeFoodVision(
    file?: UploadedImageFile,
    mealType?: string,
  ): Promise<FoodVisionScanResponse> {
    if (!file) {
      Logger.error("[FoodVisionService] Upload image file is missing.");
      throw new BadRequestError("업로드할 이미지 파일(file)이 누락되었습니다.");
    }

    Logger.info(
      `[FoodVisionService] Uploading and analyzing food vision file: ${file.originalname}`,
    );

    const { absolutePath: filePath, urlPath: imageUrl } =
      this.storageAdapter.saveFile(file.buffer, file.originalname);

    // 1. 이미지가 업로드되는 즉시 meal_images DB 테이블에 바로 연동/저장 (meal_id는 아직 null)
    const savedImage = await this.foodRepository.createMealImage(
      imageUrl,
      true,
    );
    Logger.info(
      `[FoodVisionService] Immediate image registration created in DB: meal_images ID ${savedImage.id}`,
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

  public async analyzeFoodVision(
    imageUrl: string,
    mealType?: string,
  ): Promise<FoodVisionScanResponse> {
    Logger.info(
      `[FoodVisionService] Analyzing food vision for image: ${imageUrl}, mealType: ${mealType || "N/A"}`,
    );

    let aiVisionResult: Partial<FoodVisionScanResponse> | null = null;
    const yoloContext = {
      attempted: true,
      detected: false,
      reason: "",
    };
    // [FOD-001] 1차: 자체 경량 YOLO 모델(ONNX) 스캔
    const imageBuffer = this.storageAdapter.readFile(imageUrl);
    if (imageBuffer) {
      try {
        const localResults =
          await this.localVisionService.detectFoodObjects(imageBuffer);

        if (localResults && localResults.length > 0) {
          Logger.info(
            `[FoodVisionService] YOLO 1차 스캔 성공! ${localResults.length}개 객체 탐지.`,
          );
          yoloContext.detected = true;
          aiVisionResult = {
            scanEngine: "YOLO",
            detectedFoods: localResults.map((r, idx) => ({
              boxId: idx,
              foodName: r.className,
              boundingBox: r.bbox,
              confidence: r.confidence,
              estimatedGram: 0,
              calories: 0,
              carbs: 0,
              protein: 0,
              fat: 0,
            })),
          };
        } else {
          yoloContext.reason = "NO_OBJECTS_DETECTED";
          Logger.info(
            "[FoodVisionService] YOLO 1차 스캔 결과 없음. Vision LLM Fallback 실행.",
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        yoloContext.reason = "SCAN_ERROR";
        Logger.warn(
          `[FoodVisionService] YOLO 1차 스캔 에러 발생. Vision LLM Fallback 실행: ${errorMessage}`,
        );
      }
    } else {
      yoloContext.reason = "FILE_NOT_FOUND";
      Logger.warn(
        `[FoodVisionService] Image file not found for YOLO scan: ${imageUrl}. Vision LLM Fallback 실행.`,
      );
    }

    // 2차: 미식별/불분명 시 Vision LLM Fallback 추가 분석 요청
    if (!aiVisionResult) {
      aiVisionResult = (await this.aiService.analyzeFoodVision(
        imageUrl,
        mealType,
        undefined,
        yoloContext,
      )) as unknown as Partial<FoodVisionScanResponse>;
      if (aiVisionResult) aiVisionResult.scanEngine = "VisionLLM";
    }

    if (
      aiVisionResult.detectedFoods &&
      aiVisionResult.detectedFoods.length > 0
    ) {
      const enrichedFoods = await this.enrichDetectedFoods(
        aiVisionResult.detectedFoods,
      );
      return {
        ...aiVisionResult,
        detectedFoods: enrichedFoods,
      } as FoodVisionScanResponse;
    }

    return (aiVisionResult || {
      isIdentified: false,
      scanEngine: "Unknown",
      detectedFoods: [],
    }) as FoodVisionScanResponse;
  }

  public async detectFoodViaExternalAi(
    file?: UploadedImageFile,
  ): Promise<FoodVisionScanResponse> {
    if (!file) {
      throw new BadRequestError("업로드할 이미지 파일이 없습니다.");
    }

    // 1. 이미지 임시 저장 (AiAdapter가 파일을 읽을 수 있도록)
    const { urlPath: imageUrl } = this.storageAdapter.saveFile(
      file.buffer,
      file.originalname,
    );

    // 2. 로컬 YOLO를 건너뛰고, 메인 AI 서버(Vision LLM)로 바로 요청!
    let aiVisionResult: Partial<FoodVisionScanResponse> | null = null;
    try {
      aiVisionResult = (await this.aiService.analyzeFoodVision(
        imageUrl,
      )) as unknown as Partial<FoodVisionScanResponse>;
      if (aiVisionResult) aiVisionResult.scanEngine = "VisionLLM_Direct";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error(
        `[FoodVisionService] 메인 AI 서버 Vision 연동 실패: ${errorMessage}`,
      );
      throw new Error("AI 서버에서 이미지를 분석하는 데 실패했습니다.");
    }

    // 3. 검출된 음식들을 getOrMapFood(매칭 테이블 조회 및 추가 로직)로 영양성분 매핑
    let enrichedFoods: DetectedFoodItem[] = [];
    if (
      aiVisionResult &&
      aiVisionResult.detectedFoods &&
      aiVisionResult.detectedFoods.length > 0
    ) {
      enrichedFoods = await this.enrichDetectedFoods(
        aiVisionResult.detectedFoods,
      );
    }

    return {
      ...(aiVisionResult || { isIdentified: false, scanEngine: "Unknown" }),
      detectedFoods: enrichedFoods,
    } as FoodVisionScanResponse;
  }

  private async enrichDetectedFoods(
    detectedFoods: Partial<DetectedFoodItem>[],
  ): Promise<DetectedFoodItem[]> {
    return Promise.all(
      detectedFoods.map(async (item, index) => {
        const rawFoodName = item.foodName || "음식";
        const mapping = await this.foodService.getOrMapFood(rawFoodName);

        return {
          boxId: item.boxId !== undefined ? item.boxId : index,
          ...item,
          foodName: rawFoodName,
          estimatedGram: mapping.standardServingG,
          calories: mapping.caloriesKcal,
          carbs: mapping.carbohydrateG,
          protein: mapping.proteinG,
          fat: mapping.fatG,
          matchedStandardFoodName:
            mapping.foodId > 0 ? mapping.rawName : rawFoodName,
          matchedFoodId: mapping.foodId > 0 ? mapping.foodId : undefined,
          matchType: mapping.matchType,
        };
      }),
    );
  }
}
