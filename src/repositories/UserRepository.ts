import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma, users } from "@prisma/client";
import { BaseRepository } from "./BaseRepository";

@Service()
export default class UserRepository extends BaseRepository<
  users,
  Prisma.usersCreateInput,
  Prisma.usersUpdateInput
> {
  constructor() {
    super(getPrisma().users);
  }

  public async findUserById(userId: number) {
    return this.findById(userId);
  }

  public async findUserWithTammyStatus(userId: number) {
    return getPrisma().users.findUnique({
      where: { id: userId },
      include: {
        tammy_statuses: true,
      },
    });
  }

  public async findTammyStatusLogs(userId: number, take: number = 20) {
    return getPrisma().tammy_status_logs.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take,
    });
  }

  public async updateUserFuel(userId: number, amount: number) {
    return getPrisma().users.update({
      where: { id: userId },
      data: { current_fuel: { increment: amount } },
    });
  }
}
