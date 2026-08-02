import { Controller, Route, Get, Post, Query, Body } from "tsoa";
import { Service } from "typedi";
import ExerciseService from "../../services/exerciseService";
import {
  ExerciseRecommendResponse,
  ExerciseLogRequest,
} from "../../interfaces";

@Service()
@Route("exercise")
export class ExerciseController extends Controller {
  constructor(private exerciseService: ExerciseService) {
    super();
  }

  /**
   * 신체 정보 기반 맞춤 운동 계획을 추천합니다.
   */
  @Get("recommend")
  public async recommendExercise(
    @Query() userId: number
  ): Promise<ExerciseRecommendResponse> {
    return await this.exerciseService.recommendExercise(userId);
  }

  /**
   * 운동 완수 완료 기록을 적재하고 연료 보상을 지급합니다.
   */
  @Post("log")
  public async recordWorkout(
    @Query() userId: number,
    @Body() requestBody: ExerciseLogRequest
  ): Promise<{ logId: number; fuelResult: any }> {
    return await this.exerciseService.recordWorkout(userId, requestBody);
  }
}
