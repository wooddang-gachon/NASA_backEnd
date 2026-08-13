import { Gender } from "../interfaces/enums";

export interface TammyStatusDto {
  level: number;
  currentExp: number;
}

export interface UserProfileResponseData {
  userId: number;
  nickname: string;
  gender?: Gender | string | null;
  age?: number | null;
  currentFuel?: number | null;
  tammyStatus?: TammyStatusDto;
  createdAt?: Date | string;
}

export interface TammyHistoryLogItem {
  id: number;
  changeReason: string;
  deltaExp: number;
  snapshotLevel: number;
  snapshotTotalExp: number;
  createdAt: Date | string;
}

export interface TammyHistoryResponse {
  logs: TammyHistoryLogItem[];
}
