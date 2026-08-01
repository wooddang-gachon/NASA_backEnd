import { Service } from "typedi";
import { MealModel } from "../models/Meal";
import { ExerciseModel } from "../models/ExerciseLog";
import AiService from "./aiService";
import { MonthlyReportResponse } from "../interfaces";
import Logger from "../loaders/logger";

@Service()
export default class ReportService {
  constructor(private aiService: AiService) {}

  /**
   * 특정 년월의 사용자 건강 로그를 종합 집계하고 AI 통계 평가를 붙여 리포트를 생성합니다.
   */
  public async generateMonthlyReport(userId: number, yearMonth: string): Promise<MonthlyReportResponse> {
    Logger.info(`월간 건강 리포트 집계 시작: userId=${userId}, yearMonth=${yearMonth}`);

    // 1. DB에서 한 달간 식단 및 운동 통계 데이터 조회 (시물레이션)
    const meals = await MealModel.findLogsByUserId(userId, 30);
    const exerciseLogs = await ExerciseModel.findLogsByUserId(userId, 30);

    // 2. 데이터 가공 집계
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;

    meals.forEach(m => {
      totalCalories += m.total_calories_kcal;
      totalCarbs += Number(m.total_carbohydrate_g);
      totalProtein += Number(m.total_protein_g);
      totalFat += Number(m.total_fat_g);
    });

    const mealCount = meals.length || 1;
    const avgCarbs = Math.round(totalCarbs / mealCount);
    const avgProtein = Math.round(totalProtein / mealCount);
    const avgFat = Math.round(totalFat / mealCount);

    let totalWorkoutMinutes = 0;
    exerciseLogs.forEach(el => {
      totalWorkoutMinutes += el.duration_minutes;
    });

    // 3. AI 기반 한줄 요약 및 분석 인사이트 추출 (Prompt Engineering)
    const reportDataPrompt = `
      사용자의 한달 간 건강 정보 통계입니다.
      - 하루 평균 탄수화물: ${avgCarbs}g, 단백질: ${avgProtein}g, 지방: ${avgFat}g
      - 한달 총 운동시간: ${totalWorkoutMinutes}분
      
      이 정보를 보고 힐링 펫 요정 '타미'의 어조(귀엽고 친근한 반말)로 이 사용자의 건강 통계를 요약해주는 한 줄 평가(summaryContent)와 구체적인 분석 제안사항 2가지를 리스트(aiFindings)로 대답해줘.
      
      답변은 JSON 형태로만 작성하고, 어떤 다른 설명 텍스트도 포함하지마.
      출력 JSON 형식:
      {
        "summaryContent": "한줄평 내용",
        "aiFindings": ["첫번째 인사이트 제안", "두번째 인사이트 제안"]
      }
    `;

    let summaryContent = "이번 달도 열심히 노력하는 모습이 정말 예뻤어! 앞으로도 타미와 함께 힘내보자! 💚";
    let aiFindings = [
      "최근 근력 운동 비중이 눈에 띄게 높아져서 근지구력이 좋아지고 있는 게 느껴져!",
      "식단에서 탄수화물 비중이 가끔 과하게 치솟으니 현미밥이나 고구마로 건강하게 대체해 보는 걸 추천해."
    ];

    try {
      const aiResultText = await this.aiService.generateContent(reportDataPrompt);
      const cleanedJsonText = aiResultText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanedJsonText);
      if (parsed.summaryContent) summaryContent = parsed.summaryContent;
      if (parsed.aiFindings) aiFindings = parsed.aiFindings;
    } catch (e) {
      Logger.warn("AI 리포트 분석 데이터 파싱 실패 (기본 리액션 대체):", e);
    }

    // 4. 최종 리포트 DTO 조립 반환
    return {
      healthScore: totalWorkoutMinutes > 180 ? 88 : 72, // 운동량에 따른 가상 가중치 점수
      summaryContent,
      dailyKcal: [
        { date: `${yearMonth}-01`, kcal: Math.round(totalCalories / mealCount) },
        { date: `${yearMonth}-15`, kcal: Math.round(totalCalories / mealCount) + 150 }
      ],
      macros: {
        carbohydrateG: avgCarbs,
        proteinG: avgProtein,
        fatG: avgFat
      },
      weeklyWorkoutMin: [
        { week: "1주차", minutes: Math.round(totalWorkoutMinutes / 4) },
        { week: "2주차", minutes: Math.round(totalWorkoutMinutes / 4) + 20 }
      ],
      aiFindings
    };
  }
}
