import request from "supertest";
import { getTestApp } from "../setup/app";
import express from "express";

describe("건강 인사이트 & AI 리포트 API 통합 테스트 (RPT Module)", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await getTestApp();
  });

  describe("웰니스 대시보드 요약 조회 기능", () => {
    it("[성공 사례] GET /api/dashboard/summary - 대시보드 주간 통계 요약 조회 성공", async () => {
      const res = await request(app).get("/api/v1/dashboard/summary");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.calorieTrends)).toBe(true);
      expect(res.body.data).toHaveProperty("nutritionBalance");
    });
  });

  describe("AI 리포트 단일 통합 조회 기능", () => {
    it("[성공 사례] GET /api/v1/planet-travel/reports/:reportId - AI 별여행 리포트 상세 조회 또는 진행상태 조회", async () => {
      // 존재하지 않는 reportId 요청 시 404
      const notFoundRes = await request(app).get(
        "/api/v1/planet-travel/reports/non_existent_report_id",
      );
      expect(notFoundRes.status).toBe(404);
      expect(notFoundRes.body.code).toBe("NOT_FOUND");
    });
  });
});
