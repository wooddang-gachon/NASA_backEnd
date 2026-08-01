import Logger from "../loaders/logger";

/**
 * 매일 밤 11시 30분: 오늘 기록이 누락된 사용자 대상 능동형 안부 트리거 생성 작업
 */
export const runProactiveTriggerJob = async (): Promise<void> => {
  Logger.info("⏰  [Job] 오늘 기록 부족 유저 대상 능동형 안부 트리거 상태 분석 시작...");
  try {
    // TODO: DB를 조회해 오늘 물을 마시지 않은 유저를 찾아 proactive_triggers에 추가하는 비즈니스 로직
    Logger.info("✅  [Job] 능동형 안부 트리거 분석 완료");
  } catch (error) {
    Logger.error("🔥  [Job] 능동형 안부 트리거 작업 실행 중 에러 발생:", error);
  }
};
