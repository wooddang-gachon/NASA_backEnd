import { getTestApp } from "../setup/app";
import request from "supertest";
import path from "path";
import fs from "fs";

/**
 *
 */
async function runRealTest() {
  const app = await getTestApp();
  const testImagePath = path.join(process.cwd(), "image", "test.png");

  console.log("📷 [실제 이미지 파일 정보]:", testImagePath);
  console.log("🚀 [실제 동작 테스트 1] POST /api/upload/image 호출 중...");
  const res1 = await request(app)
    .post("/api/v1/upload/image")
    .attach("file", testImagePath);

  console.log("✅ 업로드 응답 결과 (Status:", res1.status, "):");
  console.log(JSON.stringify(res1.body, null, 2));

  console.log(
    "\n🚀 [실제 동작 테스트 2] POST /api/food-vision/upload-and-scan 호출 중...",
  );
  const res2 = await request(app)
    .post("/api/v1/food-vision/upload-and-scan")
    .field("mealType", "LUNCH")
    .attach("file", testImagePath);

  console.log("✅ 업로드 & 스캔 응답 결과 (Status:", res2.status, "):");
  console.log(JSON.stringify(res2.body, null, 2));

  // uploads 폴더 확인
  const uploadsDir = path.join(process.cwd(), "uploads");
  const files = fs.readdirSync(uploadsDir);
  console.log("\n📂 [uploads 폴더 실제 파일 목록]:", files);

  process.exit(0);
}

runRealTest().catch((err) => {
  console.error("❌ 에러 발생:", err);
  process.exit(1);
});
