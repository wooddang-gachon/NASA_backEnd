import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma } from "@prisma/client";

@Service()
export default class QuickLogRepository {
  public async createQuickLog(data: Prisma.quick_logsUncheckedCreateInput) {
    return getPrisma().quick_logs.create({ data });
  }

  public async updateUserFuel(userId: number, amount: number) {
    return getPrisma().users.update({
      where: { id: userId },
      data: {
        current_fuel: { increment: amount },
      },
    });
  }
}
