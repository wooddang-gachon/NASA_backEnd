import { planet_travels } from "@prisma/client";
import { TravelResultCreateRequest, TravelResultResponse, PlanetTravelStartRequest } from "../interfaces/travel";
import { TravelResultDetailInfo, PlanetTravelStartApiResponse, TravelStateInfoResponse } from "../dto/travel.dto";
import { PlanetType } from "../interfaces/enums";
import { UserWithTammyStatus, DbTravelResultDetailItem } from "../models";

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
      travelResultId: travelResultId || travel.id.toString(),
      remainingFuel,
      status: travel.status,
      travelResult: travelResultData,
    };
  }

  /**
   * 우주여행 현황 서비스 응답 DTO 반환
   */
  public static toTravelStateResponse(user: UserWithTammyStatus): TravelStateInfoResponse {
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
   * DB planet_travels 엔티티 ➔ TravelResultResponse 변환
   */
  public static toTravelResultResponse(travel: planet_travels): TravelResultResponse {
    return {
      id: travel.id.toString(),
      userId: travel.user_id,
      planetTravelId: travel.id.toString(),
      planetType: travel.planet_type,
      title: travel.title || "아쿠아 웰니스 탐사 완료 리포트 🌟",
      summaryContent: travel.summary_content || "별여행 탐사가 완료되었습니다.",
      recommendations: travel.recommendations || "",
      createdAt: travel.started_at.toISOString(),
    };
  }

  /**
   * DB 객체 ➔ TravelResultDetailInfo DTO 변환
   */
  public static toTravelResultDetailInfo(result: DbTravelResultDetailItem): TravelResultDetailInfo {
    const recommendationsArray = typeof result.recommendations === "string"
      ? result.recommendations.split("\n").filter(Boolean)
      : (result.recommendations as string[]) || [];

    return {
      reportId: String(result.id),
      travelResultId: String(result.id),
      userId: Number(result.userId || 0),
      title: result.title || "",
      summaryContent: result.summaryContent || "",
      recommendations: recommendationsArray,
      createdAt: typeof result.createdAt === "string" ? result.createdAt : result.createdAt?.toISOString() || new Date().toISOString(),
    };
  }
}

// 하위 호환용 export
export const toPlanetTravelCreateInput = TravelMapper.toPlanetTravelCreateInput;
export const toTravelResultResponse = TravelMapper.toTravelResultResponse;
export const toTravelResultDetailInfo = TravelMapper.toTravelResultDetailInfo;
export const toReportResponse = TravelMapper.toTravelResultResponse;
