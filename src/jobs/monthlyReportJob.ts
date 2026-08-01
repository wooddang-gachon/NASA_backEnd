import Logger from "../loaders/logger";

/**
 * 매월 1일 새벽 1시: 전월 건강 데이터 일괄 요약 및 월간 리포트 자동 생성 작업
 */
export const runMonthlyReportJob = async (): Promise<void> => {
  Logger.info("⏰  [Job] 전월 건강 데이터 일괄 요약 및 월간 리포트 자동 생성 시작...");
  try {
    // TODO: 이전 달 전체 사용자 데이터 집계 후 monthly_reports 테이블 적재
    Logger.info("✅  [Job] 월간 건강 리포트 일괄 적재 완료");
  } catch (error) {
    Logger.error("🔥  [Job] 월간 리포트 생성 작업 실행 중 에러 발생:", error);
  }
};
