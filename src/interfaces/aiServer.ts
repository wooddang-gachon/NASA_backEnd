import { ChatTurn, EmotionStatus } from "./chat";
import { PlanetType } from "./enums";

// ==========================================
// 1. BE ↔ AI Chat Protocol
// ==========================================
export interface AiChatInternalPayload {
  userId: number;
  userMessage: string;
  nickname?: string;
  history?: ChatTurn[];
}

export interface AiChatInternalResponse {
  replyText: string;
  emotion: EmotionStatus;
  motionTag?: string;
  intentLabel?: string;
  labels?: any;
  extractedMemory?: {
    category: string;
    content: string;
  };
}

// ==========================================
// 2. BE ↔ AI Food Vision Protocol
// ==========================================
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedFood {
  name: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

/**
 * 비전 응답에는 영양 정보가 없다. 음식명과 바운딩 박스만 온다.
 * 영양은 사용자가 인식 결과를 검수한 뒤 /v1/nutrition/lookup 으로 조회한다.
 */
export interface AiVisionInternalResponse {
  isIdentified: boolean;
  comment?: string;
  foods?: DetectedFood[];
}

// ==========================================
// 3. BE ↔ AI Nutrition Lookup Protocol
// ==========================================
export interface NutritionSource {
  title: string;
  publisher: string;
  url: string;
}

export interface NutritionItem {
  name: string;
  servingSizeG?: number;
  caloriesKcal: number;
  carbohydrateG: number;
  proteinG: number;
  fatG: number;
  vitaminPercent?: number;
  mineralPercent?: number;
  confidence: number;
  sources?: NutritionSource[];
}

export interface NutritionLookupResponse {
  items: NutritionItem[];
}

// ==========================================
// 4. BE ↔ AI Planet Report Protocol
// ==========================================
export interface AiReportInternalResponse {
  title?: string;
  markdown?: string;
  summaryTitle?: string;
  findings?: string;
  nextActionChecks: string[];
}

export type AiTravelResultInternalResponse = AiReportInternalResponse;

export interface AiReportInternalPayload {
  userId: number;
  nickname?: string;
  period?: { start: string; end: string };
  dailyRecords?: any[];
  waterLogs?: any[];
  exerciseLogs?: any[];
  chatLogs?: any[];
  dailySteps?: Record<string, number>;
  dailyGoalMl?: number;
  weeklyStats?: {
    waterGoalAchievedDays: number;
    workoutCompletedDays: number;
    avgCalories: number;
    dominantEmotions: string[];
  };
}

export type AiTravelResultInternalPayload = AiReportInternalPayload;
