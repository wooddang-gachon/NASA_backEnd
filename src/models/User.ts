import { getPrisma } from "../loaders/prisma";
import { Prisma } from "@prisma/client";

export interface User {
  id: number;
  nickname: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  age?: number | null;
  target_weight_kg?: number | null;
  preferred_exercise?: string | null;
  exercise_location?: string | null;
  preferred_exercise_time?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  /**
   * 특정 ID로 사용자 상세 정보를 조회합니다.
   */
  public static async findById(id: number): Promise<User | null> {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({
      where: { id }
    });

    if (!user) return null;

    return {
      ...user,
      gender: user.gender as any,
      target_weight_kg: user.target_weight_kg ? Number(user.target_weight_kg) : undefined
    };
  }

  /**
   * 신규 사용자를 등록합니다.
   */
  public static async create(user: Omit<User, "id" | "created_at" | "updated_at">): Promise<number> {
    const prisma = getPrisma();
    const result = await prisma.users.create({
      data: {
        nickname: user.nickname,
        gender: user.gender as any,
        age: user.age,
        target_weight_kg: user.target_weight_kg ? new Prisma.Decimal(user.target_weight_kg) : null,
        preferred_exercise: user.preferred_exercise,
        exercise_location: user.exercise_location,
        preferred_exercise_time: user.preferred_exercise_time
      }
    });
    return result.id;
  }

  /**
   * 사용자의 신체 스펙 및 신상 정보를 업데이트합니다.
   */
  public static async update(id: number, fields: Partial<Omit<User, "id" | "created_at" | "updated_at">>): Promise<boolean> {
    const prisma = getPrisma();
    
    const updateData: any = { ...fields };
    if (fields.target_weight_kg !== undefined) {
      updateData.target_weight_kg = fields.target_weight_kg ? new Prisma.Decimal(fields.target_weight_kg) : null;
    }
    if (fields.gender !== undefined) {
      updateData.gender = fields.gender as any;
    }

    const result = await prisma.users.update({
      where: { id },
      data: updateData
    });
    
    return !!result;
  }

  /**
   * 사용자 계정을 삭제합니다.
   */
  public static async delete(id: number): Promise<boolean> {
    const prisma = getPrisma();
    const result = await prisma.users.delete({
      where: { id }
    });
    return !!result;
  }
}
