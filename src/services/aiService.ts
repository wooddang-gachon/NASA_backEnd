import { Service } from "typedi";

@Service()
export default class AiService {
  /**
   * 프롬프트를 전달받아 AI 모델 텍스트 응답을 생성합니다. (스텁)
   */
  public async generateContent(prompt: string): Promise<string> {
    // TODO: AI SDK (Gemini / OpenAI) 연동 및 스트리밍/생성 처리 로직 구현
    throw new Error("Method not implemented.");
  }
}
