import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  detectObjectBoundingBoxes,
  extractImageEdges,
} from "../../utils/food/objectDetector";

/**
 *
 */
async function processSampleImage() {
  const imageDir = path.join(process.cwd(), "image");
  const inputPath = path.join(imageDir, "test.png");

  if (!fs.existsSync(inputPath)) {
    console.error("test.png 파일을 찾을 수 없습니다:", inputPath);
    return;
  }

  console.log(`==========================================`);
  console.log(`[Processing Sample Image]: ${inputPath}`);
  const inputBuffer = fs.readFileSync(inputPath);

  const metadata = await sharp(inputBuffer).metadata();
  console.log(`[Image Dimension]: ${metadata.width} x ${metadata.height}`);

  // 1. 외곽선(Edge) 추출 및 저장 (test_edge.png)
  const edgeBuffer = await extractImageEdges(inputBuffer);
  const edgeOutputPath = path.join(imageDir, "test_edge.png");
  fs.writeFileSync(edgeOutputPath, edgeBuffer);
  console.log(`[Saved Edge Image]: ${edgeOutputPath}`);

  // 2. Otsu 이진화 기반 객체 Bounding Box 좌표 탐지 (test_bbox.png)
  const boxes = await detectObjectBoundingBoxes(inputBuffer, {
    minAreaRatio: 0.5,
    maxAreaPercent: 90,
  });

  console.log(`[Detected Objects Count]: ${boxes.length}`);
  console.log(`[Bounding Box Details]:`);
  boxes.forEach((box, index) => {
    console.log(
      `  Object #${index + 1}: Position (x=${box.x}, y=${box.y}), Size (${box.width}x${box.height}), Pixel Area (${box.area})`,
    );
  });

  // 3. Bounding Box를 원본 이미지 위에 빨간색 상자로 렌더링
  if (metadata.width && metadata.height) {
    const rectSvgs = boxes
      .map(
        (b) =>
          `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="red" stroke-width="2" />`,
      )
      .join("\n");

    const svgOverlay = Buffer.from(
      `<svg width="${metadata.width}" height="${metadata.height}">${rectSvgs}</svg>`,
    );

    const bboxBuffer = await sharp(inputBuffer)
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .toBuffer();

    const bboxOutputPath = path.join(imageDir, "test_bbox.png");
    fs.writeFileSync(bboxOutputPath, bboxBuffer);
    console.log(`[Saved Bounding Box Overlay Image]: ${bboxOutputPath}`);
  }
  console.log(`==========================================`);
}

processSampleImage().catch((err) => {
  console.error("Error processing sample image:", err);
});
