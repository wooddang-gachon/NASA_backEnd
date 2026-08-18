import {
  parseMonthlyRetroMarkdown,
  RetroFallbackValues,
} from "../../../utils/markdownParser";

describe("parseMonthlyRetroMarkdown", () => {
  const defaultFallback: RetroFallbackValues = {
    aiLetter: "기본 편지 내용입니다.",
    mindfulnessInsight: "기본 마인드풀니스 인사이트입니다.",
    strengths: ["#성실한기록", "#꾸준한실천"],
    improvements: ["#아침식사규칙성", "#수면전마음정리"],
    nextMonthGoals: ["하루 2000ml 수분 섭취", "주 3회 운동"],
  };

  it("정형화된 마크다운에서 모든 섹션을 정상적으로 파싱해야 한다", () => {
    const sampleMd = `
## 종합 편지
8월 한 달 동안 정말 고생 많으셨어요! 수분과 식사 루틴을 잘 지키셨습니다.

## 마인드풀니스 인사이트
월요일 오전에 스트레스 지수가 상대적으로 높게 측정되었습니다. 가벼운 심호흡을 권장합니다.

## 잘한 점
#수분목표달성 #규칙적인점심 #주말러닝성공

## 개선할 점
- #야식줄이기
- #수면시간확보

## 다음 달 목표
1. 생활습관별 주 4회 방문하기
2. 하루 물 2리터 마시기 루틴 유지
    `;

    const result = parseMonthlyRetroMarkdown(sampleMd, defaultFallback);

    expect(result.aiLetter).toContain("8월 한 달 동안 정말 고생 많으셨어요!");
    expect(result.mindfulnessInsight).toContain("월요일 오전에 스트레스 지수");
    expect(result.strengths).toEqual([
      "#수분목표달성",
      "#규칙적인점심",
      "#주말러닝성공",
    ]);
    expect(result.improvements).toEqual(["#야식줄이기", "#수면시간확보"]);
    expect(result.nextMonthGoals).toEqual([
      "생활습관별 주 4회 방문하기",
      "하루 물 2리터 마시기 루틴 유지",
    ]);
  });

  it("일부 섹션이 누락된 경우 해당 섹션만 fallback 기본값으로 대체해야 한다 (부분 복구)", () => {
    const partialMd = `
## 편지
단순한 편지 내용만 포함되어 있습니다.
    `;

    const result = parseMonthlyRetroMarkdown(partialMd, defaultFallback);

    expect(result.aiLetter).toContain("단순한 편지 내용만 포함되어 있습니다.");
    expect(result.mindfulnessInsight).toBe(defaultFallback.mindfulnessInsight);
    expect(result.strengths).toEqual(defaultFallback.strengths);
    expect(result.improvements).toEqual(defaultFallback.improvements);
    expect(result.nextMonthGoals).toEqual(defaultFallback.nextMonthGoals);
  });

  it("빈 문자열이거나 유효하지 않은 입력 시 전체 fallback 값을 반환해야 한다", () => {
    const result = parseMonthlyRetroMarkdown("", defaultFallback);
    expect(result).toEqual(defaultFallback);
  });
});
