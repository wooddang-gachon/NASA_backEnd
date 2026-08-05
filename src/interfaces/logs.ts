import { EmotionState, LogCategory } from "./enums";

export interface QuickLogCreateRequest {
  category: LogCategory;
  amount?: number;
  emotionType?: string;
  journalContent?: string;
  durationMinutes?: number;
}

export interface QuickLogResponse {
  id: string;
  userId: number;
  category: LogCategory;
  amount?: number | null;
  emotionType?: string | null;
  journalContent?: string | null;
  durationMinutes?: number | null;
  earnedFuel: number;
  createdAt: string;
}

export interface EmotionLogRequest {
  emotionState: EmotionState;
  causeSummary?: string;
}

export interface UserBodyLogRequest {
  heightCm: number;
  weightKg: number;
}
