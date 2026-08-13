import sharp from "sharp";
import Logger from "../../loaders/logger";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

export interface DetectionOptions {
  threshold?: number; // 0~255 (지정하지 않으면 자동 Otsu 임계값 적용)
  minAreaRatio?: number; // 전체 면적 대비 최소 객체 비율 (%) (기본값: 0.5%)
  maxAreaPercent?: number; // 전체 이미지 면적 대비 최대 객체 면적 비율 (%) (기본값: 90%)
  mergeGapRatio?: number; // 이미지 너비 대비 근접 박스 병합 간격 비율 (%) (기본값: 3%)
  analysisWidth?: number; // 내부 분석용 다운스케일링 너비 (기본값: 800px)
}

/**
 * 흑백 픽셀 히스토그램을 기반으로 Otsu 이진화 최적 임계값을 계산합니다.
 * @param data 흑백 이미지 데이터 버퍼
 * @returns Otsu 이진화 최적 임계값 (0~255)
 */
function calculateOtsuThreshold(data: Uint8Array): number {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    if (val !== undefined) {
      histogram[val] = (histogram[val] ?? 0) + 1;
    }
  }

  const total = data.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * (histogram[t] ?? 0);
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    const count = histogram[t] ?? 0;
    wB += count;
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * count;
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * 겹치거나 근접한 거리(gap) 내의 Bounding Box들을 하나의 큰 박스로 통합/병합합니다.
 * @param boxes 병합할 Bounding Box 배열
 * @param gap 박스를 병합할 최대 거리 픽셀 (기본값: 15)
 * @returns 병합이 완료된 Bounding Box 배열
 */
export function mergeBoundingBoxes(
  boxes: BoundingBox[],
  gap: number = 15,
): BoundingBox[] {
  if (boxes.length <= 1) return boxes;

  let mergedList = [...boxes];
  let hasMerged = true;

  while (hasMerged) {
    hasMerged = false;
    const nextList: BoundingBox[] = [];
    const used = new Array<boolean>(mergedList.length).fill(false);

    for (let i = 0; i < mergedList.length; i++) {
      if (used[i]) continue;
      const firstBox = mergedList[i];
      if (!firstBox) continue;

      let current: BoundingBox = { ...firstBox };

      for (let j = i + 1; j < mergedList.length; j++) {
        if (used[j]) continue;
        const other = mergedList[j];
        if (!other) continue;

        const overlapX =
          current.x - gap <= other.x + other.width &&
          current.x + current.width + gap >= other.x;
        const overlapY =
          current.y - gap <= other.y + other.height &&
          current.y + current.height + gap >= other.y;

        if (overlapX && overlapY) {
          const minX = Math.min(current.x, other.x);
          const minY = Math.min(current.y, other.y);
          const maxX = Math.max(
            current.x + current.width,
            other.x + other.width,
          );
          const maxY = Math.max(
            current.y + current.height,
            other.y + other.height,
          );

          current = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            area: current.area + other.area,
          };

          used[j] = true;
          hasMerged = true;
        }
      }

      nextList.push(current);
      used[i] = true;
    }

    mergedList = nextList;
  }

  return mergedList;
}

/**
 * [전통 이미지 처리 알고리즘]
 * 고해상도 실사 사진에 대해 내부 다운스케일링 + Otsu 이진화 + 연결 성분 분석 + 박스 병합을 수행하여
 * 원본 이미지 비율에 맞는 Bounding Box 좌표들을 탐지합니다.
 * @param inputBuffer 입력 이미지 바이너리 버퍼
 * @param options 탐지 옵션
 * @returns 감지된 Bounding Box 배열
 */
