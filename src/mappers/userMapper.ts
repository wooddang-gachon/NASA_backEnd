import { users, Gender, ChangeReason } from "@prisma/client";
import { UserSignUpRequest, UserAuthProfile, UserAuthMeResponse, UserProfileResponseData, TammyHistoryResponse, UserLoginResponse } from "../dto";
import { UserWithTammyStatus, DbTammyStatusLogItem, CreateTammyStatusLogParams } from "../repositories/models";

export class UserMapper {
  /**
   * 일반 회원 가입 DB 생성 인풋 객체 생성
   */
  public static toUserCreateInput(data: UserSignUpRequest, passwordHash: string) {
    return {
      email: data.email,
      password_hash: passwordHash,
      nickname: data.nickname,
      auth_provider: "LOCAL" as const,
      gender: (data.gender as Gender) || null,
      age: data.age || null,
      status: "ACTIVE" as const,
      current_fuel: 0,
      tammy_statuses: {
        create: {
          level: 1,
          current_exp: 0,
          empathy_index: 50,
          health_index: 50,
          activity_index: 50,
          happiness_index: 50,
        },
      },
    };
  }

  /**
   * 소셜 회원 가입 DB 생성 인풋 객체 생성
   */
  public static toSocialUserCreateInput(email: string, provider: "GOOGLE" | "KAKAO" | "APPLE", nickname: string) {
    return {
      email,
      auth_provider: provider,
      nickname,
      status: "ACTIVE" as const,
      current_fuel: 0,
      tammy_statuses: {
        create: {
          level: 1,
          current_exp: 0,
          empathy_index: 50,
          health_index: 50,
          activity_index: 50,
          happiness_index: 50,
        },
      },
    };
  }

  /**
   * 로그인/회원가입/소셜로그인 최종 응답 DTO 반환
   */
  public static toLoginResponse(user: users, tokens: { accessToken: string; refreshToken: string }): UserLoginResponse {
    return {
      user: UserMapper.toUserAuthProfile(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * 타미 성장 및 경험치 로그 DB 생성 인풋 객체 생성 (Param 객체 및 위치 기반 인자 모두 지원)
   */
  public static toStatusLogCreateInput(
    paramsOrUserId: CreateTammyStatusLogParams | number,
    changeReason?: ChangeReason | string,
    deltaExp?: number,
    snapshotLevel?: number,
    snapshotTotalExp?: number
  ) {
    if (typeof paramsOrUserId === "object") {
      return {
        user_id: paramsOrUserId.userId,
        change_reason: paramsOrUserId.changeReason as ChangeReason,
        delta_exp: paramsOrUserId.deltaExp,
        snapshot_level: paramsOrUserId.snapshotLevel,
        snapshot_total_exp: paramsOrUserId.snapshotTotalExp,
      };
    }
    return {
      user_id: paramsOrUserId,
      change_reason: changeReason as ChangeReason,
      delta_exp: deltaExp!,
      snapshot_level: snapshotLevel!,
      snapshot_total_exp: snapshotTotalExp!,
    };
  }

  /**
   * DB users 엔티티 ➔ UserAuthProfile DTO 변환
   */
  public static toUserAuthProfile(user: users): UserAuthProfile {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      authProvider: user.auth_provider as any,
    };
  }

  /**
   * DB users 엔티티 ➔ UserAuthMeResponse DTO 변환
   */
  public static toUserAuthMeResponse(user: users): UserAuthMeResponse {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      authProvider: user.auth_provider as any,
      targetDailyWaterMl: (user as any).target_daily_water_ml || undefined,
      targetDailyCaloriesKcal: (user as any).target_daily_calories_kcal || undefined,
      createdAt: user.created_at.toISOString(),
    };
  }

  /**
   * DB users & tammy_statuses 엔티티 ➔ UserProfileResponseData DTO 변환
   */
  public static toProfileResponse(user: UserWithTammyStatus): UserProfileResponseData {
    return {
      userId: user.id,
      nickname: user.nickname,
      gender: user.gender || undefined,
      age: user.age || undefined,
      currentFuel: user.current_fuel ?? 0,
      tammyStatus: {
        level: user.tammy_statuses?.level || 1,
        currentExp: user.tammy_statuses?.current_exp || 0,
      },
      createdAt: user.created_at || new Date(),
    };
  }

  /**
   * DB tammy_status_logs 엔티티 목록 ➔ TammyHistoryResponse DTO 변환
   */
  public static toTammyHistoryResponse(logs: DbTammyStatusLogItem[]): TammyHistoryResponse {
    return {
      logs: logs.map((l) => ({
        id: Number(l.id),
        changeReason: String(l.change_reason),
        deltaExp: l.delta_exp,
        snapshotLevel: l.snapshot_level,
        snapshotTotalExp: l.snapshot_total_exp,
        createdAt: l.created_at ? new Date(l.created_at).toISOString() : new Date().toISOString(),
      })),
    };
  }
}

// 하위 호환용 export
export const toUserCreateInput = UserMapper.toUserCreateInput;
export const toUserAuthProfile = UserMapper.toUserAuthProfile;
export const toUserAuthMeResponse = UserMapper.toUserAuthMeResponse;
