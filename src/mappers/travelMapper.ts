import { reports } from "@prisma/client";
import { TravelResultCreateRequest, TravelResultResponse, PlanetTravelStartRequest } from "../interfaces/travel";
import { TravelResultDetailInfo, PlanetTravelStartApiResponse, TravelStateInfoResponse } from "../dto/travel.dto";
import { PlanetType } from "../interfaces/enums";

export class TravelMapper {
  /**
   * 별여행(PlanetTravel) 출발 DB 생성 인풋 객체 생성
   */
  public static toPlanetTravelCreateInput(userId: number, data: PlanetTravelStartRequest) {
    return {
      user_id: userId,
      planet_id: data.planetId ? Number(data.planetId) : null,
      planet_type: data.planetType,
      fuel_spent: data.fuelSpent,
    };
  }

  /**
   * AI 탐사 결과(TravelResult/Report) DB 생성 인풋 객체 생성
   */
  public static toTravelResultCreateInput(userId: number, data: TravelResultCreateRequest) {
    return {
      user_id: userId,
      planet_travel_id: data.planetTravelId ? BigInt(data.planetTravelId) : null,
      planet_type: data.planetType,
      title: data.title,
      summary_content: data.summaryContent,
      recommendations: data.recommendations,
    };
  }

  /**
   * AI 서버 통신 장애 시 Fallback 탐사 결과 DB 생성 인풋 객체 생성
   */
  public static toFallbackReportCreateInput(userId: number, travelId: bigint, planetType: PlanetType) {
    return {
      user_id: userId,
      planet_travel_id: travelId,
      planet_type: planetType,
      title: "아쿠아 웰니스 탐사 완료 리포트 🌟",
      summary_content: "별여행 탐사가 안전하게 완료되었습니다! 오늘 하루도 건강한 수분과 영양을 챙겨보세요.",
      recommendations: "매일 물 2,000ml 마시기\n저녁 8시 산책하기",
    };
  }

  /**
   * 별여행 탐사 출발 서비스 응답 DTO 반환
   */
  public static toStartApiResponse(
    travel: { id: bigint | string; status: string },
    travelResultId: string | undefined,
    remainingFuel: number,
    travelResultData: any
  ): PlanetTravelStartApiResponse {
    return {
      travelId: travel.id.toString(),
      travelResultId: travelResultId || "",
      remainingFuel,
      status: travel.status,
      travelResult: travelResultData,
    };
  }

  /**
   * 우주여행 현황 서비스 응답 DTO 반환
   */
  public static toTravelStateResponse(user: any): TravelStateInfoResponse {
    const currentFuel = user.current_fuel ?? 0;
    const requiredFuel = 300;
    const progressPercent = Math.min(Math.floor((currentFuel / requiredFuel) * 100), 100);

    return {
      currentPlanet: "아쿠아 웰니스 행성",
      explorationProgressPercent: progressPercent,
      currentFuel,
      requiredFuelForNextPlanet: requiredFuel,
      tammyRelationshipLevel: user.tammy_statuses?.level || 1,
    };
  }

  /**
   * DB Report 엔티티 ➔ TravelResultResponse 변환
   */
  public static toTravelResultResponse(report: reports): TravelResultResponse {
    return {
      id: report.id.toString(),
      userId: report.user_id,
      planetTravelId: report.planet_travel_id ? report.planet_travel_id.toString() : null,
      planetType: report.planet_type,
      title: report.title,
      summaryContent: report.summary_content,
      recommendations: report.recommendations,
      createdAt: report.created_at.toISOString(),
    };
  }

  /**
   * DB Report 객체 ➔ TravelResultDetailInfo DTO 변환
   */
  public static toTravelResultDetailInfo(result: any): TravelResultDetailInfo {
    const recommendationsArray = typeof result.recommendations === "string"
      ? result.recommendations.split("\n").filter(Boolean)
      : (result.recommendations as string[]) || [];

    return {
      reportId: result.id,
      travelResultId: result.id,
      userId: result.userId,
      title: result.title,
      summaryContent: result.summaryContent,
      recommendations: recommendationsArray,
      createdAt: result.createdAt,
    };
  }
}

// 하위 호환용 export
export const toPlanetTravelCreateInput = TravelMapper.toPlanetTravelCreateInput;
export const toTravelResultCreateInput = TravelMapper.toTravelResultCreateInput;
export const toTravelResultResponse = TravelMapper.toTravelResultResponse;
export const toTravelResultDetailInfo = TravelMapper.toTravelResultDetailInfo;
export const toReportCreateInput = TravelMapper.toTravelResultCreateInput;
export const toReportResponse = TravelMapper.toTravelResultResponse;
