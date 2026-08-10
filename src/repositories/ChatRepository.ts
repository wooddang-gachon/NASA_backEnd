import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma, chat_messages } from "@prisma/client";
import { BaseRepository } from "./BaseRepository";

@Service()
export default class ChatRepository extends BaseRepository<chat_messages, Prisma.chat_messagesCreateInput, Prisma.chat_messagesUpdateInput> {
  constructor() {
    super(getPrisma().chat_messages);
  }

  public async findUserById(userId: number) {
    return getPrisma().users.findUnique({ where: { id: userId } });
  }

  public async createChatMessage(data: Prisma.chat_messagesUncheckedCreateInput) {
    return this.create(data as unknown as Prisma.chat_messagesCreateInput);
  }

  public async findRecentChatMessages(userId: number, take: number = 10) {
    return this.findMany({ user_id: userId }, undefined, take, { created_at: "desc" });
  }

  public async updateUserFuel(userId: number, amount: number) {
    return getPrisma().users.update({
      where: { id: userId },
      data: { current_fuel: { increment: amount } },
    });
  }

  public async updateMessageDeletedState(messageId: bigint, isDeleted: boolean) {
    return this.update(messageId as unknown as number, { is_deleted: isDeleted });
  }
}
