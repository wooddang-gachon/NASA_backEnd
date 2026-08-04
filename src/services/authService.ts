import { Service } from "typedi";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import config from "@/config";
import { getPrisma } from "@/loaders/prisma";
import { ConflictError, UnauthorizedError, UserNotFoundError } from "@/errors";
import { toUserCreateInput, toUserAuthProfile, toUserAuthMeResponse } from "@/models/User";
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
  private jwtSecret = config.jwtSecret || "nasa_wellness_tammy_secret_key_2026";

  /**
   * 사용자 회원가입 처리 (실제 DB 유저 생성 & 초기 펫/우주선 상태 세팅)
   */
  public async signUp(data: UserSignUpRequest): Promise<UserLoginResponse> {
    const prisma = getPrisma();

    // 1. 이메일 중복 체크
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictError("이미 가입된 이메일 주소입니다.");
    }

    // 2. 비밀번호 보안 암호화 (argon2)
    const passwordHash = await argon2.hash(data.password);

    // 3. DB 유저 생성 및 펫/우주선 상태 초기화 (userMapper 매퍼 활용)
    const user = await prisma.users.create({
      data: toUserCreateInput(data, passwordHash),
    });

    // 4. JWT 토큰 생성
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      this.jwtSecret,
      { expiresIn: "14d" }
    );

    // 5. Refresh Token DB 업데이트
    await prisma.users.update({
      where: { id: user.id },
      data: {
        refresh_token: refreshToken,
        last_login_at: new Date(),
      },
    });

    return {
      user: toUserAuthProfile(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * 사용자 로그인 처리 및 JWT 토큰 발급
   */
  public async login(data: UserLoginRequest): Promise<UserLoginResponse> {
    const prisma = getPrisma();

    // 1. 유저 조회
    const user = await prisma.users.findUnique({
      where: { email: data.email },
    });
    if (!user || !user.password_hash) {
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 2. 비밀번호 검증 (argon2)
    const isPasswordValid = await argon2.verify(user.password_hash, data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 3. JWT 토큰 생성
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      this.jwtSecret,
      { expiresIn: "14d" }
    );

    // 4. Refresh Token 및 마지막 로그인 일시 갱신
    await prisma.users.update({
      where: { id: user.id },
      data: {
        refresh_token: refreshToken,
        last_login_at: new Date(),
      },
    });

    return {
      user: toUserAuthProfile(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * 로그아웃 처리 (Refresh Token 무효화)
   */
  public async logout(data: UserLogoutRequest): Promise<UserLogoutResponse> {
    const prisma = getPrisma();

    if (data.userId) {
      await prisma.users.update({
        where: { id: data.userId },
        data: { refresh_token: null },
      });
    }

    return {
      success: true,
      message: "성공적으로 로그아웃 되었습니다.",
    };
  }

  /**
   * Access Token 자동 갱신
   */
  public async refresh(data: TokenRefreshRequest): Promise<TokenRefreshResponse> {
    const prisma = getPrisma();

    try {
      const decoded = jwt.verify(data.refreshToken, this.jwtSecret) as { userId: number };
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.refresh_token !== data.refreshToken) {
        throw new UnauthorizedError("유효하지 않은 Refresh Token입니다.");
      }

      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email },
        this.jwtSecret,
        { expiresIn: "1h" }
      );
      const newRefreshToken = jwt.sign(
        { userId: user.id },
        this.jwtSecret,
        { expiresIn: "14d" }
      );

      await prisma.users.update({
        where: { id: user.id },
        data: { refresh_token: newRefreshToken },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      throw new UnauthorizedError("만료되었거나 유효하지 않은 Refresh Token입니다.");
    }
  }

  /**
   * 내 계정 정보 조회
   */
  public async getProfile(userId: number): Promise<UserAuthMeResponse> {
    const prisma = getPrisma();

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return toUserAuthMeResponse(user);
  }

  /**
   * 회원 탈퇴 처리 (실제 DB 삭제)
   */
  public async withdraw(userId: number, data?: UserWithdrawRequest): Promise<UserWithdrawResponse> {
    const prisma = getPrisma();

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    await prisma.users.delete({
      where: { id: userId },
    });

    return {
      success: true,
      message: "회원 탈퇴 처리가 완료되었습니다.",
    };
  }

  /**
   * 사용자 토큰 검증 및 유저 획득
   */
  public async authenticate(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: number; email: string };
      return decoded;
    } catch (err) {
      throw new UnauthorizedError("유효하지 않거나 만료된 인증 토큰입니다.");
    }
  }
}
