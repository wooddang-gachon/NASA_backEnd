import { Service } from "typedi";
import { UserModel } from "../models/User";
import { UserBodyLogRequest, UserProfileUpdateRequest, UserProfileResponse } from "../interfaces";

@Service()
export default class UserService {
  /**
   * 특정 사용자의 상세 프로필 정보를 조회합니다.
   */
  public async getUserProfile(userId: number): Promise<UserProfileResponse> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("존재하지 않는 사용자입니다.");
    }

    return UserProfileResponse.fromEntity(user);
  }

  /**
   * 사용자의 닉네임, 성별, 나이, 목표 체중 등의 프로필 설정을 업데이트합니다.
   */
  public async updateUserProfile(userId: number, fields: UserProfileUpdateRequest): Promise<boolean> {
    const updatePayload: any = {};
    if (fields.nickname !== undefined) updatePayload.nickname = fields.nickname;
    if (fields.gender !== undefined) updatePayload.gender = fields.gender;
    if (fields.age !== undefined) updatePayload.age = fields.age;
    if (fields.targetWeightKg !== undefined) updatePayload.target_weight_kg = fields.targetWeightKg;
    if (fields.preferredExercise !== undefined) updatePayload.preferred_exercise = fields.preferredExercise;
    if (fields.exerciseLocation !== undefined) updatePayload.exercise_location = fields.exerciseLocation;
    if (fields.preferredExerciseTime !== undefined) updatePayload.preferred_exercise_time = fields.preferredExerciseTime;

    return await UserModel.update(userId, updatePayload);
  }

  /**
   * 사용자의 최근 신체 스펙(키, 몸무게) 로그를 업데이트합니다.
   */
  public async updateBodySpec(userId: number, bodyLog: UserBodyLogRequest): Promise<boolean> {
    // 유저의 목표/현재 몸무게 상태를 갱신
    return await UserModel.update(userId, {
      target_weight_kg: bodyLog.weightKg
    });
  }
}
