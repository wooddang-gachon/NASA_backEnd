import request from "supertest";
import { getTestApp } from "../setup/app";
import express from "express";
import fs from "fs";
import path from "path";

describe("로컬 이미지 업로드 API 통합 테스트 (UPL Module)", () => {
  let app: express.Application;
  const sampleImagePath = path.join(__dirname, "sample_test_image.png");

  beforeAll(async () => {
    app = await getTestApp();
    // 1x1 픽셀 샘플 PNG 파일 생성
    const dummyPngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
    fs.writeFileSync(sampleImagePath, dummyPngBuffer);
  });

  afterAll(() => {
    if (fs.existsSync(sampleImagePath)) {
      fs.unlinkSync(sampleImagePath);
    }
  });

  it("[성공 사례] POST /api/food-vision/scan - 파일 업로드 후 즉시 식단 비전 스캔 실행", async () => {
    const res = await request(app)
      .post("/api/v1/food-vision/scan")
      .field("mealType", "LUNCH")
      .attach("file", sampleImagePath);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("scanEngine");
    expect(res.body.data).toHaveProperty("detectedFoods");
    expect(res.body.data).toHaveProperty("imageId");
  });
});
