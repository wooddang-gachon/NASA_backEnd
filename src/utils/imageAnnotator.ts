import sharp from "sharp";
import fs from "fs";
import path from "path";
import Logger from "../loaders/logger";

export interface BoundingBoxInput {
  foodName?: string;
  className?: string;
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 이미지 상에 감지된 Bounding Box 좌표와 라벨을 시각화하여 테스트용 디버그 이미지(_debug.jpg)로 추가 저장합니다.
 * @param imagePath 원본 이미지 파일 경로
 * @param items 렌더링할 Bounding Box 정보 배열
 * @returns 저장된 디버그 이미지의 경로 또는 실패 시 null
 */
export async function drawBoundingBoxesAndSave(
  imagePath: string,
  items: BoundingBoxInput[],
): Promise<string | null> {
  try {
    if (!fs.existsSync(imagePath)) {
      Logger.warn(`[ImageAnnotator] Image file not found: ${imagePath}`);
      return null;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const metadata = await sharp(imageBuffer).metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 600;

    const svgElements: string[] = [];

    for (const item of items) {
      const box = item.boundingBox || item.bbox;
      if (!box) continue;

      const { x, y, width, height } = box;
      const label = item.foodName || item.className || "Food";
      const confStr = item.confidence
        ? ` (${(item.confidence * 100).toFixed(0)}%)`
        : "";

      // 네모 상자 (빨간색 테두리)
      svgElements.push(
        `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#FF0000" stroke-width="4" />`,
      );

      // 라벨 배경 (빨간색 투명 레이어) & 흰색 텍스트
      const textX = Math.max(x + 4, 4);
      const textY = Math.max(y - 8, 18);
      const labelBgY = Math.max(y - 25, 0);

      svgElements.push(
        `<rect x="${x}" y="${labelBgY}" width="${Math.min(width, 180)}" height="24" fill="#FF0000" opacity="0.8" />`,
      );
      svgElements.push(
        `<text x="${textX}" y="${textY}" fill="#FFFFFF" font-size="16" font-weight="bold" font-family="sans-serif">${label}${confStr}</text>`,
      );
    }

    if (svgElements.length === 0) {
      Logger.info(`[ImageAnnotator] No bounding box items provided to draw.`);
      return null;
    }

    const svgOverlay = `<svg width="${imgWidth}" height="${imgHeight}">${svgElements.join("")}</svg>`;

    const parsedPath = path.parse(imagePath);
    const debugFilePath = path.join(
      parsedPath.dir,
      `${parsedPath.name}_debug${parsedPath.ext}`,
    );

    await sharp(imageBuffer)
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .toFile(debugFilePath);

    Logger.info(
      `[ImageAnnotator] Saved debug image with bounding boxes to: ${debugFilePath}`,
    );
    return debugFilePath;
  } catch (error) {
    Logger.error(`[ImageAnnotator] Failed to draw bounding boxes: ${error}`);
    return null;
  }
}
