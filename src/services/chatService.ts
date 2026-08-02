import { Service } from "typedi";
import AiService from "./aiService";
import TravelService from "./travelService";
import { ChatRequest, ChatResponse } from "../interfaces";
import Logger from "../loaders/logger";

@Service()
export default class ChatService {
  constructor(
    private aiService: AiService,
    private travelService: TravelService
  ) {}

  /**
   * 유저의 대화 메시지를 수신하여 AI 공감 답변 및 자동 액션을 처리합니다. (스텁)
   */
  public async processUserMessage(userId: number, request: ChatRequest): Promise<ChatResponse> {
    Logger.info(`[ChatService] 대화 메시지 수신: userId=${userId}`);

    // TODO: 1. AI 서비스 호출 (대화 응답 + 의도/Action 파악)
    // TODO: 2. 수신된 Action에 대한 백엔드 DB 저장 및 연료 보상 연계 처리

    throw new Error("Method not implemented.");
  }
}
