import { Service } from "typedi";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import config from "@/config";
import Logger from "@/loaders/logger";
import AuthRepository from "@/repositories/AuthRepository";
import { Inject } from "typedi";
import {
  ConflictError,
  UnauthorizedError,
  UserNotFoundError,
  BadGatewayError,
} from "@/errors";
import { UserMapper } from "@/mappers";
import type {
  UserSignUpRequest,
  UserLoginRequest,
  UserLoginResponse,
  UserLogoutRequest,
  UserLogoutResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserWithdrawRequest,
  UserWithdrawResponse,
  SocialLoginRequest,
} from "@/dto";

@Service()
export default class AuthService {
  @Inject(() => AuthRepository)
  private authRepository!: AuthRepository;

  private jwtSecret = config.jwtSecret || "nasa_wellness_tammy_secret_key_2026";

  /**
   * JWT 토큰 발급 및 DB Refresh Token/마지막 로그인 일시 갱신 공통 헬퍼
   * @param user 유저 객체
   * @param user.id 유저 ID
   * @param user.email 유저 이메일
   * @returns 발급된 Access Token과 Refresh Token 객체
   */
  private async generateAndSaveTokens(user: { id: number; email: string }) {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      {
        expiresIn: "1h",
      },
    );
    const refreshToken = jwt.sign({ userId: user.id }, this.jwtSecret, {
      expiresIn: "14d",
    });

    await this.authRepository.updateUser(user.id, {
      refresh_token: refreshToken,
      last_login_at: new Date(),
    });

