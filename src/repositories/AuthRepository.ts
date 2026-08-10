import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma } from "@prisma/client";

@Service()
export default class AuthRepository {
  public async findUserByEmail(email: string) {
    const prisma = getPrisma();
    return prisma.users.findUnique({
      where: { email },
    });
  }

  public async findUserById(userId: number) {
    const prisma = getPrisma();
    return prisma.users.findUnique({
      where: { id: userId },
    });
  }

  public async createUser(data: Prisma.usersCreateInput) {
    const prisma = getPrisma();
    return prisma.users.create({ data });
  }

  public async updateUser(userId: number, data: Prisma.usersUpdateInput) {
    const prisma = getPrisma();
    return prisma.users.update({
      where: { id: userId },
      data,
    });
  }

  public async deleteUser(userId: number) {
    const prisma = getPrisma();
    return prisma.users.delete({
      where: { id: userId },
    });
  }
}
