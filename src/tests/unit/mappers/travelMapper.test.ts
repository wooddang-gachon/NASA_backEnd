import { TravelMapper } from "../../../mappers/travelMapper";
describe("travelMapper", () => {
  it("toStartApiResponse", () => {
    const res = TravelMapper.toStartApiResponse(
      { id: "1", status: "ok" },
      "2",
      10,
      { id: "3", recommendations: "A\nB" } as any,
    );
    expect(res.status).toBe("ok");
  });
  it("toTravelStateResponse", () => {
    const res = TravelMapper.toTravelStateResponse(
      { current_fuel: 10 } as any,
      [],
      10,
      { planet_type: "MEAL" } as any,
      [{ planet_type: "MEAL", completed_at: new Date() } as any],
    );
    expect(res.currentFuel).toBe(10);
  });
  it("toTravelResultDetailInfo", () => {
    const res = TravelMapper.toTravelResultDetailInfo({
      id: "1",
      recommendations: "A\nB",
      createdAt: "date",
    } as any);
    expect(res.reportId).toBe("1");

    const res2 = TravelMapper.toTravelResultDetailInfo({
      id: "1",
      recommendations: ["A"],
      createdAt: new Date(),
    } as any);
    expect(res2.reportId).toBe("1");

    const res3 = TravelMapper.toStartApiResponse(
      { id: "1", status: "ok" },
      "2",
      10,
      { id: "3", recommendations: ["A"] } as any,
    );
    expect(res3.status).toBe("ok");
  });
});
