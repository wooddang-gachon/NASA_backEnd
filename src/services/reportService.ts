import { Service } from "typedi";
import AiService from "./aiService";
import { MonthlyReportResponse } from "../interfaces";
import Logger from "../loaders/logger";

@Service()
export default class ReportService {
  constructor(private aiService: AiService) {}

  /**
   * 특정 연월의 사용자 건강 로그를 집계하고 리포트를 생성합니다. (스텁)
   */
  public async generateMonthlyReport(userId: number, yearMonth: string): Promise<MonthlyReportResponse> {
    Logger.info(`[ReportService] 월간 리포트 생성: userId=${userId}, yearMonth=${yearMonth}`);

    // TODO: 1. DB 한 달간 식단, 운동, 수분, 감정 로그 통계 집계
    // TODO: 2. AI 총평 및 인사이트 생성
    // TODO: 3. monthly_reports 캐시 데이터 저장 및 반환

    throw new Error("Method not implemented.");
  }
}
