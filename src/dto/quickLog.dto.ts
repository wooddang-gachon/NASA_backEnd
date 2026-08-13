import { LogCategory, EmotionState } from "../interfaces/enums";

export interface QuickLogCreateRequest {
  category: LogCategory;
  amount?: number;
  emotionType?: string;
  journalContent?: string;
  durationMinutes?: number;
}

export interface QuickLogApiRequest {
  category: LogCategory | "WATER" | "EMOTION" | "JOURNAL" | "EXERCISE";
  amount?: number;
  emotionType?: EmotionState | string;
  journalContent?: string;
  exerciseName?: string;
  durationMinutes?: number;
}

export interface QuickLogApiResponse {
  logId: string | number;
  category: LogCategory | string;
  earnedFuel: number;
  totalFuel: number;
  createdAt?: string;
}
