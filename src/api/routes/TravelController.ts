import { Controller, Route, Get, Post, Body, Query } from "tsoa";
import { Service } from "typedi";
import TravelService from "../../services/travelService";
import type { TravelStateResponse, TravelFuelRequest, TravelFuelResponse } from "../../interfaces";

@Service()
@Route("travel")
export class TravelController extends Controller {
  constructor(private travelService: TravelService) {
    super();
  }

  /**
   * 우주여행 상태(연료, 좌표, 현재 도달한 행성 정보 등)를 조회합니다.
   */
  @Get("state")
  public async getTravelState(@Query() userId: number): Promise<TravelStateResponse> {
    return await this.travelService.getTravelState(userId);
  }

  /**
   * 미션 성공(식단 분석 완료, 운동 완료 등)에 따라 우주선 연료를 지급합니다.
   */
  @Post("fuel")
  public async addFuel(
    @Query() userId: number,
    @Body() requestBody: TravelFuelRequest
  ): Promise<TravelFuelResponse> {
    return await this.travelService.addFuel(userId, requestBody.triggerType);
  }
}
