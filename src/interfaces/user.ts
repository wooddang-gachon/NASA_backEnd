import { User } from "../models/User";
import { Gender } from "./enums";

export interface UserProfileUpdateRequest {
  nickname?: string;
  gender?: Gender;
  age?: number;
  targetWeightKg?: number;
  preferredExercise?: string;
  exerciseLocation?: string;
  preferredExerciseTime?: string;
  waterGoalMl?: number;
  calorieGoalKcal?: number;
  currentFuel?: number;
}

export class UserProfileResponse {
  id!: number;
  nickname!: string;
  gender?: Gender | null;
  age?: number | null;
  targetWeightKg?: number | null;
  preferredExercise?: string | null;
  exerciseLocation?: string | null;
  preferredExerciseTime?: string | null;
  waterGoalMl?: number | null;
  calorieGoalKcal?: number | null;
  currentFuel?: number | null;
  createdAt!: Date;

  public static fromEntity(user: User): UserProfileResponse {
    const res = new UserProfileResponse();
    res.id = user.id;
    res.nickname = user.nickname;
    res.gender = user.gender;
    res.age = user.age;
    res.targetWeightKg = user.targetWeightKg;
    res.preferredExercise = user.preferredExercise;
    res.exerciseLocation = user.exerciseLocation;
    res.preferredExerciseTime = user.preferredExerciseTime;
    res.waterGoalMl = user.waterGoalMl;
    res.calorieGoalKcal = user.calorieGoalKcal;
    res.currentFuel = user.currentFuel;
    res.createdAt = user.createdAt || new Date();
    return res;
  }
}
