import { Service } from "typedi";
import { ExerciseModel } from "../models/ExerciseLog";
import { UserModel } from "../models/User";
import TravelService from "./travelService";
import { ExerciseRecommendResponse, ExerciseLogRequest } from "../interfaces";

@Service()
export default class ExerciseService {
  constructor(private travelService: TravelService) {}

  /**
   * 유저의 프로필(나이, 성별, 키, 몸무게, 목표 등) 정보를 바탕으로 맞춤형 인공지능 추천 운동 목록을 제공합니다.
   */
  public async recommendExercise(userId: number): Promise<ExerciseRecommendResponse> {
    const user = await UserModel.findById(userId);
    const targetWeight = user?.target_weight_kg || 70;

    // 간단한 추천 알고리즘 분기 (목표 몸무게 등 사용자 신체 컨디션에 따른 난이도 조절)
    if (targetWeight > 80) {
      return {
        title: "무릎 관절을 보호하는 순한 유산소&코어 코스 🧘",
        totalMinutes: 20,
        totalCalories: 120,
        difficulty: "LOW",
        exercises: [
          { name: "가벼운 걷기", sets: 1, durationSeconds: 600, estimatedCaloriesKcal: 50 },
          { name: "플랭크", sets: 3, durationSeconds: 30, estimatedCaloriesKcal: 30 },
          { name: "요가", sets: 1, durationSeconds: 300, estimatedCaloriesKcal: 40 }
        ]
      };
    }

    // 기본 추천 코스
    return {
      title: "타미와 함께하는 하체 불태우기 코스 🔥",
      totalMinutes: 25,
      totalCalories: 200,
      difficulty: "MEDIUM",
      exercises: [
        { name: "스쿼트", sets: 3, reps: 15, estimatedCaloriesKcal: 80 },
        { name: "런지", sets: 3, reps: 12, estimatedCaloriesKcal: 70 },
        { name: "플랭크", sets: 3, durationSeconds: 60, estimatedCaloriesKcal: 50 }
      ]
    };
  }

  /**
   * 운동 완수 완료 기록을 저장하고 연료 보상(+10)을 지급합니다.
   */
  public async recordWorkout(userId: number, request: ExerciseLogRequest): Promise<{ logId: number; fuelResult: any }> {
    // 1. 운동 로그 데이터베이스 적재 (ExerciseModel 호출)
    const logId = await ExerciseModel.createLog({
      user_id: userId,
      exercise_id: request.exerciseId,
      duration_minutes: request.durationMinutes,
      burned_calories_kcal: request.burnedCaloriesKcal,
      is_completed: request.isCompleted
    });

    // 2. 우주여행 연료 지급 연계 처리 (+10% 연료 충전)
    const fuelResult = await this.travelService.addFuel(userId, "WORKOUT_DONE");

    return {
      logId,
      fuelResult
    };
  }
}
