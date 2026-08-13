/**
 * Base Application Custom Error Class
 */
export class AppError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(
    message: string,
    code: string = "INTERNAL_SERVER_ERROR",
    status: number = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request Exception
 */
export class BadRequestError extends AppError {
  constructor(
    message: string = "잘못된 요청입니다.",
    code: string = "BAD_REQUEST",
    details?: unknown,
  ) {
    super(message, code, 400, details);
  }
}

/**
 * 401 Unauthorized Exception
 */
export class UnauthorizedError extends AppError {
  constructor(
    message: string = "인증에 실패하였습니다.",
    code: string = "UNAUTHORIZED",
  ) {
    super(message, code, 401);
  }
}

/**
 * 403 Forbidden Exception
 */
export class ForbiddenError extends AppError {
  constructor(
    message: string = "접근 권한이 없습니다.",
    code: string = "FORBIDDEN",
  ) {
    super(message, code, 403);
  }
}

/**
 * 404 Not Found Exception
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = "해당 리소스를 찾을 수 없습니다.",
    code: string = "NOT_FOUND",
  ) {
    super(message, code, 404);
  }
}

/**
 * 409 Conflict Exception
 */
export class ConflictError extends AppError {
  constructor(
    message: string = "이미 존재하는 데이터입니다.",
    code: string = "CONFLICT",
  ) {
    super(message, code, 409);
  }
}

/**
 * Domain Specific User Exceptions
 */
export class UserNotFoundError extends NotFoundError {
  constructor(userId?: number) {
    super(
      userId
        ? `ID가 ${userId}인 사용자를 찾을 수 없습니다.`
        : "존재하지 않는 사용자입니다.",
      "USER_NOT_FOUND",
    );
  }
}

/**
 * 503 Service Unavailable Exception (AI Server Failure)
 */
export class AiServerError extends AppError {
  constructor(
    message: string = "AI 서버 연동에 실패하였습니다.",
    code: string = "AI_SERVER_UNAVAILABLE",
    status: number = 503,
  ) {
    super(message, code, status);
  }
}

/**
 * 502 Bad Gateway Exception
 */
export class BadGatewayError extends AppError {
  constructor(
    message: string = "외부 서비스 연동 중 오류가 발생했습니다.",
    code: string = "BAD_GATEWAY",
    details?: unknown,
  ) {
    super(message, code, 502, details);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = "서버 내부 오류가 발생했습니다.",
    code: string = "INTERNAL_SERVER_ERROR",
    details?: unknown,
  ) {
    super(message, code, 500, details);
  }
}
