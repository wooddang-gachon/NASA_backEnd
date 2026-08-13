import { compressImageFile } from "../../utils/imageCompressor";
import path from "path";
import fs from "fs";

/**
 *
 */
async function testCompression() {
  const originalPath = path.join(process.cwd(), "image", "test.png");
  const originalSize = fs.statSync(originalPath).size;

  console.log("📷 [원본 이미지 파일]:", originalPath);
  console.log("📦 [원본 파일 용량]:", (originalSize / 1024).toFixed(2), "KB");

  const compressedPath = await compressImageFile(originalPath, undefined, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 60,
    format: "jpeg",
  });

  const compressedSize = fs.statSync(compressedPath).size;
  console.log("⚡ [압축 결과 이미지 파일]:", compressedPath);
  console.log("📦 [압축 파일 용량]:", (compressedSize / 1024).toFixed(2), "KB");
  console.log(
    "📉 [용량 절감율]:",
    (((originalSize - compressedSize) / originalSize) * 100).toFixed(1) + "%",
  );

  // 테스트 후 생성 파일 정리
  if (fs.existsSync(compressedPath)) {
    fs.unlinkSync(compressedPath);
  }
}

testCompression().catch(console.error);
