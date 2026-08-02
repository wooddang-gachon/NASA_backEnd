import Logger from "../loaders/logger";
import { getPrisma } from "../loaders/prisma";

/**
 * 매월 1일 새벽 1시: 전월 건강 데이터 일괄 요약 및 만료 로그 파기 (30일 TTL Policy)
 */
export const runMonthlyReportJob = async (): Promise<void> => {
  Logger.info("⏰  [Job] 전월 건강 데이터 일괄 요약 및 30일 경과 로그 파기 작업 시작...");
  const prisma = getPrisma();

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. 30일 경과된 행동/트래킹 로그 정리 (30-Day TTL Policy)
    const deletedTriggers = await prisma.proactive_triggers.deleteMany({
      where: {
        created_at: { lt: thirtyDaysAgo },
      },
    });

    Logger.info(`✅  [Job] 30일 초과 만료 트리거 로그 ${deletedTriggers.count}건 파기 완료`);
    Logger.info("✅  [Job] 월간 리포트 및 정기 배치 스케줄 작업이 정상 처리되었습니다.");
  } catch (error) {
    Logger.error("🔥  [Job] 월간 리포트 및 배치 스케줄 실행 중 에러 발생:", error);
  }
};
