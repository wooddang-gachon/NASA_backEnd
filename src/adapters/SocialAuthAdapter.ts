import { UnauthorizedError, BadGatewayError } from "@/errors";
import Logger from "@/loaders/logger";
import { z } from "zod";

export interface SocialUser {
  email: string;
  nickname?: string;
}

export interface SocialAuthStrategy {
  verify(token: string): Promise<SocialUser>;
}

// Zod Schemas
const GoogleUserInfoSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  given_name: z.string().optional(),
});

const GoogleIdTokenSchema = z.object({
  email: z.string().email().optional(),
  sub: z.string(),
  name: z.string().optional(),
  given_name: z.string().optional(),
});

const KakaoUserInfoSchema = z.object({
  id: z.number(),
  kakao_account: z
    .object({
      email: z.string().email().optional(),
      profile: z
        .object({
          nickname: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export class GoogleAuthStrategy implements SocialAuthStrategy {
  async verify(token: string): Promise<SocialUser> {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Fallback to id_token
        const tokenInfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
        );
        if (!tokenInfoRes.ok) {
          throw new UnauthorizedError("유효하지 않은 Google 인증 토큰입니다.");
        }

        const rawJson = await tokenInfoRes.json();
        const info = GoogleIdTokenSchema.parse(rawJson);

        return {
          email: info.email || `google_${info.sub}@gmail.com`,
          nickname: info.name || info.given_name || "구글유저",
        };
      }

      const rawJson = await res.json();
      const data = GoogleUserInfoSchema.parse(rawJson);

      return {
        email: data.email || `google_${Date.now()}@gmail.com`,
        nickname: data.name || data.given_name || "구글유저",
      };
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) throw err;
      Logger.error(
        `[GoogleAuthStrategy] 통신 실패: ${(err as Error).message}`,
        { err },
      );
      throw new BadGatewayError(
        "Google 인증 서비스 연동 중 오류가 발생했습니다.",
      );
    }
  }
}

export class KakaoAuthStrategy implements SocialAuthStrategy {
  async verify(token: string): Promise<SocialUser> {
    try {
      const res = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      });

      if (!res.ok) {
        throw new UnauthorizedError("유효하지 않은 Kakao 인증 토큰입니다.");
      }

      const rawJson = await res.json();
      const data = KakaoUserInfoSchema.parse(rawJson);

      const kakaoAccount = data.kakao_account || {};
      const profile = kakaoAccount.profile || {};

      return {
        email: kakaoAccount.email || `kakao_${data.id}@kakao.com`,
        nickname: profile.nickname || "카카오유저",
      };
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) throw err;
      Logger.error(`[KakaoAuthStrategy] 통신 실패: ${(err as Error).message}`, {
        err,
      });
      throw new BadGatewayError(
        "Kakao 인증 서비스 연동 중 오류가 발생했습니다.",
      );
    }
  }
}

export class AppleAuthStrategy implements SocialAuthStrategy {
  async verify(token: string): Promise<SocialUser> {
    if (!token) throw new UnauthorizedError("Apple 인증 토큰이 필요합니다.");
    return {
      email: `apple_user_${Date.now()}@apple.com`,
      nickname: "애플유저",
    };
  }
}

export class SocialAuthContext {
  private strategies: Record<string, SocialAuthStrategy> = {
    GOOGLE: new GoogleAuthStrategy(),
    KAKAO: new KakaoAuthStrategy(),
    APPLE: new AppleAuthStrategy(),
  };

  async authenticate(provider: string, token: string): Promise<SocialUser> {
    const strategy = this.strategies[provider.toUpperCase()];
    if (!strategy) {
      throw new UnauthorizedError("지원하지 않는 소셜 인증 제공자입니다.");
    }
    return strategy.verify(token);
  }
}
