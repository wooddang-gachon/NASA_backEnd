import { getPrisma } from "../loaders/prisma";

export interface Planet {
  id: number;
  name: string;
  planet_type: "EXERCISE" | "NUTRITION" | "EMOTION" | "CHALLENGE";
  required_fuel: number;
  description?: string;
  created_at?: Date;

  // 1. 운동별 행성 (EXERCISE) 추가 정보
  target_workout_count?: number;
  target_duration_minutes?: number;
  preferred_category?: string;

  // 2. 영양별 행성 (NUTRITION) 추가 정보
  target_calories_kcal?: number;
  target_carbohydrate_g?: number;
  target_protein_g?: number;
  target_fat_g?: number;

  // 3. 감정별 행성 (EMOTION) 추가 정보
  min_empathy_score?: number;
  min_happiness_score?: number;

  // 4. 챌린지별 행성 (CHALLENGE) 추가 정보
  challenge_description?: string;
  reward_badge_name?: string;
}

export class PlanetModel {
  /**
   * 모든 행성 리스트를 상세 추가 정보(상속 테이블 조인)와 함께 조회합니다.
   */
  public static async findAll(): Promise<Planet[]> {
    const prisma = getPrisma();
    
    // 관계 조인 일괄 include 처리 (SQL Left Join이 자동 대체됨)
    const planets = await prisma.planets.findMany({
      include: {
        exercise_planets: true,
        nutrition_planets: true,
        emotion_planets: true,
        challenge_planets: true
      },
      orderBy: { id: "asc" }
    });

    return planets.map(p => this.mapToPlanet(p));
  }

  /**
   * 특정 ID를 가진 행성의 상세 정보(상속 테이블 조인)를 조회합니다.
   */
  public static async findById(id: number): Promise<Planet | null> {
    const prisma = getPrisma();
    
    const planet = await prisma.planets.findUnique({
      where: { id },
      include: {
        exercise_planets: true,
        nutrition_planets: true,
        emotion_planets: true,
        challenge_planets: true
      }
    });

    if (!planet) return null;
    return this.mapToPlanet(planet);
  }

  /**
   * Prisma 조인 객체를 공통 Planet 인터페이스 형식으로 정형화합니다.
   */
  private static mapToPlanet(p: any): Planet {
    return {
      id: p.id,
      name: p.name,
      planet_type: p.planet_type,
      required_fuel: p.required_fuel,
      description: p.description || undefined,
      created_at: p.created_at,

      target_workout_count: p.exercise_planets?.target_workout_count,
      target_duration_minutes: p.exercise_planets?.target_duration_minutes,
      preferred_category: p.exercise_planets?.preferred_category || undefined,

      target_calories_kcal: p.nutrition_planets?.target_calories_kcal,
      target_carbohydrate_g: p.nutrition_planets?.target_carbohydrate_g ? Number(p.nutrition_planets.target_carbohydrate_g) : undefined,
      target_protein_g: p.nutrition_planets?.target_protein_g ? Number(p.nutrition_planets.target_protein_g) : undefined,
      target_fat_g: p.nutrition_planets?.target_fat_g ? Number(p.nutrition_planets.target_fat_g) : undefined,

      min_empathy_score: p.emotion_planets?.min_empathy_score,
      min_happiness_score: p.emotion_planets?.min_happiness_score,

      challenge_description: p.challenge_planets?.challenge_description || undefined,
      reward_badge_name: p.challenge_planets?.reward_badge_name || undefined
    };
  }
}
