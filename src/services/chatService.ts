import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "../loaders/prisma";
import Logger from "../loaders/logger";
import ChatRepository from "../repositories/ChatRepository";
import { UserNotFoundError } from "../errors";
import { Sender } from "../interfaces/enums";
import { ChatMapper } from "../mappers";
import { ChatMessageApiResponse } from "../dto";

@Service()
export default class ChatService {
  @Inject((type) => AiService)
  private aiService!: AiService;

  @Inject((type) => ChatRepository)
  private chatRepository!: ChatRepository;

  public async processChat(
    userId: number,
    userMessage: string,
  ): Promise<ChatMessageApiResponse> {
    const user = await this.chatRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    await this.chatRepository.createChatMessage(ChatMapper.toUserMessageInput(userId, userMessage));

    let history: {
      role: "user" | "tammy";
      text: string;
      createdAt?: string;
    }[] = [];
    try {
      const dbRecentMsgs = await this.chatRepository.findRecentChatMessages(userId, 10);
      history = dbRecentMsgs.reverse().map((m) => ({
        role: m.sender === Sender.USER ? ("user" as const) : ("tammy" as const),
        text: m.message_text,
        createdAt: m.created_at
          ? new Date(m.created_at).toISOString()
          : undefined,
      }));
    } catch (e) {
      Logger.warn(
        `[ChatService] Failed to fetch chat history for user ${userId}: ${e}`,
      );
    }

    let aiResult;
    try {
      aiResult = await this.aiService.processChat(
        userId,
        userMessage,
        user.nickname,
        history,
      );
    } catch (e) {
      Logger.warn(
        `[ChatService] AI Chat server unavailable fallback mock triggered: ${e}`,
      );
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

    const tammyMsg = await this.chatRepository.createChatMessage(
      ChatMapper.toTammyMessageInput(
        userId,
        aiResult.replyText,
        aiResult.motionTag || aiResult.emotion?.motionType,
        aiResult.intentLabel ||
          (aiResult.extractedMemory?.category ? "MEMORY_EXTRACT" : "CHAT"),
        aiResult.labels ||
          (aiResult.extractedMemory
            ? { memory: aiResult.extractedMemory }
            : null),
      )
    );

    const gainedFuel = 10;
    const updatedUser = await this.chatRepository.updateUserFuel(userId, gainedFuel);

    return ChatMapper.toResponse(
      aiResult,
      tammyMsg,
      gainedFuel,
      updatedUser.current_fuel ?? 0,
    );
  }

  public async deleteMessage(messageId: string) {
    await this.chatRepository.updateMessageDeletedState(BigInt(messageId), true);
  }

  public async undoDeleteMessage(messageId: string) {
    await this.chatRepository.updateMessageDeletedState(BigInt(messageId), false);
  }
}
