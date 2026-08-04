import { Service, Container } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "@/loaders/prisma";
import Logger from "@/loaders/logger";
import { UserNotFoundError } from "@/errors";
import type { ChatResponse, MemoryPillDto } from "@/interfaces";

@Service()
export default class ChatService {
  private aiService: AiService;

  constructor(aiService?: AiService) {
    this.aiService = aiService || Container.get(AiService);
  }

  /**
   * AI 타미 대화 처리, 감정/기억 추출, 대화 아카이빙 및 기억 캡슐 저장
   */
  public async processChat(userId: number, userMessage: string): Promise<ChatResponse> {
    const prisma = getPrisma();

    // 1. 유저 존재 여부 검증
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. 대화 메시지 라이브 저장 (chat_messages)
    const userMsg = await prisma.chat_messages.create({
      data: {
        user_id: userId,
        sender: "USER",
        message_text: userMessage,
      },
    });

    // 3. 기존 장기 기억 캡슐 목록 수집
    let recentMemories: string[] = [];
    try {
      const dbMemories = await prisma.long_term_memories.findMany({
        where: { user_id: userId },
        take: 5,
        orderBy: { created_at: "desc" },
      });
      recentMemories = dbMemories.map((m) => m.memory_content);
    } catch (e) {
      Logger.warn(`[ChatService] Failed to fetch recent memories for user ${userId}: ${e}`);
    }

    // 4. BE -> AI Server 내부 통신 호출
    const aiResult = await this.aiService.processChat(userId, userMessage, recentMemories);

    // 5. AI 답변 메시지 라이브 저장 및 대화 아카이브 백업 (chat_message_archives)
    const tammyMsg = await prisma.chat_messages.create({
      data: {
        user_id: userId,
        sender: "TAMMY",
        message_text: aiResult.replyText,
      },
    });

    const archive = await prisma.chat_message_archives.create({
      data: {
        user_id: userId,
        chat_message_id: tammyMsg.id,
        sender: "TAMMY",
        message_text: aiResult.replyText,
        raw_payload: JSON.stringify(aiResult),
        created_at: new Date(),
      },
    });

    // 6. 추출된 신규 기억 캡슐 DB 저장 (chat_message_archive_id 연동)
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
        Logger.info(`[ChatService] Saved memory pill linked with archive ${archive.id}`);
      } catch (e) {
        Logger.error(`[ChatService] Failed to save long term memory: ${e}`);
      }
    }

    // 7. 대화로 인한 연료(+10 Fuel) 충전
    const gainedFuel = 10;
    const travelState = await prisma.space_travel_states.update({
      where: { user_id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });

    return {
      reply: aiResult.replyText,
      emotion: aiResult.emotion,
      gainedFuel,
      currentFuel: travelState.current_fuel,
    };
  }

  /**
   * 장기 기억 캡슐 목록 조회
   */
  public async getMemories(userId: number): Promise<MemoryPillDto[]> {
    const prisma = getPrisma();

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError(userId);

    const dbMemories = await prisma.long_term_memories.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return dbMemories.map((m) => ({
      id: m.id,
      category: m.category,
      memoryContent: m.memory_content,
      createdAt: m.created_at.toISOString(),
    }));
  }

  /**
   * 개별 장기 기억 캡슐 삭제
   */
  public async deleteMemory(memoryId: number): Promise<void> {
    const prisma = getPrisma();
    await prisma.long_term_memories.delete({
      where: { id: memoryId },
    });
  }
}
