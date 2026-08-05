# TAMMY v3 백엔드 가짜 구현(Mock/Stub) 및 향후 구동 TODO 리스트

본 문서는 TAMMY v3 백엔드 시스템 개발 과정에서 프로토타입/가짜(Mock/Stub) 형태로 임시 구현된 항목과 향후 실서버 상용화를 위해 추가 구현이 필요한 TODO 작업 목록입니다.

---

## 1. AI 서버 실연동 파이프라인 (Python FastAPI tammy-agent)

- **[ ] AI 비전 스캔 (YOLO + Vision LLM Engine) 연동**
  - **위치**: `src/services/aiService.ts` (`analyzeFoodVision`), `src/services/foodService.ts`
  - **현황**: AI 서버 미연동 시 가짜 닭가슴살 샐러드 객체를 반환하도록 Fallback 시뮬레이션 처리됨.
  - **TODO**: 이미지 512x512 압축 후 1차 내장 YOLO 검토 ➔ 미식별 시 `http://ai-server:8000/v1/vision/scan` 파이프라인 실연동.

- **[ ] AI 심리 공감 대화 & 모션태그 실연동**
  - **위치**: `src/services/aiService.ts` (`processChat`), `src/services/chatService.ts`
  - **현황**: AI 대화 서버 미구동 시 가짜 공감 메시지 및 기본 모션태그(`COMFORT_WARM`) 반환.
  - **TODO**: AI 서버 `http://ai-server:8000/v1/chat/process` 실통신 응답 바인딩 및 프로필 Context Injection 보강.

- **[ ] 5대 행성 맞춤 AI 리포트 생성 실연동**
  - **위치**: `src/services/aiService.ts` (`summarizeWellnessReport`), `src/services/reportService.ts`
  - **현황**: 가짜 주간 통계 수치 및 샘플 진단 문장 반환.
  - **TODO**: 실제 유저의 정량 수치 집계 페이로드 전달 후 `http://ai-server:8000/v1/reports/summarize` 실연동.

---

## 2. 비동기 작업 큐 및 백그라운드 Worker (BullMQ / Redis)

- **[ ] 별여행 탐사 비동기 리포트 백그라운드 Worker 구현**
  - **위치**: `src/services/reportService.ts` (`generateAsyncReport`)
  - **현황**: `setTimeout` 가짜 비동기 타이머로 시뮬레이션 처리됨.
  - **TODO**: Redis + BullMQ (또는 RabbitMQ) 기반 작업 큐 구축 및 백그라운드 Worker 프로세스에서 AI 리포트 비동기 수령/DB 저장 처리.

---

## 3. 푸시 알림 엔진 (FCM / APNs)

- **[ ] 디바이스 푸시 토큰 관리 & FCM 발송 연동**
  - **위치**: `src/api/routes/NotificationController.ts`
  - **현황**: 토큰 수신 시 가짜 성공 메시지만 반환함.
  - **TODO**: 디바이스 푸시 토큰 저장 테이블(`user_push_tokens`) 생성 및 Firebase Admin SDK 연동하여 탐사 완료/트리거 발생 시 실제 Push Notification 발송.

---

## 4. 회원 인증 & 소셜 OAuth 2.0 연동

- **[ ] 카카오 / 구글 / 애플 소셜 로그인 실연동**
  - **위치**: `src/services/authService.ts`, `src/api/routes/AuthController.ts`
  - **현황**: 이메일/비밀번호 기반 로컬(LOCAL) 가입/로그인 위주로 구현됨.
  - **TODO**: Kakao/Google OAuth 2.0 Access Token 검증 SDK 연동 및 JWT Refresh Token Redis 저장소 관리.

---

## 5. 5대 행성 게이미피케이션 목표 자동 검증 스케줄러

- **[ ] 행성 탐사(IN_PROGRESS ➔ COMPLETED) 목표 달성 자동 검수**
  - **위치**: `src/services/travelService.ts`, `src/jobs/`
  - **현황**: 탐사 출발(`IN_PROGRESS`) 및 연료 소진까지 구현됨.
  - **TODO**: node-cron 또는 백그라운드 스케줄러를 통해 5대 행성 특화 조건(`meal_planets`, `water_planets` 등) 달성 여부 주기적 검사 후 자동으로 탐사 완료(`COMPLETED`) 상태로 전환하고 리포트 발행.
