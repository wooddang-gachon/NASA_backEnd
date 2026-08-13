import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma, users } from "@prisma/client";
import { BaseRepository } from "./BaseRepository";

@Service()
export default class AuthRepository extends BaseRepository<
  users,
  Prisma.usersCreateInput,
  Prisma.usersUpdateInput
> {
  constructor() {
    super(getPrisma().users);
  }

  public async findUserByEmail(email: string) {
    return this.findFirst({ email });
  }

  public async findUserById(userId: number) {
    return this.findById(userId);
  }

  public async createUser(data: Prisma.usersCreateInput) {
    return this.create(data);
  }

  public async updateUser(userId: number, data: Prisma.usersUpdateInput) {
    return this.update(userId, data);
  }

  public async deleteUser(userId: number) {
    return this.delete(userId);
  }
}
