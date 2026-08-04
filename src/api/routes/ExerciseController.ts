import { Controller, Route, Get, Post, Body, Query } from "tsoa";
import { Service, Container } from "typedi";
import ExerciseService from "../../services/exerciseService";
import type {
  ExerciseRecommendResponse,
  WorkoutLogRequest,
  WorkoutLogResponse,
  WaterLogRequest,
  WaterLogResponse,
} from "../../interfaces";

@Service()
@Route("care")
export class CareController extends Controller {
  private exerciseService = Container.get(ExerciseService);

  constructor() {
    super();
  }

  /**
   * 1-Tap 수분 섭취 기록 (250ml)
   */
  @Post("water")
  public async logWater(
    @Body() requestBody: WaterLogRequest
  ): Promise<WaterLogResponse> {
    return await this.exerciseService.logWater(requestBody.userId || 1, requestBody.intakeMl);
  }
}

@Service()
@Route("exercise")
export class ExerciseController extends Controller {
  private exerciseService = Container.get(ExerciseService);

  constructor() {
    super();
  }

  /**
   * 맞춤 운동 추천
   */
  @Get("recommend")
  public async recommendExercises(@Query() userId: number): Promise<ExerciseRecommendResponse> {
    return await this.exerciseService.recommendExercises(userId);
  }

  public async recommendExercise(userId: number): Promise<ExerciseRecommendResponse> {
    return await this.exerciseService.recommendExercises(userId);
  }

  /**
   * 1-Tap "오늘 운동 완!" 기록
   */
  @Post("log")
  public async logWorkout(
    @Body() requestBody: WorkoutLogRequest
  ): Promise<WorkoutLogResponse> {
    return await this.exerciseService.logWorkout(requestBody.userId || 1, requestBody.memo);
  }

  public async recordWorkout(requestBody: WorkoutLogRequest): Promise<WorkoutLogResponse> {
    return await this.exerciseService.logWorkout(requestBody.userId || 1, requestBody.memo);
  }
}
