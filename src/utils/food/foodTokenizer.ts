/**
 * 음식 수식어/접두어 사전 (Modifier Dictionary)
 */
export const FOOD_MODIFIER_DICTIONARY = new Set([
  "고추",
  "매운",
  "치즈",
  "국물",
  "로제",
  "짜장",
  "수제",
  "마라",
  "크림",
  "불",
  "대파",
  "직화",
  "바삭한",
  "얼큰한",
  "달콤한",
  "훈제",
  "양념",
  "간장",
  "후라이드",
  "양념반",
]);

/**
 * 수량/단위 정규식 패턴 (Quantity Pattern)
 */
export const QUANTITY_PATTERN =
  /^(\d+(\.\d+)?)(인분|g|gram|개|그릇|공기|조각|줄|잔|캔|병)$/i;

/**
 * 토큰 분석 결과 구조체
 */
export interface FoodTokenAnalysisResult {
  rawName: string;
  modifiers: string[];
  quantity?: string;
  coreFoodName: string;
  normalizedName: string;
  tokens: string[];
}

/**
 * 음식 원본 이름을 토큰화하고 정규화된 키워드를 추출합니다.
 * 예: '매운 수제 치즈 닭갈비 2인분' ➔ modifiers: ['매운', '수제', '치즈'], quantity: '2인분', coreFoodName: '닭갈비'
 * @param rawName 원본 음식 이름
 * @returns 토큰 분석 결과
 */
export function tokenizeFoodName(rawName: string): FoodTokenAnalysisResult {
  if (!rawName || !rawName.trim()) {
    return {
      rawName: "",
      modifiers: [],
      coreFoodName: "",
      normalizedName: "",
      tokens: [],
    };
  }

  const cleanRaw = rawName.trim();
  const rawTokens = cleanRaw.split(/\s+/);

  const modifiers: string[] = [];
  let quantity: string | undefined = undefined;
  const coreTokens: string[] = [];

  for (const token of rawTokens) {
    if (QUANTITY_PATTERN.test(token)) {
      quantity = token;
    } else if (FOOD_MODIFIER_DICTIONARY.has(token)) {
      modifiers.push(token);
    } else {
      coreTokens.push(token);
    }
  }

  let coreFoodName = coreTokens.join(" ");
  if (!coreFoodName) {
    coreFoodName = rawTokens.filter((t) => !QUANTITY_PATTERN.test(t)).join(" ");
  }

  return {
    rawName: cleanRaw,
    modifiers,
    quantity,
    coreFoodName,
    normalizedName: coreFoodName || cleanRaw,
    tokens: rawTokens,
  };
}
