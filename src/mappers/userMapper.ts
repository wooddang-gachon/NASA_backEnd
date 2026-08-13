import { users, Gender, ChangeReason } from "@prisma/client";
import {
  UserSignUpRequest,
  UserAuthProfile,
  UserAuthMeResponse,
  UserProfileResponseData,
  TammyHistoryResponse,
  UserLoginResponse,
} from "../dto";
import {
  UserWithTammyStatus,
  DbTammyStatusLogItem,
  CreateTammyStatusLogParams,
} from "../repositories/models";
import { BaseMapper } from "./BaseMapper";

export class UserMapper extends BaseMapper {
  /**
   * 일반 회원 가입 DB 생성 인풋 객체 생성
   * @param data - User sign up request data
   * @param passwordHash - Hashed password
   * @returns Created user input object
   */
  public static toUserCreateInput(
    data: UserSignUpRequest,
    passwordHash: string,
  ) {
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
   * @param email - User email
   * @param provider - Auth provider (GOOGLE, KAKAO, APPLE)
   * @param nickname - User nickname
   * @returns Created social user input object
   */
  public static toSocialUserCreateInput(
    email: string,
    provider: "GOOGLE" | "KAKAO" | "APPLE",
    nickname: string,
  ) {
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
   * @param user - DB user object
   * @param tokens - Tokens object
   * @param tokens.accessToken - Access token
   * @param tokens.refreshToken - Refresh token
   * @returns User login response DTO
   */
  public static toLoginResponse(
    user: users,
    tokens: { accessToken: string; refreshToken: string },
  ): UserLoginResponse {
    return {
      user: UserMapper.toUserAuthProfile(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * 타미 성장 및 경험치 로그 DB 생성 인풋 객체 생성 (Param 객체 및 위치 기반 인자 모두 지원)
   * @param paramsOrUserId - User ID or CreateTammyStatusLogParams object
   * @param changeReason - Change reason string
   * @param deltaExp - Delta experience
   * @param snapshotLevel - Snapshot level
   * @param snapshotTotalExp - Snapshot total experience
   * @returns Created status log input object
   */
  public static toStatusLogCreateInput(
    paramsOrUserId: CreateTammyStatusLogParams | number,
    changeReason?: ChangeReason | string,
    deltaExp?: number,
    snapshotLevel?: number,
    snapshotTotalExp?: number,
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
   * @param user - DB user item
   * @returns User auth profile DTO
   */
  public static toUserAuthProfile(user: users): UserAuthProfile {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      authProvider: user.auth_provider as UserAuthProfile["authProvider"],
    };
  }

  /**
   * DB users 엔티티 ➔ UserAuthMeResponse DTO 변환
   * @param user - DB user item
   * @returns User auth me response DTO
   */
  public static toUserAuthMeResponse(user: users): UserAuthMeResponse {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      authProvider: user.auth_provider as UserAuthProfile["authProvider"],
      targetDailyWaterMl: (user as Record<string, unknown>)
        .target_daily_water_ml as number | undefined,
      targetDailyCaloriesKcal: (user as Record<string, unknown>)
        .target_daily_calories_kcal as number | undefined,
      createdAt: user.created_at.toISOString(),
    };
  }

  /**
   * DB users & tammy_statuses 엔티티 ➔ UserProfileResponseData DTO 변환
   * @param user - User object with Tammy status
   * @returns User profile response data DTO
   */
  public static toProfileResponse(
    user: UserWithTammyStatus,
  ): UserProfileResponseData {
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
   * @param logs - Array of Tammy status logs
   * @returns Tammy history response DTO
   */
  public static toTammyHistoryResponse(
    logs: DbTammyStatusLogItem[],
  ): TammyHistoryResponse {
    return {
      logs: BaseMapper.mapList(logs, (l) => ({
        id: Number(l.id),
        changeReason: String(l.change_reason),
        deltaExp: l.delta_exp,
        snapshotLevel: l.snapshot_level,
        snapshotTotalExp: l.snapshot_total_exp,
        createdAt: l.created_at
          ? new Date(l.created_at).toISOString()
          : new Date().toISOString(),
      })),
    };
  }
}

// 하위 호환용 export
export const toUserCreateInput = UserMapper.toUserCreateInput;
export const toUserAuthProfile = UserMapper.toUserAuthProfile;
export const toUserAuthMeResponse = UserMapper.toUserAuthMeResponse;
