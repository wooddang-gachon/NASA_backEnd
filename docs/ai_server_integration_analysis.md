# TAMMY AI 서버 (ai-swagger.yaml) 명세 분석 및 백엔드 연동 가이드

본 문서는 `docs/ai-swagger.yaml` 명세서를 바탕으로 **AI 서버(tammy-ai-server)**와 **서비스 백엔드(NASA_backEnd)** 간의 데이터 교환 규약, 필드 매핑 및 백엔드 수정 필요 사항을 정리한 통합 분석 문서입니다.

---

## 1. AI 서버 접속 및 보안 인증 규약

- **Base URL**: `http://ai-server:8000` (또는 환경변수 `config.ai.serverUrl`)
- **보안 헤더**: `X-Internal-Api-Key: <INTERNAL_API_KEY>` (필수 전송)
- **헬스 체크**: `GET /healthz` (인증 불필요)

---

## 2. API 엔드포인트 7종 연동 명세 & 백엔드 대응 전략

### 2.1 [Chat] 타미 심리 공감 대화 (`POST /v1/chat/process`)

* **기능**: 사용자 메시지와 이전 대화 히스토리를 전달받아 타미 페르소나의 공감 응답 및 사용자 감정 상태/캐릭터 반응 모션을 반환합니다.
* **BE ➔ AI 요청 페이로드**:
  - `userId`: 유저 ID (integer, 필수)
  - `userMessage`: 사용자 발화 텍스트 (string, 필수)
  - `nickname`: 유저 호칭 닉네임 (string, 선택)
  - `history`: 이전 대화 턴 배열 (`ChatTurn[]`, 선택 - 최근 30턴만 전달)
    - `role`: "user" | "tammy"
    - `text`: 대화 내용
    - `createdAt`: RFC3339 일시 (예: "2026-08-05T21:14:00Z")

* **AI ➔ BE 응답 페이로드**:
  - `replyText`: 타미 공감 응답 메시지 (string)
  - `emotion`: 감정 상태 객체
    - `state`: EmotionState enum (`HAPPY`, `SAD`, `ANGRY`, `STRESSED`, `CALM`) ➔ DB `emotion_logs`에 직접 매핑 가능
    - `motionType`: 타미 모션 애니메이션 태그 (`PAT_PAT_HEAD` 등)

* **백엔드(`src/services/chatService.ts` & `aiService.ts`) 수정 포인트**:
  - 기존 `recentMemories` 전달 방식에서 `history: ChatTurn[]` 형태 및 `nickname` 전달 방식으로 변경.
  - 헤더에 `X-Internal-Api-Key` 추가.

---

### 2.2 [Vision] 식단 사진 음식 분석 (`POST /v1/vision/analyze-food`)

* **기능**: 식단 사진을 받아 음식 위치(바운딩 박스)와 음식명을 인식합니다. (영양 정보는 포함하지 않음)
* **BE ➔ AI 요청 페이로드**:
  - `imageUrl`: 공개 이미지 URL (string, 선택)
  - `imageBase64`: Base64 인코딩 이미지 스트링 (string, 선택)
  - `mealType`: 식사 타입 (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`)

* **AI ➔ BE 응답 페이로드**:
  - `isIdentified`: 인식 성공 여부 (boolean)
  - `comment`: 타미의 한마디 코멘트 (string)
  - `foods`: 인식된 음식 정보 배열 (`name`, `confidence`, `boundingBox`)

---

### 2.3 [Nutrition] 음식명 영양 정보 조회 (`POST /v1/nutrition/lookup`)

* **기능**: 음식 이름 목록을 전달받아 웹 검색을 통해 칼로리, 3대 영양소, 비타민/무기질 충족률 및 출처를 조회합니다.
* **BE ➔ AI 요청 페이로드**:
  - `foodNames`: 음식명 배열 (string[], minItems: 1)

* **AI ➔ BE 응답 페이로드**:
  - `items`: 영양 성분 정보 배열 (`name`, `servingSizeG`, `caloriesKcal`, `carbohydrateG`, `proteinG`, `fatG`, `vitaminPercent`, `mineralPercent`, `confidence`, `sources`)

* **백엔드 연동 포인트**:
  - `/v1/vision/analyze-food`에서 추출된 음식명 배열로 영양 조회를 연속 호출하여 식단 등록(`POST /api/food-log/confirm`) 데이터로 활용.

---

### 2.4 [Reports] 5대 행성 테마별 탐사 결과 리포트 생성 (`POST /v1/reports/*`)

AI 서버는 5대 행성 테마별로 전용 리포트 생성 엔드포인트를 제공합니다.

1. **식단 행성 (`MEAL`) ➔ `POST /v1/reports/diet`**
   - 요청: `userId`, `nickname`, `period` (`start`, `end`), `dailyRecords` (`date`, `meals`: [`mealType`, `foods`: [`name`, `caloriesKcal`, `carbohydrateG`, `proteinG`, `fatG`]])
2. **수분 행성 (`WATER`) ➔ `POST /v1/reports/hydration`**
   - 요청: `userId`, `nickname`, `period`, `dailyGoalMl`, `waterLogs` (`date`, `intakeMl`, `recordedAt`)
3. **운동 행성 (`LIFESTYLE`) ➔ `POST /v1/reports/lifestyle`**
   - 요청: `userId`, `nickname`, `period`, `exerciseLogs` (`date`, `exerciseName`, `durationMinutes`, `burnedCaloriesKcal`, `isCompleted`), `dailySteps`
4. **감정 행성 (`EMOTION`) ➔ `POST /v1/reports/mindfulness`**
   - 요청: `userId`, `nickname`, `period`, `chatLogs` (`role`, `text`, `createdAt`)
5. **회고별 행성 (`RETROSPECT`) ➔ `POST /v1/reports/retrospective`**
   - 요청: `userId`, `nickname`, `period`, `waterLogs`, `exerciseLogs`, `dailyRecords`, `chatLogs` 전체 종합 데이터

* **AI ➔ BE 공통 응답 (`ReportResponse`)**:
  - `title`: 탐사 결과 제목 (string)
  - `markdown`: AI 탐사 결과 마크다운 본문 (string)
  - `nextActionChecks`: 맞춤 추천 가이드라인 배열 (string[])

* **백엔드(`src/services/travelResultService.ts` & `aiService.ts`) 수정 포인트**:
  - 기존 단일 `POST /v1/reports/summarize` 호출 방식을 행성 타입(`PlanetType`)에 맞춰 5개 전용 엔드포인트로 조건 분기 호출.

---

## 3. 백엔드 코드 연동 체크리스트

- [ ] **보안 헤더 추가**: `src/services/aiService.ts` 내 모든 fetch 요청 헤더에 `"X-Internal-Api-Key": config.ai.apiKey` 추가.
- [ ] **대화 DTO 맞춤**: `ChatService.processChat`에서 DB `chat_messages` 조회 결과로 `history: ChatTurn[]` 구성하여 AI 서버 호출.
- [ ] **탐사 결과 엔드포인트 분기**: `AiService` 내에 행성 타입별(`MEAL`, `WATER`, `LIFESTYLE`, `EMOTION`, `RETROSPECT`) AI 리포트 호출 메서드 추가 및 매핑.
