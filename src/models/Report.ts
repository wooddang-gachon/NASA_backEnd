import { reports } from "@prisma/client";
import { ReportCreateRequest, ReportResponse } from "../interfaces/report";

export function toReportCreateInput(
  userId: number,
  data: ReportCreateRequest
) {
  return {
    user_id: userId,
    planet_travel_id: data.planetTravelId ? BigInt(data.planetTravelId) : null,
    planet_type: data.planetType,
    title: data.title,
    summary_content: data.summaryContent,
    recommendations: data.recommendations,
  };
}

export function toReportResponse(report: reports): ReportResponse {
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
