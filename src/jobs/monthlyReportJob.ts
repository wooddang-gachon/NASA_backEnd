import Logger from "../loaders/logger";
import { getPrisma } from "../loaders/prisma";
import { Container } from "typedi";
import TravelService from "../services/travelService";
import TravelRepository from "../repositories/TravelRepository";

/**
 * [Tier 1 Cron Job] 매월 1일 09:00 KST: 전월 4대 행성 데이터 일괄 재집계 & AI 회고록 생성 & 만료 로그 파기
 */
export const runMonthlyReportJob = async (): Promise<void> => {
  Logger.info(
    "⏰  [Job] 월간 회고 리포트(Tier 1) 자동 생성 및 배치 작업 시작...",
  );
  const prisma = getPrisma();
  const travelService = Container.get(TravelService);
  const travelRepository = Container.get(TravelRepository);

  try {
    // 1. 대상 전월(YYYY-MM) 계산 (KST 기준)
    const now = new Date();
    let prevYear = now.getFullYear();
    let prevMonth = now.getMonth(); // 0-indexed: 전월
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const targetYearMonth = `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;

    // 2. 모든 활성 사용자 목록 조회
    const userIds = await travelRepository.findAllActiveUserIds();
    Logger.info(
      `[MonthlyJob] Processing ${userIds.length} users for retro ${targetYearMonth}`,
    );

    for (const userId of userIds) {
      try {
        // 이미 생성되었는지 중복 체크
        const existing = await travelRepository.findMonthlyRetroReport(
          userId,
          targetYearMonth,
        );
        if (existing) {
          Logger.info(
            `[MonthlyJob] User ${userId} already has retro for ${targetYearMonth}, skipping.`,
          );
          continue;
        }

        // 월간 회고 생성
        await travelService.generateMonthlyRetroReport(userId, targetYearMonth);
        Logger.info(`[MonthlyJob] Generated monthly retro for user ${userId}`);
      } catch (userErr) {
        Logger.warn(
          `[MonthlyJob] Failed to generate retro for user ${userId}: ${userErr}`,
        );
      }
    }

    // 3. 30일 경과된 행동/트래킹 로그 정리 (30-Day TTL Policy)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedTriggers = await prisma.proactive_triggers.deleteMany({
      where: {
        created_at: { lt: thirtyDaysAgo },
      },
    });

    Logger.info(
      `✅  [Job] 30일 초과 만료 트리거 로그 ${deletedTriggers.count}건 파기 완료`,
    );
    Logger.info(
      "✅  [Job] 월간 회고 리포트 및 정기 배치 스케줄 작업이 정상 완료되었습니다.",
    );
  } catch (error) {
    Logger.error(
      "🔥  [Job] 월간 리포트 및 배치 스케줄 실행 중 에러 발생:",
      error,
    );
  }
};
