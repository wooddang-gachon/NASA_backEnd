import { User } from "../models/User";
import { Gender } from "./enums";

export interface UserProfileUpdateRequest {
  /**
   * 변경할 사용자 닉네임 (선택)
   * @maxLength 20
   * @example "멋진우주비행사"
   */
  nickname?: string;

  /**
   * 사용자 성별 (선택)
   * @example "MALE"
   */
  gender?: Gender;

  /**
   * 사용자 나이 (선택)
   * @minimum 0
   * @example 28
   */
  age?: number;

  /**
   * 목표 몸무게 (kg) (선택)
   * @minimum 0
   * @example 65.5
   */
  targetWeightKg?: number;

  /**
   * 선호하는 운동 종목 (선택)
   * @example "달리기, 스쿼트"
   */
  preferredExercise?: string;

  /**
   * 주로 운동하는 장소 (선택)
   * @example "실내"
   */
  exerciseLocation?: string;

  /**
   * 선호하는 운동 시간대 (선택)
   * @example "저녁 8시"
   */
  preferredExerciseTime?: string;
}

export class UserProfileResponse {
  /**
   * 사용자 고유 ID
   * @example 1
   */
  id!: number;

  /**
   * 사용자 닉네임
   * @example "우주여행자"
   */
  nickname!: string;

  /**
   * 사용자 성별
   * @example "FEMALE"
   */
  gender?: Gender | null;

  /**
   * 사용자 나이
   * @example 25
   */
  age?: number | null;

  /**
   * 목표 몸무게 (kg)
   * @example 60
   */
  targetWeightKg?: number | null;

  /**
   * 선호하는 운동
   * @example "필라테스"
   */
  preferredExercise?: string | null;

  /**
   * 운동 공간
   * @example "실외"
   */
  exerciseLocation?: string | null;

  /**
   * 선호 운동 시간
   * @example "아침"
   */
  preferredExerciseTime?: string | null;

  /**
   * 계정 가입 시각
   */
  createdAt!: Date;

  /**
   * DB Entity 객체로부터 DTO 인스턴스를 안전하게 조립하는 정적 팩토리 메서드 (IoC/DI 캡슐화)
   */
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
    res.createdAt = user.createdAt || new Date();
    return res;
  }
}
