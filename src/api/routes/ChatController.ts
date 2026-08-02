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
   * 사용자의 발화 메시지를 수신하여 AI 답변 및 자동 의도/액션을 처리합니다.
   */
  @Post("")
  public async handleChat(
    @Query() userId: number,
    @Body() requestBody: ChatRequest
  ): Promise<ChatResponse> {
    return await this.chatService.processUserMessage(userId, requestBody);
  }
}
