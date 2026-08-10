import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma } from "@prisma/client";

@Service()
export default class ChatRepository {
  public async findUserById(userId: number) {
    return getPrisma().users.findUnique({ where: { id: userId } });
  }

  public async createChatMessage(data: Prisma.chat_messagesUncheckedCreateInput) {
    return getPrisma().chat_messages.create({ data });
  }

  public async findRecentChatMessages(userId: number, take: number = 10) {
    return getPrisma().chat_messages.findMany({
      where: { user_id: userId },
      take,
      orderBy: { created_at: "desc" },
    });
  }

  public async updateUserFuel(userId: number, amount: number) {
    return getPrisma().users.update({
      where: { id: userId },
      data: { current_fuel: { increment: amount } },
    });
  }

  public async updateMessageDeletedState(messageId: bigint, isDeleted: boolean) {
    return getPrisma().chat_messages.update({
      where: { id: messageId },
      data: { is_deleted: isDeleted },
    });
  }
}
