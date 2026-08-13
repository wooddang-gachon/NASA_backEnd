import Logger from "../loaders/logger";
import { getPrisma } from "../loaders/prisma";

/**
 * 매일 밤 11시 30분: 오늘 기록(수분/운동)이 누락된 사용자 대상 능동형 안부 트리거 생성 작업
 */
export const runProactiveTriggerJob = async (): Promise<void> => {
  Logger.info(
    "⏰  [Job] 오늘 기록 부족 유저 대상 능동형 안부 트리거 상태 분석 시작...",
  );
  const prisma = getPrisma();

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const allUsers = await prisma.users.findMany();

    for (const user of allUsers) {
      const waterCount = await prisma.quick_logs.count({
        where: {
          user_id: user.id,
          category: "WATER",
          created_at: { gte: startOfDay },
        },
      });

      if (waterCount === 0) {
        await prisma.proactive_triggers.create({
          data: {
            user_id: user.id,
            trigger_type: "NO_WATER",
            message_text: `${user.nickname}님, 오늘 수분 섭취 기록이 아직 없어요! 따뜻한 물 한 잔 마시고 타미에게 자랑해 주세요 💧`,
            status: "PENDING",
          },
        });
      }
    }

    Logger.info("✅  [Job] 능동형 안부 트리거 생성 완료");
  } catch (error) {
    Logger.error("🔥  [Job] 능동형 안부 트리거 작업 실행 중 에러 발생:", error);
  }
};