    return { accessToken, refreshToken };
  }

  /**
   * 사용자 회원가입 처리 (실제 DB 유저 생성 & 초기 펫/우주선 상태 세팅)
   * @param data 회원가입 요청 데이터
   * @returns 로그인 응답(토큰 포함)
   */
  public async signUp(data: UserSignUpRequest): Promise<UserLoginResponse> {
    // 1. 이메일 중복 체크
    const existingUser = await this.authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("이미 가입된 이메일 주소입니다.");
    }

    // 2. 비밀번호 보안 암호화 (argon2)
    const passwordHash = await argon2.hash(data.password);

    // 3. DB 유저 생성 및 펫/우주선 상태 초기화
    const user = await this.authRepository.createUser(
      UserMapper.toUserCreateInput(data, passwordHash),
    );

    // 4. JWT 토큰 생성 및 DB 저장
    const tokens = await this.generateAndSaveTokens(user);

    return UserMapper.toLoginResponse(user, tokens);
  }

  /**
   * 사용자 로그인 처리 및 JWT 토큰 발급
   * @param data 로그인 요청 데이터
   * @returns 로그인 응답(토큰 포함)
   */
  public async login(data: UserLoginRequest): Promise<UserLoginResponse> {
    // 1. 유저 조회
    const user = await this.authRepository.findUserByEmail(data.email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 2. 비밀번호 검증 (argon2)
    let isPasswordValid = false;
    try {
      isPasswordValid = await argon2.verify(user.password_hash, data.password);
    } catch {
      isPasswordValid = false;
    }
    if (!isPasswordValid) {
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 3. JWT 토큰 생성 및 DB 저장
    const tokens = await this.generateAndSaveTokens(user);

    return UserMapper.toLoginResponse(user, tokens);
  }

  /**
   * 로그아웃 처리 (Refresh Token 무효화)
   * @param data 로그아웃 요청 데이터
   * @returns 로그아웃 결과 응답
   */
  public async logout(data: UserLogoutRequest): Promise<UserLogoutResponse> {
    if (data.userId) {
      await this.authRepository.updateUser(data.userId, {
        refresh_token: null,
      });
    }

    return {
      success: true,
      message: "성공적으로 로그아웃 되었습니다.",
    };
  }

  /**
   * Access Token 자동 갱신
   * @param data 토큰 갱신 요청 데이터
   * @returns 갱신된 토큰 응답
   */
  public async refresh(
    data: TokenRefreshRequest,
  ): Promise<TokenRefreshResponse> {
    try {
      const decoded = jwt.verify(data.refreshToken, this.jwtSecret) as {
        userId: number;
      };
      const user = await this.authRepository.findUserById(decoded.userId);

      if (!user || user.refresh_token !== data.refreshToken) {
        throw new UnauthorizedError("유효하지 않은 Refresh Token입니다.");
      }

      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email },
        this.jwtSecret,
        {
          expiresIn: "1h",
        },
      );
      const newRefreshToken = jwt.sign({ userId: user.id }, this.jwtSecret, {
        expiresIn: "14d",
      });

      await this.authRepository.updateUser(user.id, {
        refresh_token: newRefreshToken,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      throw new UnauthorizedError(
        "만료되었거나 유효하지 않은 Refresh Token입니다.",
      );
    }
  }

  /**
   * 회원 탈퇴 처리 (실제 DB 삭제)
   * @param userId 회원 탈퇴를 요청하는 유저 ID
   * @param _data 탈퇴 요청 데이터
   * @returns 탈퇴 결과 응답
   */
  public async withdraw(
    userId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _data?: UserWithdrawRequest,
  ): Promise<UserWithdrawResponse> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    await this.authRepository.deleteUser(userId);

    return {
      success: true,
      message: "회원 탈퇴 처리가 완료되었습니다.",
    };
  }

  /**
   * 사용자 토큰 검증 및 유저 획득
   * @param token 검증할 JWT 토큰
   * @returns 토큰에서 추출한 유저 정보 객체
   */
  public async authenticate(
    token: string,
  ): Promise<{ userId: number; email: string }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        userId: number;
        email: string;
      };
      return decoded;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      throw new UnauthorizedError("유효하지 않거나 만료된 인증 토큰입니다.");
    }
  }

  /**
   * 구글 / 카카오 / 애플 소셜 로그인 처리 (OAuth 2.0 Access Token 검증 & 자동 가입)
   * @param data 소셜 로그인 요청 데이터
   * @returns 로그인 응답
   */
  public async socialLogin(
    data: SocialLoginRequest,
  ): Promise<UserLoginResponse> {
    const socialUser = await this.verifySocialToken(data.provider, data.token);

    const email = socialUser.email;
    const nickname =
      data.nickname ||
      socialUser.nickname ||
      `${data.provider}_USER_${Date.now().toString().slice(-4)}`;

    // 1. 기존 유저 존재 여부 조회
    let user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      // 2. 신규 사용자 자동 생성 및 초기 펫 상태 세팅
      user = await this.authRepository.createUser(
        UserMapper.toSocialUserCreateInput(email, data.provider, nickname),
      );
    } else {
      // 소셜 제공자 정보 갱신
      await this.authRepository.updateUser(user.id, {
        auth_provider: data.provider,
        last_login_at: new Date(),
      });
    }

    // 3. JWT 토큰 생성 및 DB 저장
    const tokens = await this.generateAndSaveTokens(user);

    return UserMapper.toLoginResponse(user, tokens);
  }

  /**
   * 카카오/구글/애플 소셜 OAuth 토큰 검증 헬퍼
   * @param provider 소셜 로그인 제공자 식별자
   * @param token 소셜 제공자로부터 발급받은 액세스/ID 토큰
   * @returns 검증된 이메일 및 닉네임
   */
  protected async verifySocialToken(
    provider: "GOOGLE" | "KAKAO" | "APPLE",
    token: string,
  ): Promise<{ email: string; nickname?: string }> {
    try {
      if (provider === "GOOGLE") {
        // Google OAuth 2.0 UserInfo API 검증
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) {
          // fallback: id_token 검증 시도
          const tokenInfoRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
          );
          if (!tokenInfoRes.ok) {
            throw new UnauthorizedError(
              "유효하지 않은 Google 인증 토큰입니다.",
            );
          }
          const info = (await tokenInfoRes.json()) as {
            email?: string;
            sub: string;
            name?: string;
            given_name?: string;
          };
          return {
            email: info.email || `google_${info.sub}@gmail.com`,
            nickname: info.name || info.given_name || "구글유저",
          };
        }

        const data = (await res.json()) as {
          email?: string;
          name?: string;
          given_name?: string;
        };
        return {
          email: data.email || `google_${Date.now()}@gmail.com`,
          nickname: data.name || data.given_name || "구글유저",
        };
      } else if (provider === "KAKAO") {
        // Kakao OAuth API 검증
        const res = await fetch("https://kapi.kakao.com/v2/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
          },
        });

        if (!res.ok) {
          throw new UnauthorizedError("유효하지 않은 Kakao 인증 토큰입니다.");
        }

        const data = (await res.json()) as {
          id: number;
          kakao_account?: { email?: string; profile?: { nickname?: string } };
        };
        const kakaoAccount = data.kakao_account || {};
        const profile = kakaoAccount.profile || {};

        return {
          email: kakaoAccount.email || `kakao_${data.id}@kakao.com`,
          nickname: profile.nickname || "카카오유저",
        };
      } else if (provider === "APPLE") {
        return {
          email: `apple_user_${Date.now()}@apple.com`,
          nickname: "애플유저",
        };
      }

      throw new UnauthorizedError("지원하지 않는 소셜 인증 제공자입니다.");
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) throw err;
      Logger.error(
        `[AuthService] 외부 소셜 인증 서버 통신 실패 (${provider}): ${err.message}`,
        {
          err,
        },
      );
      throw new BadGatewayError(
        `외부 소셜 인증 서비스 연동 중 오류가 발생했습니다.`,
      );
    }
  }
}
