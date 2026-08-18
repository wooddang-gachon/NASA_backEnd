export interface ParsedMonthlyRetro {
  aiLetter: string;
  mindfulnessInsight: string | null;
  strengths: string[];
  improvements: string[];
  nextMonthGoals: string[];
}

export interface RetroFallbackValues {
  aiLetter: string;
  mindfulnessInsight: string;
  strengths: string[];
  improvements: string[];
  nextMonthGoals: string[];
}

/**
 * AI가 생성한 마크다운 응답에서 월간 회고 섹션을 파싱합니다.
 * 누락되거나 파싱에 실패한 섹션은 fallbackValues로 대체됩니다.
 */
export function parseMonthlyRetroMarkdown(
  markdown: string,
  fallback: RetroFallbackValues,
): ParsedMonthlyRetro {
  if (!markdown || typeof markdown !== "string") {
    return {
      aiLetter: fallback.aiLetter,
      mindfulnessInsight: fallback.mindfulnessInsight,
      strengths: fallback.strengths,
      improvements: fallback.improvements,
      nextMonthGoals: fallback.nextMonthGoals,
    };
  }

  // 섹션 정규식 추출 헬퍼 (## 헤더 기준)
  const extractSection = (headerPatterns: string[]): string | null => {
    for (const pattern of headerPatterns) {
      // ## [header] 뒤부터 다음 ## 헤더 또는 문자열 끝까지 캡처
      const regex = new RegExp(
        `(?:^|\\n)##+\\s*(?:${pattern})[^\n]*\\n([\\s\\S]*?)(?=(?:\\n##+|$))`,
        "i",
      );
      const match = markdown.match(regex);
      if (match && match[1] && match[1].trim().length > 0) {
        return match[1].trim();
      }
    }
    return null;
  };

  // 1. 종합 편지 (## 종합 편지, ## 편지, ## 한 달 회고, 또는 첫 번째 섹션 헤더 앞부분)
  let aiLetter = extractSection([
    "종합\\s*편지",
    "편지",
    "한\\s*달\\s*회고",
    "월간\\s*회고",
    "리포트\\s*총평",
  ]);

  if (!aiLetter) {
    // 만약 ## 헤더가 없다면 전체 텍스트 또는 첫 번째 ## 이전의 텍스트
    const firstHeaderMatch = markdown.match(/(?:^|\n)##+/);
    if (firstHeaderMatch && firstHeaderMatch.index && firstHeaderMatch.index > 0) {
      const leadingText = markdown.slice(0, firstHeaderMatch.index).trim();
      if (leadingText.length > 0) {
        aiLetter = leadingText;
      }
    }
    if (!aiLetter && markdown.trim().length > 0) {
      aiLetter = markdown.trim();
    }
  }

  // 2. 마인드풀니스 인사이트
  const mindfulnessRaw = extractSection([
    "마인드풀니스\\s*인사이트",
    "마인드풀니스",
    "마음\\s*건강",
    "스트레스\\s*(?:및|과)?\\s*감정",
    "감정\\s*분석",
  ]);

  // 3. 해시태그 / 리스트 파싱 헬퍼
  const parseTagsOrList = (sectionRaw: string | null): string[] => {
    if (!sectionRaw) return [];
    // 1) 해시태그 매칭 (#태그명)
    const hashtagMatches = sectionRaw.match(/#[^\s#,\n]+/g);
    if (hashtagMatches && hashtagMatches.length > 0) {
      return hashtagMatches.map((t) => (t.startsWith("#") ? t : `#${t}`)).slice(0, 5);
    }
    // 2) 불릿 포인트 매칭 (- 항목, * 항목, 1. 항목)
    const lines = sectionRaw.split("\n");
    const listItems: string[] = [];
    for (const line of lines) {
      const cleaned = line.replace(/^[\s*\-•\d.]+\s*/, "").trim();
      if (cleaned.length > 0) {
        // 해시태그 형식으로 변환
        const formatted = cleaned.startsWith("#") ? cleaned : `#${cleaned.replace(/\s+/g, "")}`;
        listItems.push(formatted);
      }
    }
    return listItems.slice(0, 5);
  };

  // 4. 리스트 아이템 파싱 헬퍼 (해시태그 변환 없이 순수 문장)
  const parseGoalList = (sectionRaw: string | null): string[] => {
    if (!sectionRaw) return [];
    const lines = sectionRaw.split("\n");
    const listItems: string[] = [];
    for (const line of lines) {
      const cleaned = line.replace(/^[\s*\-•\d.]+\s*/, "").trim();
      if (cleaned.length > 0) {
        listItems.push(cleaned);
      }
    }
    return listItems.slice(0, 5);
  };

  // 잘한 점 (강점)
  const strengthsRaw = extractSection([
    "잘한\\s*점",
    "강점",
    "칭찬(?:할\\s*점)?",
    "우수\\s*습관",
  ]);
  const parsedStrengths = parseTagsOrList(strengthsRaw);

  // 개선할 점 (개선점)
  const improvementsRaw = extractSection([
    "개선할\\s*점",
    "개선점",
    "보완할\\s*점",
    "아쉬운\\s*점",
    "도전\\s*과제",
  ]);
  const parsedImprovements = parseTagsOrList(improvementsRaw);

  // 다음 달 목표
  const goalsRaw = extractSection([
    "다음\\s*달\\s*목표",
    "다음\\s*달\\s*실천\\s*과제",
    "목표",
    "실천\\s*과제",
    "추천\\s*액션",
  ]);
  const parsedGoals = parseGoalList(goalsRaw);

  return {
    aiLetter: aiLetter || fallback.aiLetter,
    mindfulnessInsight: mindfulnessRaw || fallback.mindfulnessInsight,
    strengths: parsedStrengths.length > 0 ? parsedStrengths : fallback.strengths,
    improvements:
      parsedImprovements.length > 0 ? parsedImprovements : fallback.improvements,
    nextMonthGoals:
      parsedGoals.length > 0 ? parsedGoals : fallback.nextMonthGoals,
  };
}
