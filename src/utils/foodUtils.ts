/**
 * 음식명 정제 시 제거할 대표 수식어/접두어 목록
 */
export const FOOD_MODIFIER_KEYWORDS = [
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
] as const;

/**
 * 음식 원본 이름에서 수식어를 제거하여 검색용 키워드를 정제합니다.
 * 예: '고추떡볶이' ➔ '떡볶이', '치즈돈까스' ➔ '돈까스'
 */
export function cleanFoodKeyword(rawName: string): string {
  if (!rawName) return "";
  const pattern = new RegExp(`(${FOOD_MODIFIER_KEYWORDS.join("|")})`, "g");
  return rawName.replace(pattern, "").trim();
}
