import { Controller, Route, Post, Delete, Body, Path, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import ChatService from "../../services/chatService";
import { getAuthenticatedUserId, type AuthenticatedRequest } from "../../interfaces/express";
import { ApiResponse } from "../../dto";

import { ChatMessageApiRequest } from "../../dto";

@Service()
@Tags("5. TammyChat - AI 타미 심리 공감 대화")
@Route("chat")
export class ChatController extends Controller {
  private chatService = Container.get(ChatService);

  /**
   * AI 버추얼 펫 타미(TAMMY)와 실시간 심리 공감 대화를 나누고, 모션 태그 응답 수령 및 장기 기억 캡슐을 생성합니다.
   * @summary AI 타미 심리 공감 메시지 전송
   */
  @Post("message")
  @Security("jwt")
  public async sendMessage(
    @Request() request: AuthenticatedRequest,
    @Body() body: ChatMessageApiRequest
  ): Promise<ApiResponse<any>> {
    const userId = getAuthenticatedUserId(request);
    const result = await this.chatService.processChat(userId, body.messageText);
    return ApiResponse.success(result, "메시지가 성공적으로 전달되었습니다.");
  }

  /**
   * [3.4] 대화 메시지 소프트 삭제 API
   */
  @Delete("messages/{messageId}")
  @Security("jwt")
  public async deleteMessage(
    @Request() request: AuthenticatedRequest,
    @Path() messageId: string
  ): Promise<ApiResponse<null>> {
    await this.chatService.deleteMessage(messageId);
    return ApiResponse.success(null as any, "메시지가 성공적으로 삭제되었습니다.");
  }

  /**
   * [3.4] 대화 메시지 삭제 취소 (Undo) API
   */
  @Post("messages/{messageId}/undo")
  @Security("jwt")
  public async undoDeleteMessage(
    @Request() request: AuthenticatedRequest,
    @Path() messageId: string
  ): Promise<ApiResponse<null>> {
    await this.chatService.undoDeleteMessage(messageId);
    return ApiResponse.success(null as any, "메시지 삭제가 취소되었습니다.");
  }
}

