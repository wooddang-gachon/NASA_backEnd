import { Prisma, users } from "@prisma/client";

// ==========================================
// 1. User Auth & Profile DTO Interfaces
// ==========================================

export interface UserSignUpRequest {
  email: string;
  password: string;
  nickname: string;
  gender?: string;
  age?: number;
  targetWeightKg?: number;
  preferredExercise?: string;
  exerciseLocation?: string;
  preferredExerciseTime?: string;
  targetDailyWaterMl?: number;
  targetDailyCaloriesKcal?: number;
}

export interface UserLoginRequest {
  email: string;
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
  accessToken: string;
  refreshToken: string;
}

export interface UserLogoutRequest {
  refreshToken: string;
  userId?: number;
}

export interface UserLogoutResponse {
  success: boolean;
  message: string;
}

export interface TokenRefreshRequest {
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
  reason?: string;
}

export interface UserWithdrawResponse {
  success: boolean;
  message: string;
}

export interface UserProfileResponse {
  userId: number;
  nickname: string;
  gender: string | null;
  age: number | null;
  targetWeightKg: number;
  preferredExercise: string;
  tammyStatus: {
    level: number;
    currentExp: number;
    currentFuel: number;
  };
}

// ==========================================
// 2. Prisma DTO to Input Mappers
// ==========================================

export function toUserCreateInput(
  data: UserSignUpRequest,
  passwordHash: string
): Prisma.usersCreateInput {
  return {
    email: data.email,
    password_hash: passwordHash,
    auth_provider: "LOCAL",
    nickname: data.nickname,
    gender: (data.gender as any) || "UNKNOWN",
    age: data.age || 20,
    target_weight_kg: data.targetWeightKg ? String(data.targetWeightKg) : null,
    preferred_exercise: data.preferredExercise || null,
    exercise_location: data.exerciseLocation || null,
    preferred_exercise_time: data.preferredExerciseTime || null,
    status: "ACTIVE",
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
    space_travel_states: {
      create: {
        current_planet_id: 1,
        current_fuel: 0,
        ship_coordinate_x: 0,
        ship_coordinate_y: 0,
      },
    },
  };
}

export function toUserAuthProfile(user: users): UserAuthProfile {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    authProvider: user.auth_provider,
  };
}

export function toUserAuthMeResponse(user: users): UserAuthMeResponse {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    authProvider: user.auth_provider,
    targetDailyWaterMl: 2000,
    targetDailyCaloriesKcal: 2000,
    createdAt: user.created_at.toISOString(),
  };
}

// ==========================================
// 3. User Domain Entity Model Class
// ==========================================

export type User = UserModel;

export class UserModel {
  public id!: number;
  public email!: string;
  public passwordHash?: string | null;
  public authProvider!: "LOCAL" | "KAKAO" | "GOOGLE" | "APPLE";
  public nickname!: string;
  public gender?: "MALE" | "FEMALE" | "OTHER" | null;
  public age?: number | null;
  public targetWeightKg?: number | null;
  public preferredExercise?: string | null;
  public exerciseLocation?: string | null;
  public preferredExerciseTime?: string | null;
  public refreshToken?: string | null;
  public status!: "ACTIVE" | "INACTIVE" | "WITHDRAWN";
  public lastLoginAt?: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  constructor(init?: Partial<UserModel>) {
    Object.assign(this, init);
  }

  /**
   * ID로 사용자 정보를 조회합니다. (스텁)
   */
  public static async findById(id: number): Promise<UserModel | null> {
    throw new Error("Method not implemented.");
  }

  /**
   * 이메일로 사용자 정보를 조회합니다. (스텁)
   */
  public static async findByEmail(email: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
}
