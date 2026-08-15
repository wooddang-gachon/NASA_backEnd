import { drawBoundingBoxesAndSave } from "../../../utils/imageAnnotator";
import sharp from "sharp";
import fs from "fs";

jest.mock("sharp");
jest.mock("fs");

describe("imageAnnotator", () => {
  let mockSharpObj: any;

  beforeEach(() => {
    mockSharpObj = {
      metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
      composite: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockResolvedValue({}),
    };
    (sharp as unknown as jest.Mock).mockReturnValue(mockSharpObj);
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from("image"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should draw bounding boxes and save", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const items = [
      {
        foodName: "Pizza",
        confidence: 0.95,
        boundingBox: { x: 10, y: 10, width: 100, height: 100 },
      },
      { className: "Burger", bbox: { x: 20, y: 20, width: 50, height: 50 } },
      { confidence: 0.8 }, // missing box, should be skipped
    ];
    const res = await drawBoundingBoxesAndSave("test.jpg", items);
    expect(res).toContain("test_debug.jpg");
    expect(mockSharpObj.composite).toHaveBeenCalled();
  });

  it("should return null if file does not exist", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const res = await drawBoundingBoxesAndSave("notfound.jpg", []);
    expect(res).toBeNull();
  });

  it("should return null if no items to draw", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const res = await drawBoundingBoxesAndSave("test.jpg", []);
    expect(res).toBeNull();
  });

  it("should catch and return null on error", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    mockSharpObj.metadata.mockRejectedValue(new Error("sharp error"));
    const res = await drawBoundingBoxesAndSave("test.jpg", [
      { boundingBox: { x: 0, y: 0, width: 10, height: 10 } },
    ]);
    expect(res).toBeNull();
  });
});
