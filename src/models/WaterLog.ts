import { getPrisma } from "../loaders/prisma";

export interface WaterLog {
  id: number;
  user_id: number;
  intake_ml: number;
  recorded_at?: Date;
}

export class WaterLogModel {
  /**
   * 사용자의 수분 섭취 로그 목록을 최신순으로 조회합니다.
   */
  public static async findLogsByUserId(userId: number, limit = 20): Promise<WaterLog[]> {
    const prisma = getPrisma();
    const rows = await prisma.water_logs.findMany({
      where: { user_id: userId },
      orderBy: { recorded_at: "desc" },
      take: limit
    });
    return rows.map(r => ({
      id: Number(r.id),
      user_id: r.user_id,
      intake_ml: r.intake_ml,
      recorded_at: r.recorded_at
    }));
  }

  /**
   * 새로운 수분 섭취 기록을 데이터베이스에 추가합니다.
   */
  public static async create(userId: number, intakeMl: number): Promise<number> {
    const prisma = getPrisma();
    const result = await prisma.water_logs.create({
      data: {
        user_id: userId,
        intake_ml: intakeMl
      }
    });
    return Number(result.id);
  }

  /**
   * 금일(오늘 하루 동안) 사용자가 마신 총 수분량(ml)을 구하여 반환합니다.
   */
  public static async getTodayIntake(userId: number): Promise<number> {
    const prisma = getPrisma();
    
    // 오늘 하루 자정(0시 0분 0초) 기준 시간 설정
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await prisma.water_logs.aggregate({
      where: {
        user_id: userId,
        recorded_at: {
          gte: startOfToday
        }
      },
      _sum: {
        intake_ml: true
      }
    });

    return result._sum.intake_ml || 0;
  }
}
