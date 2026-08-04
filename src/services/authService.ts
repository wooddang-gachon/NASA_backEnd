import { Service } from "typedi";
import type {
  UserSignUpRequest,
  UserLoginRequest,
  UserLoginResponse,
  UserLogoutRequest,
  UserLogoutResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserAuthMeResponse,
  UserWithdrawRequest,
  UserWithdrawResponse,
} from "../interfaces";

@Service()
export default class AuthService {
  /**
   * 사용자 회원가입 처리
   */
  public async signUp(data: UserSignUpRequest): Promise<UserLoginResponse> {
    // TODO: 비밀번호 암호화 및 유저 생성 DB 쿼리 실행
    return {
      user: {
        id: 1,
        email: data.email,
        nickname: data.nickname,
        authProvider: "LOCAL",
      },
      accessToken: "eyJhbGciOiJIUzI1Ni_mock_access_token",
      refreshToken: "eyJhbGciOiJIUzI1Ni_mock_refresh_token",
    };
  }

  /**
   * 사용자 로그인 처리 및 JWT 토큰 발급
   */
  public async login(data: UserLoginRequest): Promise<UserLoginResponse> {
    // TODO: 비밀번호 검증 및 토큰 발급 처리
    return {
      user: {
        id: 1,
        email: data.email,
        nickname: "우주탐험가",
        authProvider: "LOCAL",
      },
      accessToken: "eyJhbGciOiJIUzI1Ni_mock_access_token",
      refreshToken: "eyJhbGciOiJIUzI1Ni_mock_refresh_token",
    };
  }

  /**
   * 로그아웃 처리 (Refresh Token 무효화)
   */
  public async logout(data: UserLogoutRequest): Promise<UserLogoutResponse> {
    return {
      success: true,
      message: "성공적으로 로그아웃 되었습니다.",
    };
  }

  /**
   * Access Token 자동 갱신
   */
  public async refresh(data: TokenRefreshRequest): Promise<TokenRefreshResponse> {
    return {
      accessToken: "eyJhbGciOiJIUzI1Ni_new_mock_access_token",
      refreshToken: "eyJhbGciOiJIUzI1Ni_new_mock_refresh_token",
    };
  }

  /**
   * 내 계정 정보 조회
   */
  public async getProfile(userId: number): Promise<UserAuthMeResponse> {
    return {
      id: userId,
      email: "user@example.com",
      nickname: "우주탐험가",
      authProvider: "LOCAL",
      targetDailyWaterMl: 2000,
      targetDailyCaloriesKcal: 2000,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 회원 탈퇴 처리
   */
  public async withdraw(userId: number, data?: UserWithdrawRequest): Promise<UserWithdrawResponse> {
    return {
      success: true,
      message: "회원 탈퇴 처리가 완료되었습니다.",
    };
  }

  /**
   * 사용자 인증 및 토큰 검증 로직을 수행합니다.
   */
  public async authenticate(token: string): Promise<any> {
    return { userId: 1, nickname: "우주탐험가" };
  }
}