export async function detectObjectBoundingBoxes(
  inputBuffer: Buffer,
  options: DetectionOptions = {},
): Promise<BoundingBox[]> {
  const {
    minAreaRatio = 0.5,
    maxAreaPercent = 90,
    mergeGapRatio = 3,
    analysisWidth = 800,
  } = options;

  try {
    const origMetadata = await sharp(inputBuffer).metadata();
    const origWidth = origMetadata.width || 800;
    const origHeight = origMetadata.height || 600;

    // 고해상도 사진의 노이즈 감소 및 속도 향상을 위한 분석용 다운스케일링
    const scaleFactor =
      origWidth > analysisWidth ? analysisWidth / origWidth : 1;
    const targetWidth = Math.round(origWidth * scaleFactor);
    const targetHeight = Math.round(origHeight * scaleFactor);

    const { data, info } = await sharp(inputBuffer)
      .resize(targetWidth, targetHeight, { fit: "inside" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const totalArea = width * height;

    const minAreaPixels = (totalArea * minAreaRatio) / 100;
    const mergeGapPixels = Math.max(
      5,
      Math.round((width * mergeGapRatio) / 100),
    );

    const targetThreshold =
      options.threshold !== undefined
        ? options.threshold
        : calculateOtsuThreshold(data);

    const visited = new Uint8Array(width * height);
    const rawBoxes: BoundingBox[] = [];

    let sumVal = 0;
    for (let i = 0; i < data.length; i++) {
      sumVal += data[i] ?? 0;
    }
    const avgBrightness = sumVal / (data.length || 1);
    const isDarkBackground = avgBrightness < 128;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const val = data[index] ?? 0;

        const isForeground = isDarkBackground
          ? val >= targetThreshold
          : val < targetThreshold;

        if (visited[index] || !isForeground) {
          continue;
        }

        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let pixelCount = 0;

        const queue: number[] = [index];
        visited[index] = 1;

        while (queue.length > 0) {
          const curr = queue.pop()!;
          const cy = Math.floor(curr / width);
          const cx = curr % width;
          pixelCount++;

          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          const neighbors = [
            cy > 0 ? (cy - 1) * width + cx : -1,
            cy < height - 1 ? (cy + 1) * width + cx : -1,
            cx > 0 ? cy * width + (cx - 1) : -1,
            cx < width - 1 ? cy * width + (cx + 1) : -1,
          ];

          for (const nIdx of neighbors) {
            if (nIdx !== -1 && !visited[nIdx]) {
              const nVal = data[nIdx] ?? 0;
              const nIsForeground = isDarkBackground
                ? nVal >= targetThreshold
                : nVal < targetThreshold;

              if (nIsForeground) {
                visited[nIdx] = 1;
                queue.push(nIdx);
              }
            }
          }
        }

        const boxWidth = maxX - minX + 1;
        const boxHeight = maxY - minY + 1;

        if (pixelCount >= minAreaPixels) {
          rawBoxes.push({
            x: minX,
            y: minY,
            width: boxWidth,
            height: boxHeight,
            area: pixelCount,
          });
        }
      }
    }

    // 근접 박스 병합
    let finalBoxes = rawBoxes;
    if (mergeGapPixels > 0) {
      finalBoxes = mergeBoundingBoxes(rawBoxes, mergeGapPixels);
    }

    // 원본 해상도로 좌표 스케일 복원
    const invScale = 1 / scaleFactor;
    const rescaledBoxes: BoundingBox[] = finalBoxes
      .map((b) => {
        const rx = Math.round(b.x * invScale);
        const ry = Math.round(b.y * invScale);
        const rw = Math.round(b.width * invScale);
        const rh = Math.round(b.height * invScale);

        return {
          x: rx,
          y: ry,
          width: Math.min(rw, origWidth - rx),
          height: Math.min(rh, origHeight - ry),
          area: Math.round(b.area * invScale * invScale),
        };
      })
      .filter((b) => {
        const areaPercent =
          ((b.width * b.height) / (origWidth * origHeight)) * 100;
        return areaPercent <= maxAreaPercent;
      });

    Logger.info(
      `[ObjectDetector] Detected ${rescaledBoxes.length} objects for ${origWidth}x${origHeight} image (Scale: ${scaleFactor.toFixed(2)})`,
    );
    return rescaledBoxes;
  } catch (error) {
    Logger.error(
      `[ObjectDetector] Failed to detect object bounding boxes: ${error}`,
    );
    throw error;
  }
}

/**
 * 라플라시안 컨볼루션 필터를 적용하여 이미지의 외곽선(Edge)을 추출한 Buffer를 반환합니다.
 * @param inputBuffer 원본 이미지 버퍼
 * @returns 외곽선이 추출된 이미지 버퍼
 */
export async function extractImageEdges(inputBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(inputBuffer)
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      })
      .toBuffer();
  } catch (error) {
    Logger.error(`[ObjectDetector] Failed to extract image edges: ${error}`);
    throw error;
  }
}
