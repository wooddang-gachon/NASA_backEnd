import { LogCategory, EmotionState } from "../../interfaces/enums";

export interface QuickLog {
  id: number;
  userId: number;
  category: LogCategory;
  amount?: number | null;
  emotionType?: EmotionState | string | null;
  journalContent?: string | null;
  durationMinutes?: number | null;
  earnedFuel: number;
  createdAt?: Date;
}

export interface ExerciseLog {
  id?: number;
  userId: number;
  exerciseName: string;
  durationMinutes: number;
  caloriesBurnedKcal?: number | null;
  recordedAt?: Date;
}

export interface WaterLog {
  id?: number;
  userId: number;
  intakeMl: number;
  recordedAt?: Date;
}

export interface EmotionLog {
  id?: number;
  userId: number;
  emotionState: EmotionState;
  causeSummary?: string | null;
  recordedAt?: Date;
}

export interface DbQuickLogItem {
  id: number | bigint;
  category: string;
  earned_fuel: number;
  created_at?: Date | string | null;
}
