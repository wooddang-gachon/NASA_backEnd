import { planet_travels, PlanetType, TravelStatus } from "@prisma/client";
import { PlanetTravelResponse, PlanetTravelStartRequest } from "../interfaces/travel";

export function toPlanetTravelCreateInput(
  userId: number,
  data: PlanetTravelStartRequest
) {
  return {
    user_id: userId,
    planet_id: data.planetId ?? null,
    planet_type: data.planetType,
    fuel_spent: data.fuelSpent,
    status: TravelStatus.IN_PROGRESS,
  };
}

export function toPlanetTravelResponse(travel: planet_travels): PlanetTravelResponse {
  return {
    id: travel.id.toString(),
    userId: travel.user_id,
    planetId: travel.planet_id,
    planetType: travel.planet_type,
    fuelSpent: travel.fuel_spent,
    status: travel.status,
    startedAt: travel.started_at.toISOString(),
    completedAt: travel.completed_at ? travel.completed_at.toISOString() : null,
  };
}
