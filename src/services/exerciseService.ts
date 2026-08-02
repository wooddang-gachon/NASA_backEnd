import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { ensureDefaultPlanet } from "./travelService";
import type {
  WaterLogResponse,
  WorkoutLogResponse,
  ExerciseRecommendResponse,
} from "@/interfaces";

@Service()
export default class ExerciseService {
  /**
   * 1-Tap 수분 섭취 기록 (250ml) 및 연료 충전
   */
  public async logWater(userId: number, intakeMl: number = 250): Promise<WaterLogResponse> {
    const prisma = getPrisma();
    const planetId = await ensureDefaultPlanet(prisma);

    // 1. 수분 로그 DB 추가
    await prisma.water_logs.create({
      data: {
        user_id: userId,
        intake_ml: intakeMl,
      },
    });

    // 2. 오늘 총 수분량 계산
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayWaterLogs = await prisma.water_logs.findMany({
      where: {
        user_id: userId,
        recorded_at: { gte: startOfDay },
      },
    });

    const todayTotalWaterMl = todayWaterLogs.reduce((sum: number, log: any) => sum + log.intake_ml, 0);

    // 3. 연료(+10 Fuel) 충전
    const gainedFuel = 10;
    const travelState = await prisma.space_travel_states.upsert({
      where: { user_id: userId },
      update: {
        current_fuel: { increment: gainedFuel },
      },
      create: {
        user_id: userId,
        current_fuel: gainedFuel,
        current_planet_id: planetId,
      },
    });

    return {
      todayTotalWaterMl,
      gainedFuel,
      currentFuel: travelState.current_fuel,
    };
  }

  /**
   * 1-Tap "오늘 운동 완!" 기록 및 연료 충전
   */
  public async logWorkout(userId: number, memo?: string): Promise<WorkoutLogResponse> {
    const prisma = getPrisma();
    const planetId = await ensureDefaultPlanet(prisma);

    // 1. 운동 마스터 단건 보장 또는 조회
    let defaultExercise = await prisma.exercises.findFirst({
      where: { name: "오늘 운동 완!" },
    });

    if (!defaultExercise) {
      defaultExercise = await prisma.exercises.create({
        data: {
          name: "오늘 운동 완!",
          met_value: 3.0,
          category: "GENERAL",
        },
      });
    }

    // 2. 운동 로그 DB 추가
    const workout = await prisma.exercise_logs.create({
      data: {
        user_id: userId,
        exercise_id: defaultExercise.id,
        duration_minutes: 20,
        burned_calories_kcal: 100,
        is_completed: true,
      },
    });

    // 3. 연료(+30 Fuel) 충전
    const gainedFuel = 30;
    const travelState = await prisma.space_travel_states.upsert({
      where: { user_id: userId },
      update: {
        current_fuel: { increment: gainedFuel },
      },
      create: {
        user_id: userId,
        current_fuel: gainedFuel,
        current_planet_id: planetId,
      },
    });

    return {
      workoutLogId: Number(workout.id),
      gainedFuel,
      currentFuel: travelState.current_fuel,
    };
  }

  /**
   * 맞춤 운동 추천 (호환성 유지)
   */
  public async recommendExercises(userId: number): Promise<ExerciseRecommendResponse> {
    return {
      exercises: ["가벼운 저녁 산책 20분 🍃", "맨몸 스쿼트 15회 3세트 💪", "스트레칭 10분 🧘"],
    };
  }
}
