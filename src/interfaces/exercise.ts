export interface ExerciseRecommendItem {
  /**
   * 운동명
   * @example "스쿼트"
   */
  name: string;

  /**
   * 추천 세트 수
   * @isInt
   * @minimum 1
   * @example 3
   */
  sets: number;

  /**
   * 세트당 반복 횟수 (횟수제인 경우)
   * @isInt
   * @minimum 1
   * @example 15
   */
  reps?: number;

  /**
   * 운동 시간 (초 단위, 버티기 형식일 경우)
   * @isInt
   * @minimum 1
   * @example 60
   */
  durationSeconds?: number;

  /**
   * 예상되는 소모 칼로리량 (kcal)
   * @minimum 0
   * @example 80
   */
  estimatedCaloriesKcal: number;
}

export interface ExerciseRecommendResponse {
  /**
   * 오늘의 추천 코스명
   * @example "타미와 함께하는 하체 불태우기 코스 🔥"
   */
  title: string;

  /**
   * 예상되는 전체 운동 소요 시간 (분)
   * @minimum 1
   * @example 25
   */
  totalMinutes: number;

  /**
   * 소모될 전체 소모 칼로리량 (kcal)
   * @minimum 1
   * @example 200
   */
  totalCalories: number;

  /**
   * 추천 코스 난이도
   */
  difficulty: "LOW" | "MEDIUM" | "HIGH";

  /**
   * 추천 세부 운동 목록
   */
  exercises: ExerciseRecommendItem[];
}

export interface ExerciseLogRequest {
  /**
   * 수행한 운동의 고유 ID (마스터 테이블 참조)
   * @isInt
   * @minimum 1
   * @example 1
   */
  exerciseId: number;

  /**
   * 실제 수행 시간 (분)
   * @isInt
   * @minimum 1
   * @example 30
   */
  durationMinutes: number;

  /**
   * 실제 소모한 칼로리 (kcal)
   * @isInt
   * @minimum 0
   * @example 150
   */
  burnedCaloriesKcal: number;

  /**
   * 코스 완수 여부
   * @example true
   */
  isCompleted: boolean;
}
