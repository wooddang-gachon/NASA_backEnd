export interface DailyKcalItem {
  /**
   * 날짜 (형식: YYYY-MM-DD)
   * @pattern ^\d{4}-\d{2}-\d{2}$ 날짜는 YYYY-MM-DD 형식이어야 합니다.
   * @example "2026-07-01"
   */
  date: string;

  /**
   * 섭취량
   * @example 2100
   */
  kcal: number;
}

export interface WeeklyWorkoutMinItem {
  /**
   * 주차 표시
   * @example "1주차"
   */
  week: string;

  /**
   * 소모한 분
   * @example 120
   */
  minutes: number;
}

export interface MonthlyReportResponse {
  /**
   * 종합 건강 점수 (0 ~ 100점)
   * @isInt
   * @minimum 0
   * @maximum 100
   * @example 85
   */
  healthScore: number;

  /**
   * 건강 상태 한눈에 진단 요약문
   * @example "이번 달은 규칙적인 하체 운동으로 소모 칼로리가 급증했습니다. 다만, 탄수화물 비중이 다소 높으니 단백질 섭취를 10g 정도만 늘려보세요."
   */
  summaryContent: string;

  /**
   * 일별 칼로리 데이터
   */
  dailyKcal: DailyKcalItem[];

  /**
   * 월간 탄단지 평균 비율
   */
  macros: {
    carbohydrateG: number;
    proteinG: number;
    fatG: number;
  };

  /**
   * 주차별 총 운동 시간 흐름
   */
  weeklyWorkoutMin: WeeklyWorkoutMinItem[];

  /**
   * AI 분석 주요 인사이트 내용 목록
   */
  aiFindings: string[];
}
