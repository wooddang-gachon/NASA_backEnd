import { Controller, Route, Post, Get, Delete, Body, Query, Path } from "tsoa";
import { Service } from "typedi";
import ChatService from "../../services/chatService";
import type { ChatRequest, ChatResponse, MemoryPillDto } from "../../interfaces";

@Service()
@Route("ai")
export class ChatController extends Controller {
  constructor(private chatService: ChatService) {
    super();
  }

  /**
   * AI 타미 심리 공감 대화 & 자동 감정/기억 추출
   */
  @Post("chat")
  public async processChat(
    @Query() userId: number,
    @Body() requestBody: ChatRequest
  ): Promise<ChatResponse> {
    return await this.chatService.processChat(userId, requestBody.message);
  }

  /**
   * 호환성용 메서드
   */
  public async processUserMessage(requestBody: ChatRequest): Promise<ChatResponse> {
    return await this.chatService.processChat(1, requestBody.message);
  }
}

@Service()
@Route("chat")
export class MemoryController extends Controller {
  constructor(private chatService: ChatService) {
    super();
  }

  /**
   * 장기 기억 캡슐 목록 조회
   */
  @Get("memories")
  public async getMemories(@Query() userId: number): Promise<{ memories: MemoryPillDto[] }> {
    const memories = await this.chatService.getMemories(userId);
    return { memories };
  }

  /**
   * 개별 장기 기억 캡슐 삭제
   */
  @Delete("memories/{id}")
  public async deleteMemory(@Path() id: number): Promise<void> {
    await this.chatService.deleteMemory(id);
  }
}
