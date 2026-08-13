import { tokenizeFoodName } from "../../../utils/food/foodTokenizer";

describe("foodTokenizer", () => {
  describe("tokenizeFoodName", () => {
    it("should return empty result for empty string", () => {
      const result = tokenizeFoodName("");
      expect(result.rawName).toBe("");
      expect(result.modifiers).toEqual([]);
      expect(result.coreFoodName).toBe("");
      expect(result.quantity).toBeUndefined();
    });

    it("should return empty result for whitespace string", () => {
      const result = tokenizeFoodName("   ");
      expect(result.rawName).toBe("");
      expect(result.modifiers).toEqual([]);
      expect(result.coreFoodName).toBe("");
      expect(result.quantity).toBeUndefined();
    });

    it("should extract core food name without modifiers or quantity", () => {
      const result = tokenizeFoodName("떡볶이");
      expect(result.rawName).toBe("떡볶이");
      expect(result.modifiers).toEqual([]);
      expect(result.coreFoodName).toBe("떡볶이");
      expect(result.normalizedName).toBe("떡볶이");
      expect(result.quantity).toBeUndefined();
    });

    it("should extract multiple word core food name", () => {
      const result = tokenizeFoodName("간장 계란 밥");
      // "간장" is in the modifier dictionary! Let's see how it behaves.
      // Modifiers: "간장"
      // Core: "계란 밥"
      expect(result.modifiers).toEqual(["간장"]);
      expect(result.coreFoodName).toBe("계란 밥");
      expect(result.normalizedName).toBe("계란 밥");
      expect(result.quantity).toBeUndefined();
    });

    it("should extract modifiers correctly", () => {
      const result = tokenizeFoodName("매운 수제 치즈 닭갈비");
      expect(result.modifiers).toEqual(["매운", "수제", "치즈"]);
      expect(result.coreFoodName).toBe("닭갈비");
      expect(result.quantity).toBeUndefined();
    });

    it("should extract integer quantity correctly", () => {
      const result = tokenizeFoodName("김치볶음밥 2인분");
      expect(result.modifiers).toEqual([]);
      expect(result.coreFoodName).toBe("김치볶음밥");
      expect(result.quantity).toBe("2인분");
    });

    it("should extract float quantity correctly", () => {
      const result = tokenizeFoodName("피자 1.5조각");
      expect(result.modifiers).toEqual([]);
      expect(result.coreFoodName).toBe("피자");
      expect(result.quantity).toBe("1.5조각");
    });

    it("should handle various quantity units", () => {
      const units = [
        "g",
        "gram",
        "개",
        "그릇",
        "공기",
        "조각",
        "줄",
        "잔",
        "캔",
        "병",
      ];
      units.forEach((unit) => {
        const result = tokenizeFoodName(`테스트음식 1${unit}`);
        expect(result.quantity).toBe(`1${unit}`);
        expect(result.coreFoodName).toBe("테스트음식");
      });
    });

    it("should extract modifiers and quantity together", () => {
      const result = tokenizeFoodName("얼큰한 마라 국물 짬뽕 2그릇");
      expect(result.modifiers).toEqual(["얼큰한", "마라", "국물"]);
      expect(result.coreFoodName).toBe("짬뽕");
      expect(result.quantity).toBe("2그릇");
    });

    it("should fallback to filtering out only quantity if all tokens are modifiers", () => {
      // "치즈 로제" are both modifiers.
      const result = tokenizeFoodName("치즈 로제 1인분");
      expect(result.modifiers).toEqual(["치즈", "로제"]);
      // Because coreTokens would be empty, it falls back to rawTokens without quantity
      expect(result.coreFoodName).toBe("치즈 로제");
      expect(result.quantity).toBe("1인분");
    });

    it("should handle unrecognized quantity format as part of core name", () => {
      // "2인" doesn't match the \d+(인분|g|...) exactly (missing '분')
      const result = tokenizeFoodName("떡볶이 2인");
      expect(result.quantity).toBeUndefined();
      expect(result.coreFoodName).toBe("떡볶이 2인");
    });

    it("should ignore punctuation currently and treat it as part of the word (limitation/current behavior)", () => {
      const result = tokenizeFoodName("매운, 떡볶이!");
      // "매운," will not match "매운" in the dictionary due to the comma.
      expect(result.modifiers).toEqual([]);
      expect(result.coreFoodName).toBe("매운, 떡볶이!");
    });
  });
});
