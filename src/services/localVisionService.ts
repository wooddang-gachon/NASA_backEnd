import { Service } from "typedi";
import * as ort from "onnxruntime-node";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import Logger from "../loaders/logger";
import type { LocalDetectionResult } from "@/interfaces";

@Service()
export default class LocalVisionService {
  private session: ort.InferenceSession | null = null;
  private modelPath = path.join(process.cwd(), "models", "yolo", "best.onnx");

  /**
   * ONNX 런타임 세션 초기화 (싱글톤 방식 캐싱)
   * @returns InferenceSession 객체
   */
  private async getSession(): Promise<ort.InferenceSession> {
    if (!this.session) {
      if (!fs.existsSync(this.modelPath)) {
        throw new Error(
          `ONNX model not found at ${this.modelPath}. Please run 'yolo export model=best.pt format=onnx' first.`,
        );
      }
      Logger.info(
        `[LocalVisionService] Loading ONNX model from: ${this.modelPath}`,
      );
      this.session = await ort.InferenceSession.create(this.modelPath);
    }
    return this.session;
  }

  /**
   * 이미지 전처리 (640x640 Float32 NCHW Tensor)
   * @param buffer 전처리할 이미지의 바이너리 버퍼
   * @returns 변환된 텐서 및 원본 크기/스케일 정보를 포함한 객체
   */
  private async preprocessImage(buffer: Buffer) {
    const meta = await sharp(buffer).metadata();
    const origWidth = meta.width || 640;
    const origHeight = meta.height || 640;

    // YOLOv8 기본 입력 사이즈 640x640
    const TARGET_SIZE = 640;

    const rawRgb = await sharp(buffer)
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer();

    const float32Data = new Float32Array(1 * 3 * TARGET_SIZE * TARGET_SIZE);

    // NCHW 변환 및 정규화 (0~1)
    const channelSize = TARGET_SIZE * TARGET_SIZE;
    for (let i = 0; i < channelSize; i++) {
      float32Data[i] = (rawRgb[i * 3] ?? 0) / 255.0; // R
      float32Data[channelSize + i] = (rawRgb[i * 3 + 1] ?? 0) / 255.0; // G
      float32Data[channelSize * 2 + i] = (rawRgb[i * 3 + 2] ?? 0) / 255.0; // B
    }

    const tensor = new ort.Tensor("float32", float32Data, [
      1,
      3,
      TARGET_SIZE,
      TARGET_SIZE,
    ]);
    return {
      tensor,
      origWidth,
      origHeight,
      scaleX: origWidth / TARGET_SIZE,
      scaleY: origHeight / TARGET_SIZE,
    };
  }

  /**
   * IoU (Intersection over Union) 계산
   * @param box1 첫 번째 바운딩 박스
   * @param box2 두 번째 바운딩 박스
   * @returns IoU 점수
   */
  private calculateIoU(box1: number[], box2: number[]) {
    const x1 = Math.max(box1[0]!, box2[0]!);
    const y1 = Math.max(box1[1]!, box2[1]!);
    const x2 = Math.min(box1[2]!, box2[2]!);
    const y2 = Math.min(box1[3]!, box2[3]!);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = (box1[2]! - box1[0]!) * (box1[3]! - box1[1]!);
    const area2 = (box2[2]! - box2[0]!) * (box2[3]! - box2[1]!);

    return intersection / (area1 + area2 - intersection);
  }

