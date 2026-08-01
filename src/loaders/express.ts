import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import { RegisterRoutes } from "../build/routes";
import config from "../config";
import swaggerLoader from "./swagger";
import Logger from "./logger";

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

  apiRouter.use(
    morgan((tokens, req, res) => {
      const status = tokens.status(req, res);
      const statusNum = status ? parseInt(status, 10) : 0;
      
      const logMessage = [
        tokens.method(req, res),
        tokens.url(req, res),
        status,
        tokens["response-time"](req, res), "ms"
      ].join(" ");

      if (statusNum >= 500) {
        Logger.error(`HTTP Request Failure (5XX): ${logMessage}`);
      } else if (statusNum >= 400) {
        Logger.warn(`HTTP Request Warning (4XX): ${logMessage}`);
      } else {
        Logger.info(logMessage);
      }
      
      return null;
    })
  );

  app.use(config.api.prefix, apiRouter);
  RegisterRoutes(apiRouter);

  // Swagger UI API 문서 로더 연동 (404 에러 핸들러 전에 등록)
  swaggerLoader({ app: apiRouter as any });

  // 404 error handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    const err = new Error("Not Found");
    (err as any).status = 404;
    next(err);
  });

  /// error handlers
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    /**
     * Handle 401 thrown by express-jwt library
     */
    if (err.name === "UnauthorizedError") {
      Logger.warn(`Unauthorized Access: ${err.message}`);
      return res
        .status((err as any).status || 401)
        .send({ message: err.message })
        .end();
    }
    return next(err);
  });
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = (err as any).status || 500;
    if (statusCode >= 500) {
      Logger.error("Server Error Handled:", err);
    } else {
      Logger.warn(`Warning Handled: ${err.message}`);
    }

    res.status(statusCode);
    res.json({
      errors: {
        message: err.message,
      },
    });
  });
};
