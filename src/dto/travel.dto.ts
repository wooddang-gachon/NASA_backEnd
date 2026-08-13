import { PlanetType, TravelStatus } from "../interfaces/enums";

export interface PlanetTravelStartApiRequest {
  planetType:
    PlanetType | "MEAL" | "WATER" | "EMOTION" | "LIFESTYLE" | "RETROSPECT";
  fuelSpent: number;
}

export interface TravelResultSummary {
  id: string | number;
  userId: number;
  title: string;
  summaryContent: string;
  recommendations: string[];
}

export interface PlanetTravelStartApiResponse {
  travelId: string | number;
  travelResultId: string | number;
  remainingFuel: number;
  status: TravelStatus | string;
  travelResult?: TravelResultSummary;
}

export interface PlanetStateItem {
  planetType: PlanetType;
  name: string;
  targetDistance: number;
  currentDistance: number;
  isCompleted: boolean;
  completedAt?: string | null;
}

export interface TravelStateInfoResponse {
  currentPlanet?: string;
  activePlanet?: PlanetType | null;
  explorationProgressPercent: number;
  currentFuel: number;
  requiredFuelForNextPlanet?: number;
  totalStarCount: number;
  completedStarCount: number;
  tammyRelationshipLevel: number;
  planetList: PlanetStateItem[];
}

export interface FuelAddApiResponse {
  gainedFuel: number;
  currentFuel: number;
  isWarped: boolean;
}

export interface TravelResultDetailInfo {
  reportId?: string | number;
  travelResultId?: string | number;
  userId?: number;
  title: string;
  summaryContent: string;
  recommendations: string[];
  createdAt?: string | Date;
}

export interface NutritionBalanceInfo {
  carbohydratePercent: number;
  proteinPercent: number;
  fatPercent: number;
  vitaminPercent: number;
  mineralPercent: number;
}

export interface CalorieTrendItem {
  date: string;
  caloriesKcal: number;
}

export interface DashboardSummaryInfo {
  calorieTrends: CalorieTrendItem[];
  nutritionBalance: NutritionBalanceInfo;
  weeklyWorkoutCompletedDays: number;
}
