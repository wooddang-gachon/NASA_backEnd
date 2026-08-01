import { getPrisma } from "../loaders/prisma";

export interface TammyStatus {
  user_id: number;
  level: number;
  current_exp: number;
  empathy_index: number;
  health_index: number;
  activity_index: number;
  happiness_index: number;
  updated_at?: Date;
}

export class TammyStatusModel {
  /**
   * 특정 사용자의 요정 캐릭터 상태 정보를 조회합니다. (1:1 관계)
   */
  public static async findByUserId(userId: number): Promise<TammyStatus | null> {
    const prisma = getPrisma();
    const status = await prisma.tammy_statuses.findUnique({
      where: { user_id: userId }
    });
    return status || null;
  }

  /**
   * 신규 사용자의 요정 캐릭터 초기 스탯을 등록합니다.
   */
  public static async create(status: TammyStatus): Promise<boolean> {
    const prisma = getPrisma();
    const result = await prisma.tammy_statuses.create({
      data: {
        user_id: status.user_id,
        level: status.level,
        current_exp: status.current_exp,
        empathy_index: status.empathy_index,
        health_index: status.health_index,
        activity_index: status.activity_index,
        happiness_index: status.happiness_index
      }
    });
    return !!result;
  }

  /**
   * 요정 캐릭터의 경험치 획득, 레벨업, 스탯(인덱스) 변화를 업데이트합니다.
   */
  public static async update(userId: number, fields: Partial<Omit<TammyStatus, "user_id" | "updated_at">>): Promise<boolean> {
    const prisma = getPrisma();
    const result = await prisma.tammy_statuses.update({
      where: { user_id: userId },
      data: fields
    });
    return !!result;
  }
}
