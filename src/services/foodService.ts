import { Service } from "typedi";
import TravelService from "./travelService";
import { FoodAnalyzeResponse, MealRegisterRequest } from "../interfaces";
import Logger from "../loaders/logger";

@Service()
export default class FoodService {
  constructor(private travelService: TravelService) {}

  /**
   * 사용자가 업로드한 식사 이미지를 분석하여 영양 정보를 추출합니다. (스텁)
   */
  public async analyzeFoodImage(imageBuffer: Buffer, mealType: string): Promise<FoodAnalyzeResponse> {
    Logger.info(`[FoodService] 식단 비전 분석 요청: mealType=${mealType}`);

    // TODO: 1. 이미지 1024x1024 다운스케이밍 & WebP/JPEG 80% 압축
    // TODO: 2. AI Vision API 호출 및 영양 정보 추출

    throw new Error("Method not implemented.");
  }

  /**
   * 분석 완료된 식사 데이터를 사용자 기록에 적재하고 연료 보상을 지급합니다. (스텁)
   */
  public async registerMealLog(userId: number, request: MealRegisterRequest): Promise<{ mealId: number; fuelResult: any }> {
    Logger.info(`[FoodService] 식단 기록 확정 등록: userId=${userId}`);

    // TODO: 1. MealModel / MealItem 데이터베이스 트랜잭션 적재
    // TODO: 2. 우주선 연료(+5%) 보상 연계 처리

    throw new Error("Method not implemented.");
  }
}
