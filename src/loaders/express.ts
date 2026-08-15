import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { RegisterRoutes } from "../build/routes";
import config from "../config";
import swaggerLoader from "./swagger";
import { globalErrorHandler } from "../api/middlewares/errorHandler";

import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import { traceIdMiddleware } from "../api/middlewares/traceId.middleware";
import Logger from "./logger";

export default ({ app }: { app: express.Application }) => {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.get("/status", (req: Request, res: Response) => {
    res.status(200).end();
  });
  app.head("/status", (req: Request, res: Response) => {
    res.status(200).end();
  });

  const whitelist = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://nasa-wellness.com",
  ];
  const corsOptions = {
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation: Not allowed by CORS"));
      }
    },
    credentials: true,
  };

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());

  // Trace ID 미들웨어 (요청별 컨텍스트 맵 생성)
  app.use(traceIdMiddleware);

  app.use("/uploads", express.static(uploadsDir));

  // TSOA Routes
  const apiRouter = express.Router();

  apiRouter.use(
    morgan("dev", {
      stream: {
        write: (message: string) => {
          Logger.info(message.trim(), { prefix: "HTTP" });
        },
      },
    }),
  );

  // 무차별 대입 공격 방지를 위한 Rate Limiter 설정
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 15분당 100회 요청 제한 (IP 기준)
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      code: "TOO_MANY_REQUESTS",
      message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      status: 429,
    },
  });

  apiRouter.use(apiLimiter);

  app.use(config.api.prefix, apiRouter);
  RegisterRoutes(apiRouter);

  // Swagger UI API 문서 로더 연동 (404 에러 핸들러 전에 등록)
  swaggerLoader({ app: apiRouter });

  // 404 라우트 handler
  app.use((req: Request, res: Response, _next: NextFunction) => {
    res.status(404).json({
      code: "ROUTE_NOT_FOUND",
      message: `요청하신 경로 (${req.method} ${req.url})를 찾을 수 없습니다.`,
      status: 404,
    });
  });

  // 공통 전역 에러 핸들러 미들웨어
  app.use(globalErrorHandler);
};
