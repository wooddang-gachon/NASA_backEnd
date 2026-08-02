export interface User {
  id: number;
  nickname: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  age?: number;
  targetWeightKg?: number;
  preferredExercise?: string;
  exerciseLocation?: string;
  preferredExerciseTime?: string;
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
}
