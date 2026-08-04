import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import { RegisterRoutes } from "../build/routes";
import config from "../config";
import swaggerLoader from "./swagger";
import { globalErrorHandler } from "../api/middlewares/errorHandler";

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

  // 공통 전역 에러 핸들러 미들웨어
  app.use(globalErrorHandler);
};
