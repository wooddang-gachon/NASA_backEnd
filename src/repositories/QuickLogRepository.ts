import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma, quick_logs } from "@prisma/client";
import { BaseRepository } from "./BaseRepository";

@Service()
export default class QuickLogRepository extends BaseRepository<
  quick_logs,
  Prisma.quick_logsCreateInput,
  Prisma.quick_logsUpdateInput
> {
  constructor() {
    super(getPrisma().quick_logs);
  }

  public async createQuickLog(data: Prisma.quick_logsUncheckedCreateInput) {
    return this.create(data as unknown as Prisma.quick_logsCreateInput);
  }

  public async createQuickLogAndFuelTransaction(
    userId: number,
    data: Prisma.quick_logsUncheckedCreateInput,
    fuelAmount: number,
  ) {
    return getPrisma().$transaction(async (tx) => {
      const log = await tx.quick_logs.create({
        data: data as unknown as Prisma.quick_logsCreateInput,
      });
      const updatedUser = await tx.users.update({
        where: { id: userId },
        data: { current_fuel: { increment: fuelAmount } },
      });
      return { log, updatedUser };
    });
  }
}
