import { Controller, Route, Get, Post, Body, Query } from "tsoa";
import { Service, Container } from "typedi";
import TravelService from "../../services/travelService";
import type { TravelStateResponse, TravelFuelRequest, TravelFuelResponse } from "../../interfaces";

@Service()
@Route("travel")
export class TravelController extends Controller {
  private travelService = Container.get(TravelService);

  constructor() {
    super();
  }

  /**
   * 우주여행 상태(연료, 좌표, 도달 행성 등)를 조회합니다.
   */
  @Get("state")
  public async getTravelState(@Query() userId: number): Promise<TravelStateResponse> {
    return await this.travelService.getTravelState(userId);
  }

  /**
   * 미션 성공에 따른 우주선 연료를 충전합니다.
   */
  @Post("fuel")
  public async addFuel(
    @Query() userId: number,
    @Body() requestBody: TravelFuelRequest
  ): Promise<TravelFuelResponse> {
    return await this.travelService.addFuel(userId, requestBody.triggerType || requestBody.actionType || "WORKOUT_DONE");
  }
}
