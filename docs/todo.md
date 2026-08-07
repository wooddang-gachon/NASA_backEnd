# TAMMY v3 백엔드 상용화(Production) 전체 TODO & 체크리스트

본 문서는 TAMMY v3 백엔드 시스템 개발 과정에서 프로토타입/가짜(Mock/Stub) 형태로 임시 구현된 항목과 실제 프로덕션 상용화 배포 시 완료되어야 하는 전체 TODO 작업 목록입니다.

---

## 🚨 학술제 시제품(MVP) 시연 전 최우선 해결 과제 (Critical Checklist)

- **[x] JWT 인증 미들웨어 유저 하드코딩 해제 및 실토큰 바인딩**
  - **위치**: `src/api/middlewares/authentication.ts`
  - **현황**: `jwt.verify`로 실인증 토큰 검증 및 `userId` 동적 바인딩 적용 완료. (테스트용 `mock_` 토큰 및 `userId` 쿼리 호환성 유지)

- **[x] AI 서버 통신 및 예외 처리(Fallback) 보강**
  - **위치**: `src/services/aiService.ts`, `src/services/chatService.ts`, `src/services/travelResultService.ts`
  - **현황**: `ai-swagger.yaml` 명세 기반 `X-Internal-Api-Key` 인증 헤더 구축 완료. AI 서버 통신 실패 시에도 서비스가 중단되지 않고 안전하게 기본 공감 멘트/기본 비전 스캔/기본 탐사 결과를 반환하는 예외 처리 적용 완료.

- **[x] 별여행 탐사 출발 시 AI 탐사 결과(travelResult) 즉시 동기 생성 & DB 조회 연결**
  - **위치**: `src/services/travelService.ts`, `src/api/routes/TravelController.ts`, `src/api/routes/TravelResultController.ts`
  - **현황**: FCM 푸시 알림 없이 별여행 탐사 출발(`POST /api/planet-travel/start`) 시 유저 수치 기반 AI 탐사 결과(`travelResult`)를 즉시 동기 생성해 `travelResultId`와 함께 반환. `GET /api/travel-results/{travelResultId}` 및 `GET /api/reports/{reportId}` 실제 DB 조회 연동 완료.

---

## 1. AI 서버 실연동 파이프라인 (Python FastAPI tammy-agent)

- **[x] 로컬 이미지 업로드 & AI 비전 스캔 (YOLO + Vision LLM Engine) 연동**
  - **위치**: `src/loaders/express.ts`, `src/api/routes/UploadController.ts`, `src/api/routes/FoodController.ts`
  - **현황**: `POST /v1/vision/analyze-food` 및 `POST /v1/nutrition/lookup` 연동 파이프라인 완료. 로컬 `/uploads` 이미지 경량화 압축(512x512) 후 Base64 전송 지원.
  - **TODO (상용화 시)**: 추후 상용화 전환 시 AWS S3 / Google Cloud Storage(GCS) 오브젝트 스토리지 연동 및 CDN URL 반환 고려.

- **[x] AI 심리 공감 대화 & 모션태그 실연동**
  - **위치**: `src/services/aiService.ts` (`processChat`), `src/services/chatService.ts`
  - **현황**: `http://ai-server:8000/v1/chat/process` 실통신 응답 바인딩 완료. DB의 최근 10턴 대화 히스토리(`history: ChatTurn[]`) 및 유저 닉네임 전송, 감정 상태(`state`) 및 모션태그(`motionType`) 수령 및 DB 저장 연동 완수.

- **[x] 5대 행성 맞춤 AI 리포트/탐사 결과 생성 실연동**
  - **위치**: `src/services/aiService.ts` (`generatePlanetReport`), `src/services/travelResultService.ts`
  - **현황**: 행성 테마(`MEAL`, `WATER`, `LIFESTYLE`, `EMOTION`, `RETROSPECT`)별로 `POST /v1/reports/diet`, `hydration`, `lifestyle`, `mindfulness`, `retrospective` 5대 전용 엔드포인트 분기 호출 및 DB `reports` 저장 연동 완수.

---

## 2. 비동기 작업 큐 및 백그라운드 Worker (BullMQ / Redis)

- **[x] 별여행 탐사 비동기 리포트 백그라운드 큐 유틸 구현**
  - **위치**: `src/utils/asyncQueue.ts`, `src/services/travelResultService.ts`
  - **현황**: In-Memory Async Queue 유틸리티(`src/utils/asyncQueue.ts`) 구현 완료. 백그라운드 태스크 순차 실행, 상태 및 진척도 관리 구현됨.

