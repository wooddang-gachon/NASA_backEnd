# AI Server 연동 명세 및 계획 (AI Server Integration Plan)

## 1. AI Server API Endpoints

제공받은 타미(Tammy) AI 서버의 엔드포인트 목록입니다. (Base URL: `https://tammy-ai-server-601688473805.asia-northeast3.run.app`)

| Method | Path | 설명 |
| :--- | :--- | :--- |
| POST | `/v1/vision/analyze-food` | 이미지 → 음식명 배열 + 바운딩 박스 |
| POST | `/v1/nutrition/lookup` | 음식명 배열 → 영양 정보 + 출처 (웹 검색) |
| POST | `/v1/chat/process` | 타미 대화 + 감정 분석 |
| POST | `/v1/reports/diet` | 식습관 리포트 |
| POST | `/v1/reports/mindfulness` | 마음챙김 리포트 |
| POST | `/v1/reports/lifestyle` | 생활습관 리포트 |
| POST | `/v1/reports/hydration` | 수분 리포트 |
| POST | `/v1/reports/retrospective` | 장기 회고 리포트 |
| GET | `/health` | 헬스 체크 (인증 불필요) |
| GET | `/swagger/index.html` | API 문서 |

---

## 2. 백엔드(Node.js) ↔ AI 서버(Python) 연동 계획

### 2.1. 인증 및 통신 설정 (Authentication & Config)
- **Base URL**: 환경 변수 `AI_SERVER_URL`을 통해 주입 (`config.ai.serverUrl`).
- **인증 방식**: 내부 API 키를 사용. 백엔드의 `AI_INTERNAL_API_KEY` 환경 변수를 읽어, AI 서버 요청 시 HTTP 헤더 `X-Internal-Api-Key`에 실어 전송합니다.
- **HTTP 클라이언트**: `axios` 또는 `fetch` 기반의 `AiAdapter` 클래스를 구성하여 모든 통신을 중앙 통제(로깅, 타임아웃, 에러 핸들링 포함)합니다.

### 2.2. 모듈별 API 매핑 및 연동 흐름

#### A. 비전 스캔 및 영양 정보 조회 (Food / Vision)
- **대상 AI API**: `/v1/vision/analyze-food` (음식 식별), `/v1/nutrition/lookup` (영양소 매핑)
- **백엔드 Flow (`POST /api/v1/food-vision/scan`)**:
  1. 클라이언트로부터 이미지를 수신.
  2. `AiAdapter`를 통해 AI 서버의 `/v1/vision/analyze-food` 호출 
  3. 추출된 음식명 배열을 다시 AI 서버의 `/v1/nutrition/lookup`에 던져 상세 칼로리 및 영양소 데이터 확보.
  4. 클라이언트(App)에 바운딩 박스와 영양소 정보를 조합하여 반환.

#### B. 타미(Tammy)와의 대화 (Chat / Emotion)
- **대상 AI API**: `/v1/chat/process`
- **백엔드 Flow (`POST /api/v1/chat/message`)**:
  1. 클라이언트가 전송한 유저 메시지(text)를 수신.
  2. DB에서 해당 유저의 최근 대화 내역(Context)을 조회.
  3. AI 서버의 `/v1/chat/process`로 `메시지 + 컨텍스트`를 전달.
  4. 응답받은 타미의 텍스트와 추출된 유저의 감정(Emotion) 상태를 `chats` DB에 저장 후 클라이언트에 반환.

#### C. 별여행 및 리포트 생성 (Travel / Reports)
- **대상 AI API**: `/v1/reports/diet`, `/v1/reports/mindfulness`, `/v1/reports/lifestyle`, `/v1/reports/hydration`, `/v1/reports/retrospective`
- **백엔드 Flow (`POST /api/v1/planet-travel/start`)**:
  1. 유저가 탐사할 행성 타입(`MEAL`, `WATER`, `EMOTION` 등)을 선택하여 요청.
  2. 백엔드는 선택된 테마에 맞춰 AI 서버의 해당 리포트 엔드포인트를 호출.
     - 예: `MEAL` 행성 → `/v1/reports/diet` 호출 (최근 식단 데이터 첨부)
     - 예: `WATER` 행성 → `/v1/reports/hydration` 호출 (최근 수분 섭취 데이터 첨부)
  3. 생성된 리포트(마크다운, 체크리스트, 타이틀 등)를 가공하여 `travel_results` 테이블에 저장 및 클라이언트 응답.

---

## 3. 에러 핸들링 및 타임아웃 전략
- **타임아웃(Timeout) 설정**: AI 모델의 추론 특성상 응답 지연이 발생할 수 있으므로, Axios 호출 시 넉넉한 타임아웃(예: 30초~60초)을 설정합니다.
- **Strict 503 에러 핸들링**: AI 서버 응답 실패나 타임아웃 시 **절대 임의의 가짜(Mock) 데이터를 내려주지 않고**, 즉각적으로 `503 Service Unavailable` 에러를 클라이언트(프론트엔드)에 반환하여 시스템의 장애를 명확히 인지할 수 있도록 합니다.
- **재시도 로직(Retry)**: 일시적인 네트워크 지연이나 AI 서버 부하를 대비하여, 실패 시 **정확히 최대 3회(Max Retries: 3)**까지 재시도(Exponential Backoff 패턴 적용)합니다. 3회 모두 실패하면 503 에러를 던집니다.
