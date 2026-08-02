import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import { RegisterRoutes } from "../build/routes";
import config from "../config";
import swaggerLoader from "./swagger";
import Logger from "./logger";
import { AppError } from "../utils/errors";

export default ({ app }: { app: express.Application }) => {
  app.get("/status", (req: Request, res: Response) => {
    res.status(200).end();
  });
  app.head("/status", (req: Request, res: Response) => {
    res.status(200).end();
  });

  app.use(cors());
  app.use(express.json());

  // TSOA Routes
  const apiRouter = express.Router();

  apiRouter.use(morgan("dev"));

  app.use(config.api.prefix, apiRouter);
  RegisterRoutes(apiRouter);

  // Swagger UI API 문서 로더 연동 (404 에러 핸들러 전에 등록)
  swaggerLoader({ app: apiRouter as any });

  // 404 라우트 handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
      code: "ROUTE_NOT_FOUND",
      message: `요청하신 경로 (${req.method} ${req.url})를 찾을 수 없습니다.`,
      status: 404,
    });
  });

  // 공통 에러 핸들러 미들웨어
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
      if (err.status >= 500) {
        Logger.error(`[AppError ${err.status}] ${err.code}: ${err.message}`);
      } else {
        Logger.warn(`[AppError ${err.status}] ${err.code}: ${err.message}`);
      }

      return res.status(err.status).json({
        code: err.code,
        message: err.message,
        status: err.status,
      });
    }

    // AiServerError 처리
    if ((err as any).name === "AiServerError") {
      const status = (err as any).status || 503;
      const code = (err as any).code || "AI_SERVER_ERROR";
      Logger.error(`[AiServerError ${status}] ${code}: ${err.message}`);

      return res.status(status).json({
        code,
        message: err.message,
        status,
      });
    }

    // 일반 예외 처리
    const statusCode = (err as any).status || 500;
    Logger.error(`[Unhandled Error ${statusCode}]: ${err.message}`, err);

    return res.status(statusCode).json({
      code: (err as any).code || "INTERNAL_SERVER_ERROR",
      message: err.message || "서버 내부 오류가 발생했습니다.",
      status: statusCode,
    });
  });
};
