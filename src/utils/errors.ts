export class AppError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string = "INTERNAL_SERVER_ERROR", status: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "해당 리소스를 찾을 수 없습니다.", code: string = "NOT_FOUND") {
    super(message, code, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "잘못된 요청입니다.", code: string = "BAD_REQUEST") {
    super(message, code, 400);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(userId?: number) {
    super(
      userId ? `ID가 ${userId}인 사용자를 찾을 수 없습니다.` : "존재하지 않는 사용자입니다.",
      "USER_NOT_FOUND"
    );
  }
}
