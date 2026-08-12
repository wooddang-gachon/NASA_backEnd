import { Gender, AuthProvider, UserStatus } from "../../interfaces/enums";
import { users, tammy_statuses, ChangeReason } from "@prisma/client";

export type UserWithTammyStatus = users & {
  tammy_statuses?: tammy_statuses | null;
};

export interface DbTammyStatusLogItem {
  id: number | bigint;
  change_reason: ChangeReason | string;
  delta_exp: number;
  snapshot_level: number;
  snapshot_total_exp: number;
  created_at?: Date | string | null;
}

export interface CreateTammyStatusLogParams {
  userId: number;
  changeReason: ChangeReason | string;
  deltaExp: number;
  snapshotLevel: number;
  snapshotTotalExp: number;
}

export interface TammyStatus {
  id?: number;
  userId: number;
  level: number;
  currentExp: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserBodyLog {
  id: number;
  userId: number;
  heightCm: number;
  weightKg: number;
  recordedAt?: Date;
}

export interface UserActionLog {
  id?: number;
  userId: number;
  actionType: string;
  earnedExp: number;
  earnedFuel: number;
  createdAt?: Date;
}

export interface User {
  id: number;
  email: string;
  passwordHash?: string | null;
  nickname: string;
  authProvider: AuthProvider;
  status: UserStatus;
  gender?: Gender | null;
  age?: number | null;
  targetDailyWaterMl?: number | null;
  targetDailyCaloriesKcal?: number | null;
  currentFuel: number;
  tammyStatus?: TammyStatus | null;
  bodyLogs?: UserBodyLog[];
  actionLogs?: UserActionLog[];
  createdAt?: Date;
  updatedAt?: Date;
}
