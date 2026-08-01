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
   * @example "password123!"
   */
  password: string;

  /**
   * 사용자 닉네임입니다. (최소 2자, 최대 20자)
   * @minLength 2
   * @maxLength 20
   * @example "우주여행자"
   */
  nickname: string;
}

export interface UserLoginRequest {
  /**
   * 로그인용 이메일 주소
   * @example "user@example.com"
   */
  email: string;

  /**
   * 로그인용 비밀번호
   * @example "password123!"
   */
  password: string;
}

export interface UserLoginResponse {
  /**
   * 인증 성공 후 발급되는 JWT 엑세스 토큰입니다.
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  accessToken: string;

  /**
   * 로그인에 성공한 사용자 ID
   * @example 1
   */
  userId: number;

  /**
   * 사용자 닉네임
   * @example "우주여행자"
   */
  nickname: string;
}
