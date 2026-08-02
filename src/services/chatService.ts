import { Service, Inject } from "typedi";
import AiService from "./aiService";
import { getPrisma } from "@/loaders/prisma";
import Logger from "@/loaders/logger";
import type { ChatResponse, MemoryPillDto } from "@/interfaces";

@Service()
export default class ChatService {
  constructor(@Inject() private aiService: AiService) {}

  /**
   * AI 타미 대화 처리, 감정/기억 추출, 기억 캡슐 저장 및 연료 보상
   */
  public async processChat(userId: number, userMessage: string): Promise<ChatResponse> {
    const prisma = getPrisma();

    // 1. 기존 장기 기억 캡슐 목록 수집 (AI에 대화 맥락으로 제공)
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

    // 2. BE -> AI Server 내부 통신 호출 (AI 대화 및 감정/기억 추출)
    const aiResult = await this.aiService.processChat(userId, userMessage, recentMemories);

    // 3. AI가 신규 기억 캡슐을 추출했다면 DB에 저장 (upsert 사용)
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

    // 4. 대화로 인한 연료(+10 Fuel) 충전 및 타미 상태 갱신
    const gainedFuel = 10;
    let currentFuel = 10;

    try {
      const travelState = await prisma.space_travel_states.upsert({
        where: { user_id: userId },
        update: {
          current_fuel: { increment: gainedFuel },
        },
        create: {
          user_id: userId,
          current_fuel: gainedFuel,
        },
      });
      currentFuel = travelState.current_fuel;
    } catch (e) {
      Logger.error(`[ChatService] Failed to update tammy fuel: ${e}`);
    }

    // 5. 최종 대화 응답 반환
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
