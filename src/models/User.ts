export interface User {
  id: number;
  email: string;
  passwordHash?: string;
  authProvider: "LOCAL" | "KAKAO" | "GOOGLE" | "APPLE";
  nickname: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  age?: number;
  targetWeightKg?: number;
  preferredExercise?: string;
  exerciseLocation?: string;
  preferredExerciseTime?: string;
  refreshToken?: string;
  status: "ACTIVE" | "INACTIVE" | "WITHDRAWN";
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserModel {
  /**
   * ID로 사용자 정보를 조회합니다. (스텁)
   */
  public static async findById(id: number): Promise<User | null> {
    throw new Error("Method not implemented.");
  }

  /**
   * 이메일로 사용자 정보를 조회합니다. (스텁)
   */
  public static async findByEmail(email: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
}
