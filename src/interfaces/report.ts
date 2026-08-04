export interface DashboardResponse {
  /**
   * 일간/주간 칼로리 추이 (선 차트 데이터)
   */
  calorieTrends: Array<{ date: string; caloriesKcal: number }>;

  /**
   * 5대 영양소 밸런스 평균 (%)
   */
  nutritionBalance: {
    carbohydratePercent: number;
    proteinPercent: number;
    fatPercent: number;
    vitaminPercent: number;
    mineralPercent: number;
  };

  /**
   * 주간 운동 완료 체크 달성 횟수
   * @example 4
   */
  weeklyWorkoutCompletedDays: number;
}

export interface OndemandReportRequest {
  /**
   * 사용자 ID
   */
  userId: number;
}

export interface AsyncReportGenerateRequest {
  /**
   * 리포트 집계 기간
   * @example "WEEKLY"
   */
  period?: "WEEKLY" | "MONTHLY";
}

export interface AsyncReportGenerateResponse {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
}

export interface ReportJobStatusResponse {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  reportId?: number;
  progressPercent: number;
}

export interface ReportDetailResponse {
  reportId: number;
  period: string;
  summary: string;
  wellnessScore: number;
  aiRecommendation: string;
  createdAt: string;
}

export interface OndemandReportResponse {
  /**
   * 생성된 리포트 고유 ID
   */
  reportId: number;

  /**
   * 리포트 생성 일시
   */
  generatedAt: string;

  /**
   * AI 종합 리포트 제목
   * @example "우당탕탕님의 주간 웰니스 & 심리 케어 진단서 🌟"
   */
  summaryTitle: string;

  /**
   * AI 건강 진단 상세 내용
   */
  findings: string;

  /**
   * AI가 추천하는 다음 행동 가이드 목록
   */
  nextActionChecks: string[];
}

export type MonthlyReportResponse = OndemandReportResponse;

/**
 * BE -> AI Server 내부 통신 요약 요청/응답 타입
 */
export interface AiReportInternalPayload {
  userId: number;
  weeklyStats: {
    waterGoalAchievedDays: number;
    workoutCompletedDays: number;
    avgCalories: number;
    dominantEmotions: string[];
  };
}

export interface AiReportInternalResponse {
  summaryTitle: string;
  findings: string;
  nextActionChecks: string[];
}
