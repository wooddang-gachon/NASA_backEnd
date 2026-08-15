import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../errors";
import Logger from "../../loaders/logger";

/**
 * Global Error Handling Middleware for Express & TSOA
 * @param err
 * @param req
 * @param res
 * @param next
 */
export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    return next(err);
  }

  // 1. 커스텀 애플리케이션 예외 (AppError)
  if (err instanceof AppError) {
    Logger.warn(
      `[AppError] ${req.method} ${req.path} - ${err.code} (${err.status}): ${err.message}`,
    );
    res.status(err.status).json({
      code: err.code,
      message: err.message,
      status: err.status,
      ...(typeof err.details === "object" && err.details !== null
        ? err.details
        : {}),
    });
    return;
  }

  const error = err as Error & { status?: number; fields?: unknown };

  // 2. TSOA Request Body / Query Validation Error
  if (error.name === "ValidateError" || error.status === 400) {
    Logger.warn(
      `[ValidationError] ${req.method} ${req.path} - ${error.message}`,
    );
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "요청 데이터 유효성 검증에 실패하였습니다.",
      status: 400,
      details: error.fields || error.message,
    });
    return;
  }

  // 3. 처리되지 않은 500 Internal Server Error (스택 트레이스는 로거로 기록 후 은닉)
  Logger.error(
    `[UnhandledError] ${req.method} ${req.path} - ${
      error.stack || error.message || "Unknown error"
    }`,
  );
  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "서버 내부 오류가 발생하였습니다. 잠시 후 다시 시도해주세요.",
    status: 500,
  });
}
