export interface UserSignUpRequest {
  /**
   * 가입 및 로그인에 사용될 이메일 주소입니다.
   * @pattern ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ 올바른 이메일 형식을 입력해야 합니다.
   * @example "user@example.com"
   */
  email: string;

  /**
   * 보안성이 뛰어난 비밀번호입니다. (최소 8자, 최대 30자)
   * @minLength 8 비밀번호는 최소 8자 이상이어야 합니다.
   * @maxLength 30 비밀번호는 최대 30자를 초과할 수 없습니다.
   * @example "Password123!"
   */
  password: string;

  /**
   * 사용자 닉네임입니다. (최소 2자, 최대 20자)
   * @minLength 2
   * @maxLength 20
   * @example "우주탐험가"
   */
  nickname: string;

  /** 성별 (MALE, FEMALE, UNKNOWN) */
  gender?: string;

  /** 나이 */
  age?: number;

  /** 목표 체중 (kg) */
  targetWeightKg?: number;

  /** 선호 운동 타입 */
  preferredExercise?: string;

  /** 운동 장소 (실내, 실외 등) */
  exerciseLocation?: string;

  /** 선호 운동 시간대 */
  preferredExerciseTime?: string;

  /**
   * 일일 목표 수분 섭취량 (ml)
   * @example 2000
   */
  targetDailyWaterMl?: number;

  /**
   * 일일 목표 칼로리 (kcal)
   * @example 2000
   */
  targetDailyCaloriesKcal?: number;
}

export interface UserLoginRequest {
  /**
   * 로그인용 이메일 주소
   * @example "user@example.com"
   */
  email: string;

  /**
   * 로그인용 비밀번호
   * @example "Password123!"
   */
  password: string;
}

export interface UserAuthProfile {
  id: number;
  email: string;
  nickname: string;
  authProvider: "LOCAL" | "KAKAO" | "GOOGLE" | "APPLE";
}

export interface UserLoginResponse {
  user: UserAuthProfile;
  /**
   * 인증 성공 후 발급되는 JWT Access Token
   * @example "eyJhbGciOiJIUzI1Ni..."
   */
  accessToken: string;
  /**
   * 토큰 갱신용 JWT Refresh Token
   * @example "eyJhbGciOiJIUzI1Ni..."
   */
  refreshToken: string;
}

export interface UserLogoutRequest {
  /**
   * 무효화 처리할 Refresh Token
   * @example "eyJhbGciOiJIUzI1Ni..."
   */
  refreshToken: string;

  /** 사용자 ID (선택) */
  userId?: number;
}

export interface UserLogoutResponse {
  success: boolean;
  message: string;
}

export interface TokenRefreshRequest {
  /**
   * Access Token 재발급용 Refresh Token
   * @example "eyJhbGciOiJIUzI1Ni..."
   */
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserAuthMeResponse {
  id: number;
  email: string;
  nickname: string;
  authProvider: "LOCAL" | "KAKAO" | "GOOGLE" | "APPLE";
  targetDailyWaterMl?: number;
  targetDailyCaloriesKcal?: number;
  createdAt: string;
}

export interface UserWithdrawRequest {
  /**
   * 탈퇴 사유
   * @example "개인 사정"
   */
  reason?: string;
}

export interface UserWithdrawResponse {
  success: boolean;
  message: string;
}
