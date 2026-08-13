import express from "express";
import expressLoader from "./express";
import Logger from "./logger";
import { initPrisma } from "./prisma";
import jobsLoader from "../jobs";
import config from "../config";

// import "./events";
export default async ({ expressApp }: { expressApp: express.Application }) => {
  // 0. Database ORM 초기화
  initPrisma();
  Logger.info("✌️ Prisma Client loaded");

  // [NEW] 테스트 또는 로컬 Mock 환경일 경우 Mock 서비스 주입
  if (config.nodeEnv === "test" || process.env.USE_MOCK === "true") {
    const { Container } = await import("typedi");
    const AiService = (await import("../services/aiService")).default;
    const MockAiService = (await import("../services/mocks/mockAiService"))
      .default;
    const AuthService = (await import("../services/authService")).default;
    const MockAuthService = (await import("../services/mocks/mockAuthService"))
      .default;

    Container.set(AiService, Container.get(MockAiService));
    Container.set(AuthService, Container.get(MockAuthService));
    Logger.info(
      "⚠️ Test/Mock mode enabled: Injected Mock services for AI and Auth.",
    );
  }

  // 1. Express 기본 세팅, 라우터, Swagger 및 에러 핸들러 연동
  await expressLoader({ app: expressApp });
  Logger.info("✌️ Express base, routes and swagger configured");

  // 3. 백그라운드 스케줄러(Jobs) 가동 (테스트 환경 제외)
  if (config.nodeEnv !== "test") {
    await jobsLoader();
    Logger.info("✌️ Background jobs loaded");
  }
};
