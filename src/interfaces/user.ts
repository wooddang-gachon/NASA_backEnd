import { User } from "../repositories/models/User";
import { Gender } from "./enums";

export interface UserProfileUpdateRequest {
  nickname?: string;
  gender?: Gender;
  age?: number;
  currentFuel?: number;
}

export class UserProfileResponse {
  id!: number;
  nickname!: string;
  gender?: Gender | null;
  age?: number | null;
  currentFuel?: number | null;
  createdAt!: Date;

  public static fromEntity(user: User): UserProfileResponse {
    const res = new UserProfileResponse();
    res.id = user.id;
    res.nickname = user.nickname;
    res.gender = user.gender;
    res.age = user.age;
    res.currentFuel = user.currentFuel;
    res.createdAt = user.createdAt || new Date();
    return res;
  }
}
