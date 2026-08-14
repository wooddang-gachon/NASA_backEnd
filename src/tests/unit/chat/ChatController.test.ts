import "reflect-metadata";
import { ChatController } from "../../../api/routes/ChatController";
import ChatService from "../../../services/chatService";
import { Container } from "typedi";

jest.mock("../../../services/chatService");

describe("ChatController", () => {
  let controller: ChatController;
  let mockChatService: jest.Mocked<ChatService>;

  beforeEach(() => {
    mockChatService = new ChatService() as jest.Mocked<ChatService>;
    Container.set(ChatService, mockChatService);
    controller = new ChatController();
    (controller as unknown as Record<string, unknown>).success = jest.fn(
      (data, message) => ({
        success: true,
        data,
        message,
      }),
    ) as never;
    (controller as unknown as Record<string, unknown>).getUserId = jest
      .fn()
      .mockReturnValue(1) as never;
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("sendMessage", () => {
    it("should send message successfully", async () => {
      const mockResult = { replyText: "Hello" } as never;
      mockChatService.processChat.mockResolvedValue(mockResult);

      const request = {} as never;
      const body = { messageText: "Hi" } as never;

      await controller.sendMessage(request, body);

      expect(mockChatService.processChat).toHaveBeenCalledWith(1, "Hi");
      expect(
        (controller as unknown as Record<string, unknown>).success,
      ).toHaveBeenCalledWith(mockResult, "메시지가 성공적으로 전달되었습니다.");
    });
  });

  describe("deleteMessage", () => {
    it("should delete message successfully", async () => {
      mockChatService.deleteMessage.mockResolvedValue();

      const request = {} as never;
      await controller.deleteMessage(request, "1");

      expect(mockChatService.deleteMessage).toHaveBeenCalledWith("1");
      expect(
        (controller as unknown as Record<string, unknown>).success,
      ).toHaveBeenCalledWith(null, "메시지가 성공적으로 삭제되었습니다.");
    });
  });

  describe("undoDeleteMessage", () => {
    it("should undo delete message successfully", async () => {
      mockChatService.undoDeleteMessage.mockResolvedValue();

      const request = {} as never;
      await controller.undoDeleteMessage(request, "1");

      expect(mockChatService.undoDeleteMessage).toHaveBeenCalledWith("1");
      expect(
        (controller as unknown as Record<string, unknown>).success,
      ).toHaveBeenCalledWith(null, "메시지 삭제가 취소되었습니다.");
    });
  });
});
