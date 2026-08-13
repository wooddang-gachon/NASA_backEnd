export class ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  code: number;

  constructor(
    success: boolean,
    message: string,
    data: T | null = null,
    code = 200,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.code = code;
  }

  public static success<T>(
    data: T,
    message = "성공",
    code = 200,
  ): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data, code);
  }

  public static error<T = null>(
    message = "오류가 발생했습니다.",
    code = 400,
    data: T | null = null,
  ): ApiResponse<T> {
    return new ApiResponse<T>(false, message, data, code);
  }
}
