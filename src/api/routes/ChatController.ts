import { Controller, Route, Post, Body, Query } from "tsoa";
import { Service } from "typedi";
import ChatService from "../../services/chatService";
import type { ChatRequest, ChatResponse } from "../../interfaces";

@Service()
@Route("ai/chat")
export class ChatController extends Controller {
  constructor(private chatService: ChatService) {
    super();
  }

  /**
   * 사용자의 자연어 발화를 입력받아 AI 에이전트 답변 및 자동 행동(Action)을 트리거합니다.
   */
  @Post("")
  public async handleChat(
    @Query() userId: number,
    @Body() requestBody: ChatRequest
  ): Promise<ChatResponse> {
    return await this.chatService.processUserMessage(userId, requestBody);
  }
}
