import { PlanetType } from "@/interfaces/enums";

export const FUEL_REWARDS = {
  CHAT: 10,
  QUICK_LOG: 10,
  FOOD_CONFIRM: 50,
  DEFAULT_ACTION: 10,
} as const;

export const EXP_REWARDS = {
  FOOD_CONFIRM: 30,
} as const;

// ─────────────────────────────────────────────
// Star Travel Two-Gauge 시스템 상수
// ─────────────────────────────────────────────

export const MAX_FUEL = 100;
export const DEFAULT_FUEL_GAIN = 10;
export const WARP_FUEL_THRESHOLD = 100;
export const REPORT_FUEL_COST = 100;

export const STAR_PLANETS = [
  { planetId: "meal", planetName: "식사별" },
  { planetId: "water", planetName: "수분별" },
  { planetId: "emotion", planetName: "감정별" },
  { planetId: "habit", planetName: "생활습관별" },
] as const;

export const PLANET_CONFIGS = [
  { planetType: PlanetType.MEAL, name: "식단 탐사 별", targetDistance: 100 },
  { planetType: PlanetType.WATER, name: "수분 탐사 별", targetDistance: 100 },
  { planetType: PlanetType.EMOTION, name: "감정 대화 별", targetDistance: 100 },
  {
    planetType: PlanetType.LIFESTYLE,
    name: "라이프스타일 별",
    targetDistance: 100,
  },
  { planetType: PlanetType.RETROSPECT, name: "회고 별", targetDistance: 100 },
] as const;

export const TOTAL_STAR_COUNT = PLANET_CONFIGS.length;
export const TOTAL_TARGET_DISTANCE = 500;

export const DISTANCE_REDUCTIONS = {
  MEAL_CONFIRM: 10,
  WATER_LOG: 5,
  EMOTION_QUICK: 5,
  CHAT_EMOTION: 5,
  EMOTION_DIARY: 10,
  EXERCISE_LOG: 10,
} as const;
