import { PlanetType, TravelStatus } from "./enums";

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
  actionType?: "CHAT_MESSAGE" | "MEAL_LOG" | "WORKOUT_DONE" | "WATER_INTAKE" | string;
}

export interface TravelFuelRequest extends FuelAddRequest {}

export interface FuelAddResponse {
  gainedFuel: number;
  currentFuel: number;
  isWarped: boolean;
  newPlanetName?: string;
}

export interface TravelFuelResponse extends FuelAddResponse {}
