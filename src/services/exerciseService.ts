import { Service } from "typedi";
import { getPrisma } from "../loaders/prisma";
import { UserNotFoundError } from "../errors";

@Service()
export default class ExerciseService {
  public async logWater(userId: number, intakeMl: number = 250) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    await prisma.water_logs.create({
      data: {
        user_id: userId,
        intake_ml: intakeMl,
      },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayWaterLogs = await prisma.water_logs.findMany({
      where: {
        user_id: userId,
        recorded_at: { gte: startOfDay },
      },
    });

    const todayTotalWaterMl = todayWaterLogs.reduce((sum: number, log: any) => sum + log.intake_ml, 0);

    const gainedFuel = 10;
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    return {
      todayTotalWaterMl,
      gainedFuel,
      currentFuel: updatedUser.current_fuel ?? 0,
    };
  }

  public async logWorkout(userId: number, memo?: string) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const workout = await prisma.exercise_logs.create({
      data: {
        user_id: userId,
        duration_minutes: 20,
        burned_calories_kcal: 100,
        is_completed: true,
        memo: memo || "오늘 운동 완료!",
      },
    });

    const gainedFuel = 30;
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    return {
      workoutLogId: Number(workout.id),
      gainedFuel,
      currentFuel: updatedUser.current_fuel ?? 0,
    };
  }

  public async recommendExercises(userId: number) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    return {
      exercises: ["가벼운 저녁 산책 20분 🍃", "맨몸 스쿼트 15회 3세트 💪", "스트레칭 10분 🧘"],
    };
  }
}
