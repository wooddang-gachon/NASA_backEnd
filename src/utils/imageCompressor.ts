import sharp from "sharp";
import path from "path";
import fs from "fs";
import Logger from "../loaders/logger";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1 ~ 100 (기본값: 60)
  format?: "jpeg" | "webp" | "png";
}

/**
 * 이미지 바이너리 Buffer를 저화질/경량화 리사이즈 압축
 * @param inputBuffer 원본 이미지 버퍼
 * @param options 압축 옵션
 * @returns 압축된 이미지 버퍼
 */
export async function compressImageBuffer(
  inputBuffer: Buffer,
  options: CompressionOptions = {},
): Promise<Buffer> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 60,
    format = "jpeg",
  } = options;

  try {
    let pipeline = sharp(inputBuffer).resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (format === "jpeg") {
      pipeline = pipeline.jpeg({ quality });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else if (format === "png") {
      pipeline = pipeline.png({ quality: Math.min(quality, 80) });
    }

    return await pipeline.toBuffer();
  } catch (error) {
    Logger.error(`[ImageCompressor] Failed to compress image buffer: ${error}`);
    throw error;
  }
}

/**
 * 로컬 이미지 파일을 읽어 저화질/경량화 압축 파일로 생성
 * @param inputPath 원본 이미지 파일 경로
 * @param outputPath 압축된 이미지를 저장할 경로
 * @param options 압축 옵션
 * @returns 생성된 압축 이미지 파일의 경로
 */
export async function compressImageFile(
  inputPath: string,
  outputPath?: string,
  options: CompressionOptions = {},
): Promise<string> {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`압축할 이미지 파일을 찾을 수 없습니다: ${inputPath}`);
  }

  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 60,
    format = "jpeg",
  } = options;

  if (!outputPath) {
    const parsed = path.parse(inputPath);
    outputPath = path.join(parsed.dir, `${parsed.name}_compressed.${format}`);
  }

  try {
    let pipeline = sharp(inputPath).resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (format === "jpeg") {
      pipeline = pipeline.jpeg({ quality });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else if (format === "png") {
      pipeline = pipeline.png({ quality: Math.min(quality, 80) });
    }

    await pipeline.toFile(outputPath);
    Logger.info(
      `[ImageCompressor] Image successfully compressed: ${inputPath} -> ${outputPath}`,
    );
    return outputPath;
  } catch (error) {
    Logger.error(
      `[ImageCompressor] Failed to compress image file ${inputPath}: ${error}`,
    );
    throw error;
  }
}
