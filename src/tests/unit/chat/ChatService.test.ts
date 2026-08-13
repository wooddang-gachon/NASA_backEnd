import "reflect-metadata";
import ChatService from "../../../services/chatService";
import AiService from "../../../services/aiService";
import ChatRepository from "../../../repositories/ChatRepository";
import { Container } from "typedi";
import { UserNotFoundError } from "../../../errors";
import { Sender } from "../../../interfaces/enums";

jest.mock("../../../services/aiService");
jest.mock("../../../repositories/ChatRepository");

describe("ChatService", () => {
  let chatService: ChatService;
  let mockAiService: jest.Mocked<AiService>;
  let mockChatRepository: jest.Mocked<ChatRepository>;

  beforeEach(() => {
    mockAiService = new AiService() as jest.Mocked<AiService>;
    mockChatRepository = new ChatRepository() as jest.Mocked<ChatRepository>;

    Container.set(AiService, mockAiService);
    Container.set(ChatRepository, mockChatRepository);

    chatService = Container.get(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("processChat", () => {
    it("should throw UserNotFoundError if user not found", async () => {
      mockChatRepository.findUserById.mockResolvedValue(null);

      await expect(chatService.processChat(1, "Hi")).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it("should process chat and return response", async () => {
      mockChatRepository.findUserById.mockResolvedValue({
        nickname: "test",
      } as never);
      mockChatRepository.createChatMessage.mockResolvedValue({} as never);
      mockChatRepository.findRecentChatMessages.mockResolvedValue([
        {
          sender: Sender.USER,
          message_text: "Hi",
          created_at: new Date(),
        } as never,
      ]);
      mockChatRepository.updateUserFuel.mockResolvedValue({
        current_fuel: 10,
      } as never);

      mockAiService.processChat.mockResolvedValue({
        replyText: "Hello",
        motionTag: "smile",
      } as never);

      const result = await chatService.processChat(1, "Hi");

      expect(result).toBeDefined();
      expect(mockChatRepository.createChatMessage).toHaveBeenCalledTimes(2); // User msg and Tammy msg
      expect(mockAiService.processChat).toHaveBeenCalledWith(
        1,
        "Hi",
        "test",
        expect.any(Array),
      );
      expect(mockChatRepository.updateUserFuel).toHaveBeenCalled();
    });

    it("should handle error in finding recent chat messages", async () => {
      mockChatRepository.findUserById.mockResolvedValue({
        nickname: "test",
      } as never);
      mockChatRepository.createChatMessage.mockResolvedValue({} as never);
      mockChatRepository.findRecentChatMessages.mockRejectedValue(
        new Error("DB Error"),
      );
      mockChatRepository.updateUserFuel.mockResolvedValue({
        current_fuel: 10,
      } as never);

      mockAiService.processChat.mockResolvedValue({
        replyText: "Hello",
        motionTag: "smile",
      } as never);

      const result = await chatService.processChat(1, "Hi");

      expect(result).toBeDefined();
      expect(mockAiService.processChat).toHaveBeenCalledWith(
        1,
        "Hi",
        "test",
        [],
      );
    });
  });

  describe("deleteMessage", () => {
    it("should update message deleted state to true", async () => {
      mockChatRepository.updateMessageDeletedState.mockResolvedValue(
        {} as never,
      );

      await chatService.deleteMessage("1");

      expect(mockChatRepository.updateMessageDeletedState).toHaveBeenCalledWith(
        BigInt(1),
        true,
      );
    });
  });

  describe("undoDeleteMessage", () => {
    it("should update message deleted state to false", async () => {
      mockChatRepository.updateMessageDeletedState.mockResolvedValue(
        {} as never,
      );

      await chatService.undoDeleteMessage("1");

      expect(mockChatRepository.updateMessageDeletedState).toHaveBeenCalledWith(
        BigInt(1),
        false,
      );
    });
  });
});
