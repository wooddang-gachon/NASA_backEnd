# TAMMY 백엔드 서비스 기능 명세서 (Backend Service Specification)

본 문서는 프론트엔드 최종 기획서인 [front_plan.md](file:///docs/references/front_plan.md)의 기능 요구사항과 백엔드 Express 라우터 및 서비스 비즈니스 로직, 그리고 Prisma DB 테이블 간의 연동 관계를 일목요연하게 매핑한 통합 기술 명세 정의서입니다.

---

## 1. 아키텍처 및 통신 환경 개요

- **주요 기술 스택**: Node.js, Express, TSOA (자동 routes/spec 컴파일), TypeDI (IoC 의존성 주입), Prisma Client
- **API 기본 경로(Base Path)**: `http://localhost:3000/api`
- **실시간 API 문서 (Swagger UI)**: `http://localhost:3000/api/docs`
- **데이터베이스 전환 모드 (.env 설정)**:
  - `NODE_ENV=TEST` 설정 시 자동으로 Mock Database (`nasa_mock_db`) 주소로 Express 서버 및 Prisma Studio가 전환 접속됩니다.
  - `NODE_ENV`를 제거하거나 `development` 지정 시 일반 운영 Database (`nasa_db`)로 분기 처리됩니다.

---

## 2. 백엔드 기능 매핑 마스터 테이블 (Master Mapping Table)

| 대도메인 | 프론트 화면 & 기획 요구사항 | 백엔드 API 엔드포인트 | 호출 메서드 | 연동 백엔드 서비스 (`src/services/`) | 대상 Prisma 데이터베이스 테이블 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Users** | JWT 토큰을 통한 사용자 프로필 확인 및 마이페이지 방문일 계산 | `GET /api/users/me` | `getMe` | `UserService` | `users` |
| **AI/Chat** | AI 펫 타미와의 공감 대화 및 발화 의도 분석을 통한 건강 로그 실시간 자동 분기 저장 | `POST /api/ai/chat` | `handleChat` | `ChatService` & `AiService` | `chat_messages`, `water_logs`, `emotion_logs`, `exercise_logs` |
| **Food** | 식단 이미지의 영양소 분석(시뮬레이션) 및 식습관 로그 DB 적재 + 우주선 연료 획득 | `POST /api/food/analyze`<br>`POST /api/food/log` | `analyzeFood`<br>`registerMealLog` | `FoodService` & `TravelService` | `meals`, `meal_items`, `space_travel_states` |
| **Exercise** | 신체 스펙에 기반한 AI 맞춤형 운동 코스 추천 및 운동 완수 기록에 따른 우주선 연료 획득 | `GET /api/exercise/recommend`<br>`POST /api/exercise/log` | `recommendExercise`<br>`recordWorkout` | `ExerciseService` & `TravelService` | `exercise_logs`, `space_travel_states` |
| **Space Travel** | 우주선 연료율(0~100%), 좌표 기반 비행 모션, 행성 워프 및 행성별 AI 성장 요약 리포트 제공 | `GET /api/travel/state`<br>`POST /api/travel/fuel` | `getTravelState`<br>`addFuel` | `TravelService` | `space_travel_states`, `planet_histories` |
| **Reports** | 한 달 식단(탄단지) 차트 및 총 운동량 집계에 따른 타미 페르소나 적용 AI 맞춤 통계 리포트 즉시(On-demand) 빌드 | `GET /api/reports/monthly` | `getMonthlyReport` | `ReportService` & `AiService` | `meals`, `meal_items`, `exercise_logs` |

---

## 3. 도메인 서비스별 상세 명세

### 3.1 사용자 프로필 관리 (Users Domain)
- **컨트롤러**: [UserController.ts](file:///src/api/routes/UserController.ts)
- **비즈니스 로직**: `UserService.getUserProfile(userId)`
- **동작 특징**:
  - 클라이언트가 헤더에 첨부한 JWT Token을 인증 미들웨어가 해석하여 `currentUser.userId`를 바인딩합니다.
  - 해당 ID를 이용해 데이터베이스에서 닉네임, 키, 몸무게, 목표 체중 등을 다이렉트로 조회해 반환합니다.

### 3.2 AI 대화 및 자동 기록 (AI/Chat Domain)
- **컨트롤러**: [ChatController.ts](file:///src/api/routes/ChatController.ts)
- **비즈니스 로직**: `ChatService.processUserMessage(userId, request)`
- **동작 특징**:
  - **공감 답변**: LLM(NVIDIA API)을 경유하여 타미의 시그니처 톤인 귀여운 반말투로 2~3줄 이내의 공감 답변 텍스트를 즉시 생성합니다.
  - **자연어 의도 분석**: LLM 프롬프트를 통해 사용자의 대화 문장 속에서 건강 행동 의도가 섞여 있는지 자동으로 판정해 JSON 배열 형태로 분류합니다.
  - **DB 자동 저장 및 보상 연동**:
    - `LOG_WATER` 감지 시: `water_logs`에 섭취량 자동 인서트 + 우주선 연료 즉시 획득
    - `LOG_EMOTION` 감지 시: 사용자의 감정 상태(HAPPY, CALM, STRESSED 등) 및 스트레스 원인 한줄평을 `emotion_logs`에 인서트
    - `LOG_WORKOUT` 감지 시: 사용자의 최근 몸무게와 운동의 MET 지수를 조합해 정밀 칼로리를 공식에 맞춰 자동 연산하고, `exercise_logs` 인서트 + 우주선 연료 획득

### 3.3 식단 분석 및 섭취 등록 (Food Domain)
- **컨트롤러**: [FoodController.ts](file:///src/api/routes/FoodController.ts)
- **비즈니스 로직**: `FoodService`
- **동작 특징**:
  - **이미지 비전 분석**: 사진 및 식사 구분을 입력받아 가상의 비전 AI 모델을 모의 가동해 칼로리, 탄수화물, 단백질, 지방을 추출하고 이에 맞춘 타미의 감정 조언 피드백 문장을 결합해 응답합니다.
  - **식사 기록 적재**: 사용자가 "기록하기"를 확정하면 `meals` 및 `meal_items` 테이블에 개별 상세 음식 구성과 함께 영구히 적재하고 우주선 연료를 즉시 추가 충전합니다. (보상 연료: +5%)

### 3.4 AI 운동 추천 및 이력 저장 (Exercise Domain)
- **컨트롤러**: [ExerciseController.ts](file:///src/api/routes/ExerciseController.ts)
- **비즈니스 로직**: `ExerciseService`
- **동작 특징**:
  - **맞춤 난이도 분기**: 사용자의 프로필 신체 스펙(목표 몸무게 등)을 판별하여, 관절을 보호하기 위한 순한 유산소&코어 코스(난이도: LOW) 또는 타미와 함께하는 하체 불태우기 코스(난이도: MEDIUM)를 동적으로 분기하여 맞춤형 운동 카드 리스트를 반환합니다.
  - **운동 완료 및 연료 보상**: 실제 완료된 세트와 지속 시간, 소모 칼로리를 전달받아 `exercise_logs` 테이블에 적재하고 우주선 연료를 획득합니다. (보상 연료: +10%)

### 3.5 우주여행 및 성장 리포트 (Space Travel Domain)
- **컨트롤러**: [TravelController.ts](file:///src/api/routes/TravelController.ts)
- **비즈니스 로직**: `TravelService`
- **동작 특징**:
  - **실시간 좌표 비행**: 사용자가 식단을 기록하거나 운동을 완수할 때마다 연료 게이지가 누적 처리되며 우주선의 좌표값(X, Y)이 실시간으로 증가합니다.
  - **테마 행성 워프**: 연료가 100% 충전되면 자동으로 다음 테마 행성(💪 운동별 행성 -> 🍽 영양별 행성 -> 😊 감정별 행성 등)으로 정밀 이전 처리되며, 행성 도달 시 AI 성장 요약 리포트 팝업 데이터를 생성하여 오버레이 카드로 응답합니다.

### 3.6 온디맨드 월간 건강 리포트 (Reports Domain)
- **컨트롤러**: [ReportController.ts](file:///src/api/routes/ReportController.ts)
- **비즈니스 로직**: `ReportService.generateMonthlyReport(userId, yearMonth)`
- **동작 특징**:
  - 고정된 정적 데이터를 반환하지 않고, 요청 시점 기준으로 해당 사용자의 한 달 간 실제 섭취 식단 평균 정보 및 운동 시간 집계 데이터를 DB에서 직접 Fetch합니다.
  - 이 통계 원본 데이터를 LLM 프롬프트에 실어 타미의 말투와 어조를 반영한 문장형 인사이트 코멘트와 다음 달 권장 행동 제안사항을 실시간으로 조립해 종합 진단 보고서 형태로 컴파일 후 제공합니다.

---

## 4. 향후 차세대 아키텍처 및 비용 최적화 로드맵
RAG 도입 시점 및 식단 비전 분석(Food Vision) 토큰/비용 최적화 관련 향후 기술 발전 계획은 [future_architecture_plan.md](file:///Users/wooddang-mac/Desktop/code/1.%20Study/NASA_backEnd/docs/future_architecture_plan.md) 문서를 참고하시기 바랍니다.

