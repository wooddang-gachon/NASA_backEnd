import { Service } from "typedi";
import AiService from "./aiService";
import TravelService from "./travelService";
import { WaterLogModel } from "../models/WaterLog";
import { EmotionLogModel } from "../models/EmotionLog";
import { ExerciseModel } from "../models/ExerciseLog";
import { ChatRequest, ChatResponse, Action } from "../interfaces";
import Logger from "../loaders/logger";
import { getPrisma } from "../loaders/prisma";

@Service()
export default class ChatService {
  constructor(
    private aiService: AiService,
    private travelService: TravelService
  ) {}

  /**
   * 유저의 대화 메시지를 수신하여 공감 답변을 달고, 
   * 발화에 섞인 건강 기록 의도를 AI가 분류해 DB 자동 적재 및 실시간 액션 리스트를 도출합니다.
   */
  public async processUserMessage(userId: number, request: ChatRequest): Promise<ChatResponse> {
    Logger.info(`AI 대화 세션 처리: message="${request.message}"`);

    // 1. AI 서비스 호출하여 타미의 공감성 챗봇 텍스트 답변 생성
    const replyPrompt = `
      너는 사용자 건강 관리를 돕는 힐링 요정 펫 에이전트 '타미'야. 
      공감·응원·위로가 듬뿍 들어간 귀엽고 친근한 반말(친구 말투)로 2~3문장 이내로 답변해줘.
      사용자 발화: "${request.message}"
    `;
    const reply = await this.aiService.generateContent(replyPrompt);

    // 2. AI 의도 분석 (Intent/Entity Extraction)
    // 자연어 대화 속에 데이터 기록(운동, 물, 기분 등) 의도가 있는지 파악하는 쿼리
    const analysisPrompt = `
      사용자의 대화 메시지를 분석하여 데이터 기록 의도가 있는지 JSON 배열로 분류해줘.
      반환은 오직 JSON 코드 블록 없이 순수한 JSON 텍스트 [ { "type": "...", "payload": {...} } ] 형태로만 대답해.
      가능한 type:
      - "LOG_WATER": 물 마신 언급이 있을 때. payload: { "intakeMl": 수분량숫자(기본 250) }
      - "LOG_EMOTION": 기분이나 스트레스 언급이 있을 때. payload: { "emotionState": "HAPPY"|"SAD"|"ANGRY"|"STRESSED"|"CALM", "causeSummary": "사유" }
      - "LOG_WORKOUT": 특정 운동을 했다고 언급했을 때. payload: { "exerciseName": "운동명", "durationMinutes": 운동시간숫자 }
      
      사용자 메시지: "${request.message}"
    `;
    
    let actions: Action[] = [];
    try {
      const analysisResultText = await this.aiService.generateContent(analysisPrompt);
      
      // JSON 파싱 시도 (AI 생성 텍스트 가공 - 정규식을 사용한 안전한 배열 파싱)
      const jsonMatch = analysisResultText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        actions = JSON.parse(jsonMatch[0]) as Action[];
      } else {
        const singleObjectMatch = analysisResultText.match(/\{[\s\S]*\}/);
        if (singleObjectMatch) {
          actions = [JSON.parse(singleObjectMatch[0])] as Action[];
        }
      }
    } catch (e) {
      Logger.warn("AI 발화 의도 분석 JSON 파싱 실패 (기록 유도 무시):", e);
    }

    // 3. 도출된 액션 리스트가 있다면 DB에 자동 적재 수행
    for (const action of actions) {
      try {
        if (action.type === "LOG_WATER") {
          const ml = action.payload.intakeMl || 250;
          await WaterLogModel.create(userId, ml);
          
          // 연료 보상 연계 (+5)
          const fuel = await this.travelService.addFuel(userId, "FOOD_ANALYZED");
          action.payload.currentFuel = fuel.currentFuel;
          
        } else if (action.type === "LOG_EMOTION") {
          await EmotionLogModel.create(userId, {
            emotion_state: action.payload.emotionState || "CALM",
            cause_summary: action.payload.causeSummary
          });
          
        } else if (action.type === "LOG_WORKOUT") {
          const prisma = getPrisma();
          const exerciseName = action.payload.exerciseName || "스쿼트";
          const durationMinutes = action.payload.durationMinutes || 15;

          // 1) 운동 테이블 마스터 정보 조회 (운동명으로 유연한 검색)
          let exercise = await prisma.exercises.findFirst({
            where: { name: { contains: exerciseName } }
          });

          // DB에 해당 운동 정보가 없는 경우, 기본값(스쿼트 ID: 1) 조회 시도
          if (!exercise) {
            exercise = await prisma.exercises.findUnique({
              where: { id: 1 }
            });
          }

          const exerciseId = exercise ? exercise.id : 1;
          const metValue = exercise ? Number(exercise.met_value) : 7.0;

          // 2) 사용자의 가장 최근 몸무게 기록 조회
          const latestBodyLog = await prisma.user_body_logs.findFirst({
            where: { user_id: userId },
            orderBy: { recorded_at: "desc" }
          });
          const weight = latestBodyLog ? Number(latestBodyLog.weight_kg) : 70.0;

          // 3) MET 공식을 활용한 정밀 칼로리 계산
          // 공식: MET * 0.0175 * 몸무게(kg) * 시간(분)
          const burnedCalories = Math.round(metValue * 0.0175 * weight * durationMinutes);

          await ExerciseModel.createLog({
            user_id: userId,
            exercise_id: exerciseId,
            duration_minutes: durationMinutes,
            burned_calories_kcal: burnedCalories,
            is_completed: true
          });
          
          // 연료 보상 연계 (+10)
          const fuel = await this.travelService.addFuel(userId, "WORKOUT_DONE");
          action.payload.currentFuel = fuel.currentFuel;
        }
      } catch (error) {
        Logger.error(`대화 연동 액션 처리 중 에러 발생: type=${action.type}`, error);
      }
    }

    // 4. 응답 조합 반환 (답변 본문 + 백엔드에서 실시간 처리된 액션 피드백)
    return {
      reply: reply || "어라, 방금 딴생각을 하느라 대답을 못 들었어! 다시 말해줄래? 🧚",
      actions,
      memory: {
        lastInteractionAt: new Date(),
        processedActionsCount: actions.length
      }
    };
  }
}
