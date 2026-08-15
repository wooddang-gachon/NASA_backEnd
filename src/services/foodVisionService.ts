import { Service, Inject } from "typedi";
import AiService from "./aiService";
import LocalVisionService from "./localVisionService";
import { LoggerFactory } from "../loaders/logger";
import FoodRepository from "../repositories/FoodRepository";
import FoodService from "./foodService";
import { BadRequestError } from "../errors";
import type { FoodVisionScanResponse, DetectedFoodItem } from "@/dto";
import { drawBoundingBoxesAndSave } from "../utils/imageAnnotator";
import StorageAdapter from "../adapters/StorageAdapter";
import type { UploadedImageFile, FoodVisionContext } from "@/interfaces";

@Service()
export default class FoodVisionService {
  private readonly logger = LoggerFactory.getLogger(FoodVisionService.name);
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
      this.logger.error("Upload image file is missing.");
      throw new BadRequestError("업로드할 이미지 파일(file)이 누락되었습니다.");
    }

    const context = this.createInitialContext({ file, mealType });

    this.logger.info("Uploading and analyzing food vision file", {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    // 파이프라인 순차 실행
    await this.stageImageUpload(context, true); // true = 즉시 DB 등록
    await this.stageLocalYoloScan(context);
    await this.stageVisionLlmFallback(context);
    await this.stageNutritionMapping(context);
    await this.stageGenerateDebugImage(context);

    return {
      scanEngine: context.scanEngine,
      isFallbackUsed: context.scanEngine.includes("VisionLLM"),
      detectedFoods: context.detectedFoods as DetectedFoodItem[],
      imageId: context.imageId || "",
    } as FoodVisionScanResponse;
  }

  public async analyzeFoodVision(
    imageUrl: string,
    mealType?: string,
  ): Promise<FoodVisionScanResponse> {
    const context = this.createInitialContext({ imageUrl, mealType });

    this.logger.info("Analyzing food vision for image", {
      imageUrl,
      mealType,
    });

    await this.stageLocalYoloScan(context);
    await this.stageVisionLlmFallback(context);
    await this.stageNutritionMapping(context);

    return {
      scanEngine: context.scanEngine,
      isFallbackUsed: context.scanEngine.includes("VisionLLM"),
      detectedFoods: context.detectedFoods as DetectedFoodItem[],
      imageId: context.imageId || "",
    } as FoodVisionScanResponse;
  }

  public async detectFoodViaExternalAi(
    file?: UploadedImageFile,
  ): Promise<FoodVisionScanResponse> {
    if (!file) {
      throw new BadRequestError("업로드할 이미지 파일이 없습니다.");
    }

    const context = this.createInitialContext({ file });

    await this.stageImageUpload(context, false); // DB 등록 안함 (기존 로직 유지)

    // 로컬 YOLO 패스하고 바로 다이렉트 LLM 실행
    await this.stageVisionLlmDirect(context);
    await this.stageNutritionMapping(context);

    return {
      scanEngine: context.scanEngine,
      isFallbackUsed: context.scanEngine.includes("VisionLLM"),
      detectedFoods: context.detectedFoods as DetectedFoodItem[],
      imageId: context.imageId || "",
    } as FoodVisionScanResponse;
  }

  // --- Helpers ---

  private createInitialContext(params: {
    file?: UploadedImageFile;
    imageUrl?: string;
    mealType?: string;
  }): FoodVisionContext {
    return {
      file: params.file,
      mealType: params.mealType,
      imageUrl: params.imageUrl || "",
      imageFilePath: "",
      detectedFoods: [],
      scanEngine: "Unknown",
      isIdentified: false,
      errors: [],
    };
  }

  // --- Pipeline Stages ---

  private async stageImageUpload(
    ctx: FoodVisionContext,
    saveToDb: boolean,
  ): Promise<void> {
    if (!ctx.file) return;

    const { absolutePath, urlPath } = this.storageAdapter.saveFile(
      ctx.file.buffer,
      ctx.file.originalname,
    );
    ctx.imageFilePath = absolutePath;
    ctx.imageUrl = urlPath;

    if (saveToDb) {
      const savedImage = await this.foodRepository.createMealImage(
        urlPath,
        true,
      );
      ctx.imageId = savedImage.id.toString();
      this.logger.info("Immediate image registration created in DB", {
        imageId: ctx.imageId,
      });
    }
  }

  private async stageLocalYoloScan(ctx: FoodVisionContext): Promise<void> {
    const imageBuffer = this.storageAdapter.readFile(ctx.imageUrl);
    if (!imageBuffer) {
      ctx.errors.push(new Error("FILE_NOT_FOUND"));
      this.logger.warn(
        "Image file not found for YOLO scan. Executing Vision LLM Fallback.",
        {
          imageUrl: ctx.imageUrl,
        },
      );
      return;
    }

    try {
      const localResults =
        await this.localVisionService.detectFoodObjects(imageBuffer);
      if (localResults && localResults.length > 0) {
        this.logger.info("YOLO 1차 스캔 성공!", {
          detectedCount: localResults.length,
        });
        ctx.scanEngine = "YOLO";
        ctx.isIdentified = true;
        ctx.detectedFoods = localResults.map((r, idx) => ({
          boxId: idx,
          foodName: r.className,
          boundingBox: r.bbox,
          confidence: r.confidence,
          estimatedGram: 0,
          calories: 0,
          carbs: 0,
          protein: 0,
          fat: 0,
        }));
      } else {
        ctx.errors.push(new Error("NO_OBJECTS_DETECTED"));
        this.logger.info("YOLO 1차 스캔 결과 없음. Vision LLM Fallback 실행.");
      }
    } catch (err) {
      ctx.errors.push(new Error("SCAN_ERROR"));
      this.logger.warn("YOLO 1차 스캔 에러 발생. Vision LLM Fallback 실행.", {
        errorMessage: err instanceof Error ? err.message : String(err),
        stackTrace: err instanceof Error ? err.stack : undefined,
      });
    }
  }

  private async stageVisionLlmFallback(ctx: FoodVisionContext): Promise<void> {
    if (ctx.isIdentified && ctx.detectedFoods.length > 0) return;

    const yoloContext = {
      attempted: true,
      detected: false,
      reason:
        ctx.errors.length > 0
          ? ctx.errors[ctx.errors.length - 1]!.message
          : "UNKNOWN",
    };

    const aiResult = (await this.aiService.analyzeFoodVision(
      ctx.imageUrl,
      ctx.mealType,
      undefined,
      yoloContext,
    )) as unknown as Partial<FoodVisionScanResponse>;

    if (
      aiResult &&
      aiResult.detectedFoods &&
      aiResult.detectedFoods.length > 0
    ) {
      ctx.scanEngine = "VisionLLM";
      ctx.isIdentified = true;
      ctx.detectedFoods = aiResult.detectedFoods;
    }
  }

  private async stageVisionLlmDirect(ctx: FoodVisionContext): Promise<void> {
    try {
      const aiResult = (await this.aiService.analyzeFoodVision(
        ctx.imageUrl,
      )) as unknown as Partial<FoodVisionScanResponse>;

      if (
        aiResult &&
        aiResult.detectedFoods &&
        aiResult.detectedFoods.length > 0
      ) {
        ctx.scanEngine = "VisionLLM_Direct";
        ctx.isIdentified = true;
        ctx.detectedFoods = aiResult.detectedFoods;
      }
    } catch (error) {
      this.logger.error("메인 AI 서버 Vision 연동 실패", {
        errorMessage: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("AI 서버에서 이미지를 분석하는 데 실패했습니다.");
    }
  }

  private async stageNutritionMapping(ctx: FoodVisionContext): Promise<void> {
    if (!ctx.detectedFoods || ctx.detectedFoods.length === 0) return;

    ctx.detectedFoods = await Promise.all(
      ctx.detectedFoods.map(async (item, index) => {
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

  private async stageGenerateDebugImage(ctx: FoodVisionContext): Promise<void> {
    if (
      ctx.isIdentified &&
      ctx.detectedFoods &&
      ctx.detectedFoods.length > 0 &&
      ctx.imageFilePath
    ) {
      try {
        await drawBoundingBoxesAndSave(
          ctx.imageFilePath,
          ctx.detectedFoods as DetectedFoodItem[],
        );
      } catch (err) {
        this.logger.warn("디버그 이미지 생성 실패", {
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}