- **[ ] Redis 기반 BullMQ 분산 큐로 전환**
  - **위치**: `src/utils/asyncQueue.ts`, `src/jobs/`
  - **TODO (상용화 시)**: 서버 다중화(Multi-node) 환경 대응을 위해 In-Memory 큐를 Redis 기반 BullMQ로 교체하고, 독립적인 백그라운드 Worker 프로세스로 분리.

---

## 3. 푸시 알림 엔진 (FCM / APNs) [RPT-003]

- **[x] 디바이스 푸시 토큰 관리 & FCM 알림 모듈 구축**
  - **위치**: `src/api/routes/NotificationController.ts`, `src/services/notificationService.ts`, `prisma/schema.prisma`
  - **현황**: `user_push_tokens` DB 모델 및 `POST /api/notifications/push-token` 토큰 등록 API 구현 완료.
  - **Firebase Key**: `src/config/firebase-service-account.json` (`nasa-alarm` 비공개 키) 실연동 바인딩 완료.

---

## 4. 회원 인증, 보안 & 소셜 OAuth 2.0 연동

- **[x] 카카오 / 구글 / 애플 소셜 로그인 파이프라인 연동**
  - **위치**: `src/services/authService.ts`, `src/api/routes/AuthController.ts`
  - **현황**: `POST /api/auth/social-login` 엔드포인트 구축 완료. Google/Kakao OAuth API(`googleapis.com/oauth2/v3/userinfo`, `kapi.kakao.com/v2/user/me`) 실검증 및 자동 회원가입/JWT 발급 처리.
  - **Mock/Fallback**: 실서버 검증 실패 시 테스트 및 프론트엔드 연동 개발 편의를 위해 `mock_google_`, `mock_kakao_`, `mock_apple_` 토큰에 대한 테스트 유저 생성 시뮬레이션 Fallback 로직 반영.

- **[ ] 상용화 소셜 인증 보안 강화 & Mock 토큰 제거**
  - **위치**: `src/services/authService.ts`
  - **TODO (상용화 시)**:
    1. 개발용 Mock 토큰 Fallback 제거 및 환경변수(`ENABLE_MOCK_AUTH=false`) 조건화.
    2. Apple Identity Token (JWT public key) 실검증 라이브러리 연결.
    3. Redis를 활용한 Refresh Token Rotation (RTR) 및 로그아웃 토큰 블랙리스트 무효화 처리.
    4. HTTP 보안 헤더 적용 (`helmet`), API 요청 제한 (`express-rate-limit`), CORS 허용 도메인 상용화 백리스트 관리.

---

## 5. 5대 행성 게이미피케이션 & 리포트 구조

- **[x] 행성 탐사 목표 달성 실시간 검수 방식 적용**
  - **위치**: `src/services/travelService.ts`
  - **현황**: 백그라운드 주기적 스케줄러 대신 유저 행동/기록 로그 누적 시 즉시 실시간 정량 계산 및 탐사 완료 상태 업데이트 처리.

- **[x] 회고별 기반 리포트 체계 (월간 리포트 대체)**
  - **위치**: `src/services/travelResultService.ts`
  - **현황**: 별도의 일일 미션 및 자정 Batch Job 없이, 회고별 리포트가 월간 리포트 역할을 수행하도록 정리.

---

## 6. 데이터베이스 & 클라우드 스토리지 최적화

- **[x] 학술제 시제품(MVP) 로컬 이미지 스토리지 파이프라인**
  - **위치**: `src/loaders/express.ts`, `src/utils/fileUploader.ts`
  - **현황**: 학술제 MVP 스펙으로 로컬 저장소(`/uploads`) 기반 업로드/서빙 구현 완료 (상용화 시 S3/GCS 클라우드 전환).

- **[ ] DB 커넥션 풀 및 쿼리 최적화**
  - **위치**: `src/loaders/prisma.ts`, `prisma/schema.prisma`
  - **TODO**: Production MySQL Connection Pool 최적화, 인덱스 성능 점검 및 Slow Query 감지 모니터링 연동.

---

## 7. 로깅, 에러 모니터링 & CI/CD 파이프라인 (학술제 MVP 범위 제외)

- **[x] 모니터링 & 배포 파이프라인 (학술제 MVP 범위 제외)**
  - **현황**: 학술제 시제품(MVP) 단계에서는 Sentry/Datadog 에러 트래킹 및 Docker/CI/CD 자동화 배포를 제외하고 로컬/개발 서버 환경에서 직접 구동하도록 정리 (추후 프로덕션 상용화 배포 시 선택 검토).

