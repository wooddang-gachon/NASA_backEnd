import { ChatTurn, EmotionStatus } from "./chat";

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
  labels?: Record<string, unknown>;
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

export interface YoloContext {
  attempted: boolean;
  detected: boolean;
  reason?: "NO_OBJECTS_DETECTED" | "SCAN_ERROR" | "FILE_NOT_FOUND" | string;
}

export interface AiVisionInternalPayload {
  imageUrl?: string;
  imageBase64?: string;
  mealType?: string;
  yoloContext?: YoloContext;
}

/**
 * AI 서버의 원본 비전 응답.
 *
 * 음식명과 바운딩 박스만 담긴 foods[]가 온다. 영양은 사용자가 인식 결과를
 * 검수·수정한 뒤 /v1/nutrition/lookup 으로 따로 조회하는 계약이라 여기 없다.
 *
 * 어댑터가 이 응답을 detectedFoods[]로 정규화하므로, 서비스 계층은 YOLO
 * 결과와 Vision LLM 결과를 같은 모양으로 다룰 수 있다.
 */
export interface AiVisionInternalResponse {
  isIdentified: boolean;
  comment?: string;
  foods?: DetectedFood[];
}

/** 어댑터가 백엔드 도메인 포맷으로 정규화한 비전 결과. */
export interface NormalizedVisionResult {
  isIdentified: boolean;
  comment?: string;
  scanEngine?: string;
  detectedFoods: Array<{
    boxId: number;
    foodName: string;
    boundingBox?: BoundingBox;
    confidence?: number;
  }>;
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
  dailyRecords?: Record<string, unknown>[];
  waterLogs?: Record<string, unknown>[];
  exerciseLogs?: Record<string, unknown>[];
  chatLogs?: Record<string, unknown>[];
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