  /**
   * Non-Maximum Suppression 및 좌표 복원
   * @param tensorData 추론 결과 텐서 데이터
   * @param dims 텐서 차원
   * @param scaleX x 스케일 비율
   * @param scaleY y 스케일 비율
   * @param confThresh 신뢰도 임계값
   * @param iouThresh NMS IoU 임계값
   * @returns 식별된 객체 정보 배열
   */
  private postprocess(
    tensorData: Float32Array,
    dims: readonly number[], // [batch, 4+classes, 8400]
    scaleX: number,
    scaleY: number,
    confThresh: number,
    iouThresh: number = 0.45,
  ): LocalDetectionResult[] {
    const numClasses = dims[1]! - 4; // 보통 84 - 4 = 80
    const numAnchors = dims[2]!; // 보통 8400

    const candidates: { box: number[]; score: number; classId: number }[] = [];

    // YOLOv8 출력 차원: [1, 4 + num_classes, 8400]
    for (let i = 0; i < numAnchors; i++) {
      let maxScore = 0;
      let classId = -1;

      // 클래스 중 가장 높은 점수 찾기
      for (let c = 0; c < numClasses; c++) {
        const score = tensorData[(4 + c) * numAnchors + i]!;
        if (score > maxScore) {
          maxScore = score;
          classId = c;
        }
      }

      if (maxScore > confThresh) {
        // x_center, y_center, w, h
        const xc = tensorData[0 * numAnchors + i]!;
        const yc = tensorData[1 * numAnchors + i]!;
        const w = tensorData[2 * numAnchors + i]!;
        const h = tensorData[3 * numAnchors + i]!;

        // x1, y1, x2, y2 변환
        const x1 = xc - w / 2;
        const y1 = yc - h / 2;
        const x2 = xc + w / 2;
        const y2 = yc + h / 2;

        candidates.push({ box: [x1, y1, x2, y2], score: maxScore, classId });
      }
    }

    // 신뢰도 기준 내림차순 정렬
    candidates.sort((a, b) => b.score - a.score);

    // 클래스 매핑
    const YOLO_CLASSES: Record<number, string> = {
      0: "고등어구이",
      1: "김밥",
      2: "김치볶음밥",
      3: "불고기",
      4: "삼겹살",
      5: "양념치킨",
    };

    // NMS 적용
    const finalResults: LocalDetectionResult[] = [];
    while (candidates.length > 0) {
      const current = candidates.shift()!;

      // 원본 스케일 복원
      const x1 = Math.max(0, current.box[0]! * scaleX);
      const y1 = Math.max(0, current.box[1]! * scaleY);
      const x2 = current.box[2]! * scaleX;
      const y2 = current.box[3]! * scaleY;

      finalResults.push({
        classId: current.classId,
        className:
          YOLO_CLASSES[current.classId] || `알수없는음식_${current.classId}`,
        confidence: current.score,
        bbox: {
          x: Math.round(x1),
          y: Math.round(y1),
          width: Math.round(x2 - x1),
          height: Math.round(y2 - y1),
        },
      });

      // IoU 체크하여 겹치는 박스 제거
      for (let i = candidates.length - 1; i >= 0; i--) {
        if (this.calculateIoU(current.box, candidates[i]!.box) > iouThresh) {
          candidates.splice(i, 1);
        }
      }
    }

    return finalResults;
  }

  /**
   * 로컬 YOLO ONNX 모델 기반 음식 객체 탐지
   * @param imageBuffer 탐지할 이미지 버퍼
   * @param confThreshold 적용할 신뢰도 임계값
   * @returns 탐지 결과 배열
   */
  public async detectFoodObjects(
    imageBuffer: Buffer,
    confThreshold = 0.6,
  ): Promise<LocalDetectionResult[]> {
    try {
      const session = await this.getSession();

      const { tensor, scaleX, scaleY } =
        await this.preprocessImage(imageBuffer);

      // 추론 수행
      const outputs = await session.run({ images: tensor });
      const outputName = Object.keys(outputs)[0]!;
      const outputTensor = outputs[outputName]!;

      // 후처리 (Bounding box 복원 및 NMS 필터링 적용)
      const results = this.postprocess(
        outputTensor.data as Float32Array,
        outputTensor.dims,
        scaleX,
        scaleY,
        confThreshold,
      );

      Logger.info(`[LocalVisionService] Detected ${results.length} objects.`);
      return results;
    } catch (error) {
      Logger.error(`[LocalVisionService] Detection failed: ${error}`);
      throw error;
    }
  }
}
