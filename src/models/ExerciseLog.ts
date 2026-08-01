import { getPrisma } from "../loaders/prisma";
import { Prisma } from "@prisma/client";

// 1. 운동 종류 마스터 인터페이스
export interface Exercise {
  id: number;
  name: string;
  met_value: number;
  category?: string;
  created_at?: Date;
}

// 2. 운동 수행 기록 인터페이스
export interface ExerciseLog {
  id: number;
  user_id: number;
  exercise_id: number;
  duration_minutes: number;
  burned_calories_kcal: number;
  is_completed: boolean;
  performed_at?: Date;
  
  // 조인용 필드
  exercise_name?: string;
}

export class ExerciseModel {
  /**
   * 정의되어 있는 모든 운동 마스터 리스트를 조회합니다.
   */
  public static async findAllExercises(): Promise<Exercise[]> {
    const prisma = getPrisma();
    const rows = await prisma.exercises.findMany({
      orderBy: { id: "asc" }
    });
    return rows.map(r => ({
      ...r,
      category: r.category || undefined,
      met_value: Number(r.met_value)
    }));
  }

  /**
   * 특정 운동의 상세 정보(MET 등)를 조회합니다.
   */
  public static async findExerciseById(id: number): Promise<Exercise | null> {
    const prisma = getPrisma();
    const ex = await prisma.exercises.findUnique({
      where: { id }
    });
    if (!ex) return null;
    return {
      ...ex,
      category: ex.category || undefined,
      met_value: Number(ex.met_value)
    };
  }

  /**
   * 사용자의 운동 수행 로그 목록을 수행일 최신순으로 조회합니다. (운동명 조인 포함)
   */
  public static async findLogsByUserId(userId: number, limit = 20): Promise<ExerciseLog[]> {
    const prisma = getPrisma();
    const logs = await prisma.exercise_logs.findMany({
      where: { user_id: userId },
      include: {
        exercise: true
      },
      orderBy: { performed_at: "desc" },
      take: limit
    });

    return logs.map(l => ({
      id: Number(l.id),
      user_id: l.user_id,
      exercise_id: l.exercise_id,
      duration_minutes: l.duration_minutes,
      burned_calories_kcal: l.burned_calories_kcal,
      is_completed: l.is_completed,
      performed_at: l.performed_at,
      exercise_name: l.exercise.name
    }));
  }

  /**
   * 사용자의 새로운 운동 수행 기록을 데이터베이스에 저장합니다.
   */
  public static async createLog(log: Omit<ExerciseLog, "id" | "performed_at">): Promise<number> {
    const prisma = getPrisma();
    const result = await prisma.exercise_logs.create({
      data: {
        user_id: log.user_id,
        exercise_id: log.exercise_id,
        duration_minutes: log.duration_minutes,
        burned_calories_kcal: log.burned_calories_kcal,
        is_completed: log.is_completed
      }
    });
    return Number(result.id);
  }
}
