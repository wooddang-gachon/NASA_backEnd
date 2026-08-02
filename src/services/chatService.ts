import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "@/loaders/prisma";
import Logger from "@/loaders/logger";
import { UserNotFoundError } from "@/utils/errors";
import type { ChatResponse, MemoryPillDto } from "@/interfaces";

@Service()
export default class ChatService {
  constructor(@Inject() private aiService: AiService) {}

  /**
   * AI 타미 대화 처리, 감정/기억 추출, 기억 캡슐 저장 및 연료 보상
   */
  public async processChat(userId: number, userMessage: string): Promise<ChatResponse> {
    const prisma = getPrisma();

    // 1. 유저 존재 여부 검증 (자동 생성 금지)
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. 기존 장기 기억 캡슐 목록 수집 (AI 대화 맥락용)
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

    // 3. BE -> AI Server 내부 통신 호출
    const aiResult = await this.aiService.processChat(userId, userMessage, recentMemories);

    // 4. 추출된 신규 기억 캡슐 DB 저장
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
          },
          create: {
            user_id: userId,
            category: aiResult.extractedMemory.category,
            memory_content: aiResult.extractedMemory.content,
          },
        });
        Logger.info(`[ChatService] Saved new memory pill for user ${userId}`);
      } catch (e) {
        Logger.error(`[ChatService] Failed to save long term memory: ${e}`);
      }
    }

    // 5. 대화로 인한 연료(+10 Fuel) 충전
    const gainedFuel = 10;
    let currentFuel = 10;

    const travelState = await prisma.space_travel_states.update({
      where: { user_id: userId },
      data: {
        current_fuel: { increment: gainedFuel },
      },
    });
    currentFuel = travelState.current_fuel;

    return {
      reply: aiResult.replyText,
      emotion: aiResult.emotion,
      gainedFuel,
      currentFuel,
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
