import { planet_travels } from "@prisma/client";
import { TravelResultCreateRequest, TravelResultResponse, PlanetTravelStartRequest } from "../interfaces/travel";
import { TravelResultDetailInfo, PlanetTravelStartApiResponse, TravelStateInfoResponse, PlanetStateItem } from "../dto/travel.dto";
import { PlanetType } from "../interfaces/enums";
import { UserWithTammyStatus, DbTravelResultDetailItem } from "../repositories/models";
import { PLANET_CONFIGS, TOTAL_STAR_COUNT, TOTAL_TARGET_DISTANCE, WARP_FUEL_THRESHOLD } from "@/constants/gamification";
import { BaseMapper } from "./BaseMapper";

export class TravelMapper extends BaseMapper {
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
    travelResultData: TravelResultResponse
  ): PlanetTravelStartApiResponse {
    return {
      travelId: travel.id.toString(),
      travelResultId: travelResultId || travel.id.toString(),
      remainingFuel,
      status: travel.status,
      travelResult: travelResultData as any,
    };
  }

  /**
   * 우주여행 현황 서비스 응답 DTO 반환
   */
  public static toTravelStateResponse(
    user: UserWithTammyStatus,
    planetList: PlanetStateItem[],
    progressPercent: number,
    activeTravel?: planet_travels | null,
    completedTravels: planet_travels[] = []
  ): TravelStateInfoResponse {
    const currentFuel = user.current_fuel ?? 0;

    const completedTypeSet = new Set(completedTravels.map((t) => t.planet_type));
    const completedMap = new Map<string, string>();
    completedTravels.forEach((t) => {
      if (t.completed_at) {
        completedMap.set(t.planet_type, t.completed_at.toISOString());
      }
    });

    const completedStarCount = completedTypeSet.size;
    const activePlanetType = activeTravel?.planet_type || null;

    return {
      currentPlanet: activePlanetType || (completedStarCount > 0 ? Array.from(completedTypeSet).pop() : PlanetType.MEAL),
      activePlanet: activePlanetType,
      explorationProgressPercent: progressPercent,
      currentFuel,
      requiredFuelForNextPlanet: WARP_FUEL_THRESHOLD,
      totalStarCount: TOTAL_STAR_COUNT,
      completedStarCount,
      tammyRelationshipLevel: user.tammy_statuses?.level || 1,
      planetList,
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
