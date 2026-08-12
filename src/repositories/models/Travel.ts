import { PlanetType, TravelStatus } from "../../interfaces/enums";

export interface Planet {
  id: number;
  name: string;
  type: PlanetType;
  requiredFuel: number;
  description?: string | null;
  createdAt?: Date;
}

export interface PlanetTravel {
  id: string;
  userId: number;
  planetId?: number | null;
  planetType: PlanetType;
  fuelSpent: number;
  status: TravelStatus;
  startedAt: Date;
  completedAt?: Date | null;
}

export interface SpaceTravelState {
  id?: number;
  userId: number;
  currentPlanet?: string | null;
  explorationProgressPercent: number;
  currentFuel: number;
  requiredFuelForNextPlanet: number;
  tammyRelationshipLevel: number;
  updatedAt?: Date;
}

export interface TravelResult {
  id: string;
  userId: number;
  planetTravelId?: string | null;
  planetType: PlanetType;
  title: string;
  summaryContent: string;
  recommendations: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  userId: number;
  planetTravelId?: string | null;
  planetType: PlanetType;
  title: string;
  summaryContent: string;
  recommendations: string;
  createdAt: Date;
}

export interface WellnessReport {
  id: number;
  userId: number;
  period: string;
  summary: string;
  wellnessScore: number;
  aiRecommendation: string;
  createdAt?: Date;
}

export interface DbTravelResultDetailItem {
  id: string | number;
  userId?: number;
  title?: string;
  summaryContent?: string;
  recommendations?: string | string[] | null;
  createdAt?: string | Date;
}
