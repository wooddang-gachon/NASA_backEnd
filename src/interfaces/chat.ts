export interface Action {
  /**
   * 프론트엔드가 실행해야 할 액션 종류
   * @example "LOG_WORKOUT"
   */
  type: "LOG_WORKOUT" | "LOG_MEAL" | "LOG_WATER" | "LOG_EMOTION" | "ADD_FUEL" | "UPDATE_MEMORY";
  
  /**
   * 해당 액션에 따르는 상세 데이터 payload
   * @example { "exerciseName": "스쿼트", "durationMinutes": 30 }
   */
  payload: any;
}

export interface ChatRequest {
  /**
   * AI 에이전트(타미)에게 보낼 자연어 메시지입니다.
   * @minLength 1 메시지는 비어 있을 수 없습니다.
   * @maxLength 1000 메시지는 최대 1000자까지 전송할 수 있습니다.
   * @example "오늘 스쿼트 30분 하고 물 한잔 마셨어!"
   */
  message: string;
}

export interface ChatResponse {
  /**
   * AI 요정 타미가 사용자에게 보내는 답변 텍스트입니다.
   * @example "오늘 스쿼트 30분을 완수하다니 대단해! 물 한 잔도 챙겨 마신 기특한 행동을 기록에 반영했어. 우주선 연료도 10% 더 채웠지롱! 🚀"
   */
  reply: string;

  /**
   * 사용자의 입력 발화를 분석하여 자동으로 데이터베이스에 저장 및 동기화된 액션 리스트입니다.
   */
  actions?: Action[];

  /**
   * 사용자와의 대화에서 누적된 취향, 목표 체중, 선호 사항 등 장기 기억 요약 정보입니다.
   */
  memory?: any;
}
