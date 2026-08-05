import { Service, Container } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";
import { Sender } from "../interfaces/enums";

@Service()
export default class ChatService {
  private aiService: AiService;

  constructor(aiService?: AiService) {
    this.aiService = aiService || Container.get(AiService);
  }

  public async processChat(userId: number, userMessage: string) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    await prisma.chat_messages.create({
      data: {
        user_id: userId,
        sender: Sender.USER,
        message_text: userMessage,
      },
    });

    let recentMemories: string[] = [];
    try {
      const dbMemories = await prisma.long_term_memories.findMany({
        where: { user_id: userId },
        take: 5,
        orderBy: { updated_at: "desc" },
      });
      recentMemories = dbMemories.map((m) => m.memory_content);
    } catch (e) {
      Logger.warn(`[ChatService] Failed to fetch recent memories for user ${userId}: ${e}`);
    }

    const aiResult = await this.aiService.processChat(userId, userMessage, recentMemories);

    const tammyMsg = await prisma.chat_messages.create({
      data: {
        user_id: userId,
        sender: Sender.TAMMY_AI,
        message_text: aiResult.replyText,
        motion_tag: aiResult.motionTag || aiResult.emotion?.motionType || "COMFORT_WARM",
      },
    });

    const archive = await prisma.chat_message_archives.create({
      data: {
        user_id: userId,
        chat_message_id: tammyMsg.id,
        sender: Sender.TAMMY_AI,
        message_text: aiResult.replyText,
        raw_payload: JSON.parse(JSON.stringify(aiResult)),
        created_at: new Date(),
      },
    });

    if (aiResult.extractedMemory) {
      try {
        await prisma.long_term_memories.upsert({
          where: {
            user_id_category: {
              user_id: userId,
              category: aiResult.extractedMemory.category,
            },
          },
          update: {
            memory_content: aiResult.extractedMemory.content,
            chat_message_archive_id: archive.id,
          },
          create: {
            user_id: userId,
            category: aiResult.extractedMemory.category,
            memory_content: aiResult.extractedMemory.content,
            chat_message_archive_id: archive.id,
          },
        });
      } catch (e) {
        Logger.error(`[ChatService] Failed to save long term memory: ${e}`);
      }
    }

    const gainedFuel = 10;
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    return {
      reply: aiResult.replyText,
      emotion: aiResult.emotion,
      motionTag: tammyMsg.motion_tag || "COMFORT_WARM",
      gainedFuel,
      currentFuel: updatedUser.current_fuel ?? 0,
    };
  }

  public async deleteMessage(messageId: string) {
    const prisma = getPrisma();
    await prisma.chat_messages.update({
      where: { id: BigInt(messageId) },
      data: { is_deleted: true },
    });
  }

  public async undoDeleteMessage(messageId: string) {
    const prisma = getPrisma();
    await prisma.chat_messages.update({
      where: { id: BigInt(messageId) },
      data: { is_deleted: false },
    });
  }

  public async getMemories(userId: number) {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const dbMemories = await prisma.long_term_memories.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: "desc" },
    });

    return dbMemories.map((m) => ({
      id: m.id,
      category: m.category,
      memoryContent: m.memory_content,
      createdAt: m.updated_at.toISOString(),
    }));
  }

  public async deleteMemory(memoryId: number): Promise<void> {
    const prisma = getPrisma();
    await prisma.long_term_memories.delete({
      where: { id: memoryId },
    });
  }
}
