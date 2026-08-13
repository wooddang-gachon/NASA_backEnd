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
async function testAllKakaoTalkImages() {
  const imageDir = path.join(process.cwd(), "image");
  const files = fs.readdirSync(imageDir);

  const kakaoFiles = files.filter(
    (f) =>
      f.startsWith("KakaoTalk_Photo_") &&
      (f.endsWith(".jpeg") || f.endsWith(".jpg")),
  );

  console.log(`====================================================`);
  console.log(`Found ${kakaoFiles.length} KakaoTalk photo(s) to test.`);
  console.log(`====================================================`);

  for (let i = 0; i < kakaoFiles.length; i++) {
    const filename = kakaoFiles[i];
    if (!filename) continue;

    const inputPath = path.join(imageDir, filename);
    const parsedName = path.parse(filename).name;

    console.log(`\n[${i + 1}/${kakaoFiles.length}] Testing Image: ${filename}`);

    try {
      const inputBuffer = fs.readFileSync(inputPath);
      const metadata = await sharp(inputBuffer).metadata();
      console.log(`  Dimension: ${metadata.width} x ${metadata.height}`);

      // 1. 엣지 추출 및 저장
      const edgeBuffer = await extractImageEdges(inputBuffer);
      const edgeOutputPath = path.join(imageDir, `${parsedName}_edge.png`);
      fs.writeFileSync(edgeOutputPath, edgeBuffer);

      // 2. 객체 Bounding Box 탐지
      const boxes = await detectObjectBoundingBoxes(inputBuffer, {
        minAreaRatio: 0.5,
        maxAreaPercent: 90,
        mergeGapRatio: 3,
      });

      console.log(`  Detected Objects Count: ${boxes.length}`);
      boxes.forEach((b, idx) => {
        console.log(
          `    #${idx + 1}: x=${b.x}, y=${b.y}, w=${b.width}, h=${b.height}, area=${b.area}`,
        );
      });

      // 3. Bounding Box 오버레이 생성 및 저장
      if (metadata.width && metadata.height) {
        const rectSvgs = boxes
          .map(
            (b) =>
              `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="red" stroke-width="4" />`,
          )
          .join("\n");

        const svgOverlay = Buffer.from(
          `<svg width="${metadata.width}" height="${metadata.height}">${rectSvgs}</svg>`,
        );

        const bboxBuffer = await sharp(inputBuffer)
          .composite([{ input: svgOverlay, top: 0, left: 0 }])
          .toBuffer();

        const bboxOutputPath = path.join(imageDir, `${parsedName}_bbox.png`);
        fs.writeFileSync(bboxOutputPath, bboxBuffer);
        console.log(`  Saved: ${parsedName}_bbox.png & ${parsedName}_edge.png`);
      }
    } catch (err) {
      console.error(`  Error processing ${filename}:`, err);
    }
  }

  console.log(`\n====================================================`);
  console.log(`All ${kakaoFiles.length} KakaoTalk images test completed!`);
  console.log(`====================================================`);
}

testAllKakaoTalkImages().catch((err) => {
  console.error("Batch test failed:", err);
});
