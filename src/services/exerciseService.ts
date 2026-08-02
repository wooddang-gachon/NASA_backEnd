import { Service } from "typedi";
import TravelService from "./travelService";
import { ExerciseRecommendResponse, ExerciseLogRequest } from "../interfaces";
import Logger from "../loaders/logger";

@Service()
export default class ExerciseService {
  constructor(private travelService: TravelService) {}

  /**
   * 신체 정보 및 수행 이력 기반 운동 계획을 추천합니다. (스텁)
   */
  public async recommendExercise(userId: number): Promise<ExerciseRecommendResponse> {
    Logger.info(`[ExerciseService] 운동 추천 요청: userId=${userId}`);

    // TODO: 유저 신체 스펙 및 최근 활동 데이터 기반 추천 로직

    throw new Error("Method not implemented.");
  }

  /**
   * 운동 완수 완료 기록을 저장하고 연료 보상을 지급합니다. (스텁)
   */
  public async recordWorkout(userId: number, request: ExerciseLogRequest): Promise<{ logId: number; fuelResult: any }> {
    Logger.info(`[ExerciseService] 운동 로그 저장: userId=${userId}`);

    // TODO: 1. MET 공식을 활용한 정밀 소모 칼로리 계산
    // TODO: 2. ExerciseModel 데이터베이스 기록 저장
    // TODO: 3. 우주선 연료(+10%) 보상 연계 처리

    throw new Error("Method not implemented.");
  }
}
