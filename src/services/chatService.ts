import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";
import { Sender } from "../interfaces/enums";
import { ChatMapper } from "../mappers";
import { ChatMessageApiResponse, MemoryPillDto } from "../dto";

@Service()
export default class ChatService {
  @Inject(type => AiService)
  private aiService!: AiService;

  public async processChat(userId: number, userMessage: string): Promise<ChatMessageApiResponse> {
    const prisma = getPrisma();
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    await prisma.chat_messages.create({
      data: ChatMapper.toUserMessageInput(userId, userMessage),
    });

    let history: { role: "user" | "tammy"; text: string; createdAt?: string }[] = [];
    try {
      const dbRecentMsgs = await prisma.chat_messages.findMany({
        where: { user_id: userId },
        take: 10,
        orderBy: { created_at: "desc" },
      });
      history = dbRecentMsgs
        .reverse()
        .map((m) => ({
          role: m.sender === Sender.USER ? ("user" as const) : ("tammy" as const),
          text: m.message_text,
          createdAt: m.created_at ? new Date(m.created_at).toISOString() : undefined,
        }));
    } catch (e) {
      Logger.warn(`[ChatService] Failed to fetch chat history for user ${userId}: ${e}`);
    }

    let aiResult;
    try {
      aiResult = await this.aiService.processChat(userId, userMessage, user.nickname, history);
    } catch (e) {
      Logger.warn(`[ChatService] AI Chat server unavailable fallback mock triggered: ${e}`);
      aiResult = {
        replyText: `안녕하세요 ${user.nickname || "탐험가"}님! 타미가 통신 신호를 수신했어요 📡 지금은 임시 통신 모드이지만, "${userMessage}" 메시지 잘 받았습니다!`,
        motionTag: "HAPPY",
        emotion: {
          state: "HAPPY",
          motionType: "HAPPY",
        },
        extractedMemory: {
          category: "일상기록",
          content: userMessage,
        },
      };
    }

    const tammyMsg = await prisma.chat_messages.create({
      data: ChatMapper.toTammyMessageInput(userId, aiResult.replyText, aiResult.motionTag || aiResult.emotion?.motionType),
    });

    const gainedFuel = 10;
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    return ChatMapper.toResponse(aiResult, tammyMsg, gainedFuel, updatedUser.current_fuel ?? 0);
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

  public async getMemories(userId: number): Promise<MemoryPillDto[]> {
    return [];
  }

  public async deleteMemory(memoryId: number): Promise<void> {
    return;
  }
}
