import {
  compressImageBuffer,
  compressImageFile,
} from "../../../utils/imageCompressor";
import sharp from "sharp";
import fs from "fs";
import path from "path";

jest.mock("sharp");
jest.mock("fs");

describe("imageCompressor", () => {
  let mockPipeline: any;

  beforeEach(() => {
    mockPipeline = {
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from("compressed")),
      toFile: jest.fn().mockResolvedValue({}),
    };
    (sharp as unknown as jest.Mock).mockReturnValue(mockPipeline);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("compressImageBuffer", () => {
    it("should compress jpeg buffer", async () => {
      const buf = Buffer.from("test");
      const res = await compressImageBuffer(buf, {
        format: "jpeg",
        quality: 50,
      });
      expect(mockPipeline.jpeg).toHaveBeenCalledWith({ quality: 50 });
      expect(res).toBeInstanceOf(Buffer);
    });

    it("should compress webp buffer", async () => {
      const buf = Buffer.from("test");
      await compressImageBuffer(buf, { format: "webp" });
      expect(mockPipeline.webp).toHaveBeenCalled();
    });

    it("should compress png buffer", async () => {
      const buf = Buffer.from("test");
      await compressImageBuffer(buf, { format: "png", quality: 90 });
      expect(mockPipeline.png).toHaveBeenCalledWith({ quality: 80 }); // Math.min(quality, 80)
    });

    it("should throw error on failure", async () => {
      mockPipeline.toBuffer.mockRejectedValue(new Error("fail"));
      await expect(compressImageBuffer(Buffer.from("t"))).rejects.toThrow(
        "fail",
      );
    });
  });

  describe("compressImageFile", () => {
    it("should compress file and return output path", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const res = await compressImageFile("test.jpg", undefined, {
        format: "png",
      });
      expect(mockPipeline.toFile).toHaveBeenCalled();
      expect(res).toContain("test_compressed.png");
    });

    it("should throw if input file does not exist", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      await expect(compressImageFile("invalid.jpg")).rejects.toThrow(
        "찾을 수 없습니다",
      );
    });

    it("should throw error on sharp failure", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockPipeline.toFile.mockRejectedValue(new Error("fail"));
      await expect(compressImageFile("test.jpg")).rejects.toThrow("fail");
    });
  });
});
