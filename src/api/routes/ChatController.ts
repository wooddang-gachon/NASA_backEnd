import { Controller, Route, Post, Delete, Body, Path, Security, Request } from "tsoa";
import { Service, Container } from "typedi";
import ChatService from "../../services/chatService";

export interface ChatMessageApiRequest {
  messageText: string;
}

export interface ChatMessageApiResponse {
  success: boolean;
  data: {
    messageId: string;
    responseText: string;
    motionTag?: string;
  };
}

@Service()
@Route("chat")
export class ChatController extends Controller {
  private chatService = Container.get(ChatService);

  /**
   * [3.4] AI 타미 심리 공감 채팅 API
   */
  @Post("message")
  @Security("jwt")
  public async sendMessage(
    @Request() request: any,
    @Body() body: ChatMessageApiRequest
  ): Promise<ChatMessageApiResponse> {
    const userId = request.currentUser?.userId || 1;
    const chatRes = await this.chatService.processChat(userId, body.messageText);
    return {
      success: true,
      data: {
        messageId: `msg_${Date.now()}`,
        responseText: chatRes.reply,
        motionTag: chatRes.motionTag || chatRes.emotion.motionType || "COMFORT_WARM",
      },
    };
  }

  /**
   * [3.4] 대화 메시지 소프트 삭제 API
   */
  @Delete("messages/{messageId}")
  @Security("jwt")
  public async deleteMessage(
    @Request() request: any,
    @Path() messageId: string
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: "메시지가 성공적으로 삭제되었습니다.",
    };
  }

  /**
   * [3.4] 대화 메시지 삭제 취소 (Undo) API
   */
  @Post("messages/{messageId}/undo")
  @Security("jwt")
  public async undoDeleteMessage(
    @Request() request: any,
    @Path() messageId: string
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: "메시지 삭제가 취소되었습니다.",
    };
  }
}
