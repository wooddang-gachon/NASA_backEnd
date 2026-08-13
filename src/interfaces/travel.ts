import { PlanetType, TravelStatus } from "./enums";

// ==========================================
// 1. 별여행(PlanetTravel) & 연료 관련 인터페이스
// ==========================================
export interface PlanetTravelStartRequest {
  planetId?: number;
  planetType: PlanetType;
  fuelSpent: number;
}

export interface PlanetTravelResponse {
  id: string;
  userId: number;
  planetId: number | null;
  planetType: PlanetType;
  fuelSpent: number;
  status: TravelStatus;
  startedAt: string;
  completedAt?: string | null;
}

export interface PlanetTravelCompleteRequest {
  travelId: string;
  summaryContent?: string;
  recommendations?: string;
}

export interface TravelStateResponse {
  currentPlanet?: string;
  explorationProgressPercent: number;
  currentFuel: number;
  requiredFuelForNextPlanet: number;
  tammyRelationshipLevel: number;
}

export interface FuelAddRequest {
  userId?: number;
  triggerType?: string;
  actionType?:
    "CHAT_MESSAGE" | "MEAL_LOG" | "WORKOUT_DONE" | "WATER_INTAKE" | string;
}

export type TravelFuelRequest = FuelAddRequest;

export interface FuelAddResponse {
  gainedFuel: number;
  currentFuel: number;
  isWarped: boolean;
  newPlanetName?: string;
}

export type TravelFuelResponse = FuelAddResponse;

// ==========================================
// 2. 별여행 탐사 결과(TravelResult / Report) 인터페이스
// ==========================================
export interface TravelResultCreateRequest {
  planetTravelId?: string;
  planetType: PlanetType;
  title: string;
  summaryContent: string;
  recommendations: string;
}

export interface TravelResultResponse {
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

export interface OndemandTravelResultRequest {
  userId: number;
}

export interface AsyncTravelResultGenerateRequest {
  period?: "WEEKLY" | "MONTHLY";
}

export interface AsyncTravelResultGenerateResponse {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
}

export interface TravelResultJobStatusResponse {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  travelResultId?: string | number;
  reportId?: string | number;
  progressPercent: number;
}

export interface TravelResultDetailResponse {
  travelResultId: string | number;
  reportId?: string | number;
  period: string;
  summary: string;
  wellnessScore: number;
  aiRecommendation: string;
  createdAt: string;
}

export interface OndemandTravelResultResponse {
  travelResultId: string | number;
  generatedAt: string;
  summaryTitle: string;
  findings: string;
  nextActionChecks: string[];
}

// 호환용 Alias
export type ReportCreateRequest = TravelResultCreateRequest;
export type ReportResponse = TravelResultResponse;
export type ReportDashboardResponse = DashboardResponse;
export type OndemandReportRequest = OndemandTravelResultRequest;
export type AsyncReportGenerateRequest = AsyncTravelResultGenerateRequest;
export type AsyncReportGenerateResponse = AsyncTravelResultGenerateResponse;
export type ReportJobStatusResponse = TravelResultJobStatusResponse;
export type ReportDetailResponse = TravelResultDetailResponse;
export type OndemandReportResponse = OndemandTravelResultResponse;
import { AiReportInternalPayload, AiReportInternalResponse } from "./aiServer";

export type AiReportInternalPayloadAlias = AiReportInternalPayload;
export type AiReportInternalResponseAlias = AiReportInternalResponse;
