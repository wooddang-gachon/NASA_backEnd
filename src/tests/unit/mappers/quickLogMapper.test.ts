import { QuickLogMapper } from "../../../mappers/quickLogMapper";

describe("quickLogMapper", () => {
  it("toCreateInput covers ?? null branches", () => {
    const res1 = QuickLogMapper.toCreateInput(
      1,
      { category: "WATER" } as any,
      10,
    );
    expect(res1.amount).toBeNull();

    const res2 = QuickLogMapper.toCreateInput(
      1,
      {
        category: "WATER",
        amount: 1,
        emotionType: "HAPPY",
        journalContent: "H",
        durationMinutes: 10,
      } as any,
      10,
    );
    expect(res2.amount).toBe(1);
  });

  it("toApiResponse covers created_at branch", () => {
    const res1 = QuickLogMapper.toApiResponse(
      { id: BigInt(1), category: "WATER", earned_fuel: 10 } as any,
      100,
    );
    expect(res1.createdAt).toBeDefined();

    const res2 = QuickLogMapper.toApiResponse(
      {
        id: BigInt(1),
        category: "WATER",
        earned_fuel: 10,
        created_at: new Date(),
      } as any,
      100,
    );
    expect(res2.createdAt).toBeDefined();
  });
});
