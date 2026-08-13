/**
 * 🎮 게이미피케이션 상수 중앙 관리 모듈
 *
 * 연료(Fuel), 경험치(EXP), 행성 탐사 등 게이미피케이션 관련 상수를
 * 한 곳에서 관리합니다. 보상 밸런스 조정 시 이 파일만 수정하면 됩니다.
 */

import { PlanetType } from '@/interfaces/enums';

// ─────────────────────────────────────────────
// 연료(Fuel) 보상
// ─────────────────────────────────────────────
export const FUEL_REWARDS = {
  /** 대화(Chat) 참여 시 지급 연료 */
  CHAT: 10,
  /** 퀵로그(수분/감정 등) 기록 시 지급 연료 */
  QUICK_LOG: 10,
  /** 식단 확정 등록(Food Confirm) 시 지급 연료 */
  FOOD_CONFIRM: 50,
  /** 연료 적립 액션(addFuel) 시 기본 지급 연료 */
  DEFAULT_ACTION: 10,
} as const;

// ─────────────────────────────────────────────
// 경험치(EXP) 보상
// ─────────────────────────────────────────────
export const EXP_REWARDS = {
  /** 식단 확정 등록 시 지급 경험치 */
  FOOD_CONFIRM: 30,
} as const;

// ─────────────────────────────────────────────
// 행성 탐사 (Planet Travel)
// ─────────────────────────────────────────────

/** 다음 행성 워프에 필요한 연료 임계값 */
export const WARP_FUEL_THRESHOLD = 300;

/** 온디맨드 리포트 생성 시 소모 연료 */
export const REPORT_FUEL_COST = 100;

/** 행성 설정 목록 */
export const PLANET_CONFIGS = [
  { planetType: PlanetType.MEAL, name: '식단 탐사 별', targetDistance: 100 },
  { planetType: PlanetType.WATER, name: '수분 탐사 별', targetDistance: 100 },
  { planetType: PlanetType.EMOTION, name: '감정 대화 별', targetDistance: 100 },
  { planetType: PlanetType.LIFESTYLE, name: '라이프스타일 별', targetDistance: 100 },
  { planetType: PlanetType.RETROSPECT, name: '회고 별', targetDistance: 100 },
] as const;

/** 전체 행성 수 */
export const TOTAL_STAR_COUNT = PLANET_CONFIGS.length;

/** 탐사 전체 목표 총거리 */
export const TOTAL_TARGET_DISTANCE = PLANET_CONFIGS.reduce((sum, p) => sum + p.targetDistance, 0);
