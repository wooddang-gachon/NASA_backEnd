import { Service, Inject } from "typedi";
import { FUEL_REWARDS } from "@/constants/gamification";
import AiService from "./aiService";
import Logger from "../loaders/logger";
import ChatRepository from "../repositories/ChatRepository";
import { UserNotFoundError } from "../errors";
import { Sender } from "../interfaces/enums";
import { ChatMapper } from "../mappers";
import { ChatMessageApiResponse } from "../dto";

@Service()
export default class ChatService {
  @Inject((_type) => AiService)
  private aiService!: AiService;

  @Inject((_type) => ChatRepository)
  private chatRepository!: ChatRepository;

  public async processChat(
    userId: number,
    userMessage: string,
  ): Promise<ChatMessageApiResponse> {
    const user = await this.chatRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    await this.chatRepository.createChatMessage(
      ChatMapper.toUserMessageInput(userId, userMessage),
    );

    let history: {
      role: "user" | "tammy";
      text: string;
      createdAt?: string;
    }[] = [];
    try {
      const dbRecentMsgs = await this.chatRepository.findRecentChatMessages(
        userId,
        10,
      );
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

    const aiResult = await this.aiService.processChat(
      userId,
      userMessage,
      user.nickname,
      history,
    );

    const gainedFuel = FUEL_REWARDS.CHAT;
    const { tammyMsg, updatedUser } =
      await this.chatRepository.saveAiResponseAndFuelTransaction(
        userId,
        ChatMapper.toTammyMessageInput(
          userId,
          aiResult.replyText,
          aiResult.motionTag || aiResult.emotion?.motionType,
          aiResult.intentLabel ||
            (aiResult.extractedMemory?.category ? "MEMORY_EXTRACT" : "CHAT"),
          aiResult.labels ||
            (aiResult.extractedMemory
              ? ({
                  memory: aiResult.extractedMemory,
                } as import("@prisma/client").Prisma.InputJsonValue)
              : undefined),
        ),
        gainedFuel,
      );

    return ChatMapper.toResponse(
      aiResult,
      tammyMsg,
      gainedFuel,
      updatedUser.current_fuel ?? 0,
    );
  }

  /**
   * AI 타미 실시간 SSE 스트리밍 대화 처리
   */
  public async streamChat(
    userId: number,
    userMessage: string,
    onToken: (token: string) => void,
  ): Promise<ChatMessageApiResponse> {
    const user = await this.chatRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    await this.chatRepository.createChatMessage(
      ChatMapper.toUserMessageInput(userId, userMessage),
    );

    let history: {
      role: "user" | "tammy";
      text: string;
      createdAt?: string;
    }[] = [];
    try {
      const dbRecentMsgs = await this.chatRepository.findRecentChatMessages(
        userId,
        10,
      );
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

    const aiResult = await this.aiService.processChat(
      userId,
      userMessage,
      user.nickname,
      history,
    );

    // 단어/토큰 단위 실시간 전송 시뮬레이션 (글자가 실시간으로 타자쳐지는 효과)
    const replyWords = aiResult.replyText.split(/(\s+)/);
    for (const word of replyWords) {
      onToken(word);
    }

    const gainedFuel = FUEL_REWARDS.CHAT;
    const { tammyMsg, updatedUser } =
      await this.chatRepository.saveAiResponseAndFuelTransaction(
        userId,
        ChatMapper.toTammyMessageInput(
          userId,
          aiResult.replyText,
          aiResult.motionTag || aiResult.emotion?.motionType,
          aiResult.intentLabel ||
            (aiResult.extractedMemory?.category ? "MEMORY_EXTRACT" : "CHAT"),
          aiResult.labels ||
            (aiResult.extractedMemory
              ? ({
                  memory: aiResult.extractedMemory,
                } as import("@prisma/client").Prisma.InputJsonValue)
              : undefined),
        ),
        gainedFuel,
      );

    return ChatMapper.toResponse(
      aiResult,
      tammyMsg,
      gainedFuel,
      updatedUser.current_fuel ?? 0,
    );
  }

  public async deleteMessage(messageId: string) {
    await this.chatRepository.updateMessageDeletedState(
      BigInt(messageId),
      true,
    );
  }

  public async undoDeleteMessage(messageId: string) {
    await this.chatRepository.updateMessageDeletedState(
      BigInt(messageId),
      false,
    );
  }
}
