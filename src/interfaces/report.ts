import { PlanetType } from "./enums";

export interface ReportCreateRequest {
  planetTravelId?: string;
  planetType: PlanetType;
  title: string;
  summaryContent: string;
  recommendations: string;
}

export interface ReportResponse {
  id: string;
  userId: number;
  planetTravelId?: string | null;
  planetType: PlanetType;
  title: string;
  summaryContent: string;
  recommendations: string;
  createdAt: string;
}

export interface DashboardResponse {
  calorieTrends: Array<{ date: string; caloriesKcal: number }>;
  nutritionBalance: {
    carbohydratePercent: number;
    proteinPercent: number;
    fatPercent: number;
    vitaminPercent: number;
    mineralPercent: number;
  };
  weeklyWorkoutCompletedDays: number;
}

export interface OndemandReportRequest {
  userId: number;
}

export interface AsyncReportGenerateRequest {
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
  reportId?: string | number;
  progressPercent: number;
}

export interface ReportDetailResponse {
  reportId: string | number;
  period: string;
  summary: string;
  wellnessScore: number;
  aiRecommendation: string;
  createdAt: string;
}

export interface OndemandReportResponse {
  reportId: string | number;
  generatedAt: string;
  summaryTitle: string;
  findings: string;
  nextActionChecks: string[];
}

export interface MonthlyReportResponse extends OndemandReportResponse {}

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
