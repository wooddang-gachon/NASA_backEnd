import { Controller, Route, Post, Get, Body, Security, Request } from "tsoa";
import { Service, Container } from "typedi";
import TravelService from "../../services/travelService";
import { PlanetType } from "../../interfaces/enums";

export interface PlanetTravelStartApiRequest {
  planetType: PlanetType;
  fuelSpent: number;
}

export interface PlanetTravelStartApiResponse {
  success: boolean;
  message: string;
  data?: {
    travelId: string;
    remainingFuel: number;
  };
}

export interface TravelStateInfoResponse {
  currentPlanet?: string;
  explorationProgressPercent: number;
  currentFuel: number;
  requiredFuelForNextPlanet: number;
  tammyRelationshipLevel: number;
}

@Service()
@Route("planet-travel")
export class TravelController extends Controller {
  private travelService = Container.get(TravelService);

  /**
   * [3.3] 별여행 게이미피케이션 탐사 출발 API
   */
  @Post("start")
  @Security("jwt")
  public async startPlanetTravel(
    @Request() request: any,
    @Body() body: PlanetTravelStartApiRequest
  ): Promise<PlanetTravelStartApiResponse> {
    this.setStatus(202);
    return {
      success: true,
      message: "별여행 탐사를 출발했습니다.",
      data: {
        travelId: `travel_${Date.now()}`,
        remainingFuel: 100,
      },
    };
  }

  /**
   * 우주여행 현황 조회
   */
  @Get("state")
  @Security("jwt")
  public async getTravelState(@Request() request: any): Promise<TravelStateInfoResponse> {
    const userId = request.currentUser?.userId || 1;
    return await this.travelService.getTravelState(userId);
  }
}
