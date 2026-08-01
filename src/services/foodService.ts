import { Service, Inject } from "typedi";
import { MealModel } from "../models/Meal";
import TravelService from "./travelService";
import { FoodAnalyzeResponse, MealRegisterRequest } from "../interfaces";
import Logger from "../loaders/logger";

@Service()
export default class FoodService {
  constructor(private travelService: TravelService) {}

  /**
   * 사용자가 업로드한 이미지를 분석하여 영양 정보를 추출하고 평가 코멘트를 생성합니다.
   */
  public async analyzeFoodImage(imageBuffer: Buffer, mealType: string): Promise<FoodAnalyzeResponse> {
    Logger.info(`식단 이미지 비전 분석 요청 접수: mealType=${mealType}, bufferSize=${imageBuffer.length}`);
    
    // TODO: OpenAI GPT-4o Vision API 또는 전용 웰니스 분석 API 연동
    // 예: const analysis = await this.openaiVision.analyze(imageBuffer);
    
    // 가상의 비전 분석 결과 데이터 생성 (기존 API 스펙 규격 매핑)
    return {
      mealId: 42,
      foodName: "닭가슴살 샐러드와 아보카도 🥑",
      caloriesKcal: 380,
      carbohydrateG: 14.5,
      proteinG: 32.0,
      fatG: 11.2,
      comment: "풍부한 닭가슴살 단백질과 아보카도의 건강한 불포화 지방이 조화를 이루는 고품격 식사야! 건강 관리에 아주 좋아."
    };
  }

  /**
   * 분석 완료된 식사 데이터를 사용자 기록에 영구 적재하고 연료 보상을 지급합니다.
   */
  public async registerMealLog(userId: number, request: MealRegisterRequest): Promise<{ mealId: number; fuelResult: any }> {
    // 1. 데이터베이스 트랜잭션 삽입 (MealModel 호출)
    const mealId = await MealModel.createMeal(
      userId,
      {
        meal_type: request.meal_type,
        image_url: request.image_url,
        comment: request.comment,
        total_calories_kcal: request.total_calories_kcal,
        total_carbohydrate_g: request.total_carbohydrate_g,
        total_protein_g: request.total_protein_g,
        total_fat_g: request.total_fat_g
      },
      request.items
    );

    // 2. 우주여행 연료 획득 연계 처리 (+5% 연료 충전)
    const fuelResult = await this.travelService.addFuel(userId, "FOOD_ANALYZED");

    return {
      mealId,
      fuelResult
    };
  }
}
