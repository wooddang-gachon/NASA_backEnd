import LocalVisionService from "../../../services/localVisionService";
import * as ort from "onnxruntime-node";
import sharp from "sharp";
import fs from "fs";

jest.mock("onnxruntime-node");
jest.mock("sharp");
jest.mock("fs");

describe("LocalVisionService", () => {
  let service: LocalVisionService;
  let mockSession: any;

  beforeEach(() => {
    service = new LocalVisionService();
    mockSession = {
      run: jest.fn().mockResolvedValue({
        output0: {
          data: new Float32Array(84 * 8400).fill(0.1),
          dims: [1, 84, 8400],
        },
      }),
    };
    (ort.InferenceSession.create as jest.Mock).mockResolvedValue(mockSession);
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const mockSharpObj = {
      metadata: jest.fn().mockResolvedValue({ width: 1000, height: 1000 }),
      resize: jest.fn().mockReturnThis(),
      removeAlpha: jest.fn().mockReturnThis(),
      raw: jest.fn().mockReturnThis(),
      toBuffer: jest
        .fn()
        .mockResolvedValue(Buffer.from(new Uint8Array(640 * 640 * 3))),
    };
    (sharp as unknown as jest.Mock).mockReturnValue(mockSharpObj);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should detect food objects successfully", async () => {
    const res = await service.detectFoodObjects(Buffer.from("test"));
    expect(ort.InferenceSession.create).toHaveBeenCalled();
    expect(res).toBeInstanceOf(Array);
  });

  it("should throw if ONNX model is not found", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    await expect(
      service.detectFoodObjects(Buffer.from("test")),
    ).rejects.toThrow("ONNX model not found");
  });

  it("should throw if inference process fails", async () => {
    mockSession.run.mockRejectedValue(new Error("infer error"));
    await expect(
      service.detectFoodObjects(Buffer.from("test")),
    ).rejects.toThrow("infer error");
  });

  it("should throw if sharp processing fails", async () => {
    const mockSharpObj = sharp() as unknown as any;
    mockSharpObj.metadata.mockRejectedValue(new Error("sharp error"));
    await expect(
      service.detectFoodObjects(Buffer.from("test")),
    ).rejects.toThrow("sharp error");
  });
});
