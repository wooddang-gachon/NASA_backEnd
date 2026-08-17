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
      mockChatRepository.saveAiResponseAndFuelTransaction.mockResolvedValue({
        tammyMsg: {} as never,
        updatedUser: { current_fuel: 10 } as never,
      });

      mockAiService.processChat.mockResolvedValue({
        replyText: "Hello",
        motionTag: "smile",
      } as never);

      const result = await chatService.processChat(1, "Hi");

      expect(result).toBeDefined();
      expect(
        mockChatRepository.saveAiResponseAndFuelTransaction,
      ).toHaveBeenCalled();
    });

    it("should handle error in finding recent chat messages", async () => {
      mockChatRepository.findUserById.mockResolvedValue({
        nickname: "test",
      } as never);
      mockChatRepository.saveAiResponseAndFuelTransaction.mockResolvedValue({
        tammyMsg: {} as never,
        updatedUser: { current_fuel: 10 } as never,
      });

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

  describe("streamChat", () => {
    it("should stream tokens and return final response", async () => {
      mockChatRepository.findUserById.mockResolvedValue({
        nickname: "test",
      } as never);
      mockChatRepository.saveAiResponseAndFuelTransaction.mockResolvedValue({
        tammyMsg: {} as never,
        updatedUser: { current_fuel: 10 } as never,
      });

      mockAiService.processChat.mockResolvedValue({
        replyText: "Hello world",
        motionTag: "smile",
      } as never);

      const tokens: string[] = [];
      const result = await chatService.streamChat(1, "Hi", (token) => {
        tokens.push(token);
      });

      expect(result).toBeDefined();
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.join("")).toBe("Hello world");
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
