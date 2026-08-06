# TAMMY v3 백엔드 상용화(Production) 전체 TODO & 체크리스트

본 문서는 TAMMY v3 백엔드 시스템 개발 과정에서 프로토타입/가짜(Mock/Stub) 형태로 임시 구현된 항목과 실제 프로덕션 상용화 배포 시 완료되어야 하는 전체 TODO 작업 목록입니다.

---

## 1. AI 서버 실연동 파이프라인 (Python FastAPI tammy-agent)

- **[x] 로컬 이미지 업로드 & AI 비전 스캔 (YOLO + Vision LLM Engine) 연동**
  - **위치**: `src/loaders/express.ts`, `src/api/routes/UploadController.ts`, `src/api/routes/FoodController.ts`
  - **현황**: `multer`를 활용한 이미지 업로드 및 AI 비전 1차 YOLO + Vision LLM Fallback 연동 파이프라인 완료.
  - **TODO (상용화 시)**: 로컬 파일 저장(`/uploads`) 방식을 AWS S3 / Google Cloud Storage(GCS) 오브젝트 스토리지 연동으로 전환 및 CDN URL 반환.

- **[ ] AI 심리 공감 대화 & 모션태그 실연동**
  - **위치**: `src/services/aiService.ts` (`processChat`), `src/services/chatService.ts`
  - **현황**: AI 대화 서버 미구동 시 가짜 공감 메시지 및 기본 모션태그(`COMFORT_WARM`) 반환.
  - **TODO**: AI 서버 `http://ai-server:8000/v1/chat/process` 실통신 응답 바인딩 및 유저 최근 수분/운동 정량 Context Injection 보강, 통신 타임아웃/재시도 처리.

- **[ ] 5대 행성 맞춤 AI 리포트 생성 실연동**
  - **위치**: `src/services/aiService.ts` (`summarizeWellnessReport`), `src/services/reportService.ts`
  - **현황**: 가짜 주간 통계 수치 및 샘플 진단 문장 반환.
  - **TODO**: 실제 유저의 정량 수치 집계 페이로드 전달 후 `http://ai-server:8000/v1/reports/summarize` 실연동.

---

## 2. 비동기 작업 큐 및 백그라운드 Worker (BullMQ / Redis)

- **[x] 별여행 탐사 비동기 리포트 백그라운드 큐 유틸 구현**
  - **위치**: `src/utils/asyncQueue.ts`, `src/services/reportService.ts`
  - **현황**: In-Memory Async Queue 유틸리티(`src/utils/asyncQueue.ts`) 구현 완료. 백그라운드 태스크 순차 실행, 상태 및 진척도 관리 구현됨.

- **[ ] Redis 기반 BullMQ 분산 큐로 전환**
  - **위치**: `src/utils/asyncQueue.ts`, `src/jobs/`
  - **TODO (상용화 시)**: 서버 다중화(Multi-node) 환경 대응을 위해 In-Memory 큐를 Redis 기반 BullMQ로 교체하고, 독립적인 백그라운드 Worker 프로세스로 분리.

---

## 3. 푸시 알림 엔진 (FCM / APNs) [RPT-003]

- **[x] 디바이스 푸시 토큰 관리 & FCM 탐사 완료 알림 모듈 구축**
  - **위치**: `src/api/routes/NotificationController.ts`, `src/services/notificationService.ts`, `prisma/schema.prisma`
  - **현황**: `user_push_tokens` DB 모델 및 `POST /api/v3/notifications/push-token` 토큰 등록 API 구현 완료. 별여행 탐사 완료 및 맞춤 리포트 수령 시 Push Notification 알림을 쏘는 단일/500개 청크 멀티캐스트 파이프라인 연결.
  - **Firebase Key**: `src/config/firebase-service-account.json` (`nasa-alarm` 비공개 키) 실연동 바인딩 완료.

---

## 4. 회원 인증, 보안 & 소셜 OAuth 2.0 연동

- **[x] 카카오 / 구글 / 애플 소셜 로그인 파이프라인 연동**
  - **위치**: `src/services/authService.ts`, `src/api/routes/AuthController.ts`
  - **현황**: `POST /api/v3/auth/social-login` 엔드포인트 구축 완료. Google/Kakao OAuth API(`googleapis.com/oauth2/v3/userinfo`, `kapi.kakao.com/v2/user/me`) 실검증 및 자동 회원가입/JWT 발급 처리.
  - **Mock/Fallback**: 실서버 검증 실패 시 테스트 및 프론트엔드 연동 개발 편의를 위해 `mock_google_`, `mock_kakao_`, `mock_apple_` 토큰에 대한 테스트 유저 생성 시뮬레이션 Fallback 로직 반영.

- **[ ] 상용화 소셜 인증 보안 강화 & Mock 토큰 제거**
  - **위치**: `src/services/authService.ts`
  - **TODO (상용화 시)**:
    1. 개발용 Mock 토큰 Fallback 제거 및 환경변수(`ENABLE_MOCK_AUTH=false`) 조건화.
    2. Apple Identity Token (JWT public key) 실검증 라이브러리 연결.
    3. Redis를 활용한 Refresh Token Rotation (RTR) 및 로그아웃 토큰 블랙리스트 무효화 처리.
    4. HTTP 보안 헤더 적용 (`helmet`), API 요청 제한 (`express-rate-limit`), CORS 허용 도메인 상용화 백리스트 관리.

---

## 5. 5대 행성 게이미피케이션 목표 자동 검증 스케줄러

- **[ ] 행성 탐사(IN_PROGRESS ➔ COMPLETED) 목표 달성 자동 검수**
  - **위치**: `src/services/travelService.ts`, `src/jobs/`
  - **현황**: 탐사 출발(`IN_PROGRESS`) 및 연료 소진까지 구현됨.
  - **TODO**: node-cron 또는 백그라운드 스케줄러를 통해 5대 행성 특화 조건(`meal_planets`, `water_planets` 등) 달성 여부 주기적 검사 후 자동으로 탐사 완료(`COMPLETED`) 상태로 전환하고 리포트 발행.

- **[ ] 일일 미션 리셋 및 월간 리포트 자동 집계 Batch Job**
  - **위치**: `src/jobs/monthlyReportJob.ts`
  - **TODO**: 매월 1일 자정 월간 통계 집계(`monthly_reports`) 및 일일 미션/연료 상태 리셋 스케줄러 연동.

---

## 6. 데이터베이스 & 클라우드 스토리지 최적화

- **[ ] AWS S3 / Cloud Storage 클라우드 이미지 스토리지 연동**
  - **위치**: `src/loaders/express.ts`, `src/utils/fileUploader.ts`
  - **TODO**: 식단 사진 및 프로필 이미지 업로드 시 Cloud Storage로 직접 업로드/서빙 파이프라인 구축.

- **[ ] DB 커넥션 풀 및 쿼리 최적화**
  - **위치**: `src/loaders/prisma.ts`, `prisma/schema.prisma`
  - **TODO**: Production MySQL Connection Pool 최적화, 인덱스 성능 점검 및 Slow Query 감지 모니터링 연동.

---

## 7. 로깅, 에러 모니터링 & CI/CD 파이프라인

- **[ ] Sentry / Datadog 실시간 에러 트래킹 연동**
  - **위치**: `src/loaders/express.ts` 에러 미들웨어
  - **TODO**: 500대 서버 에러 발생 시 Sentry/Datadog에 인덱싱 및 개발팀 알림 전송.

- **[ ] Docker 컨테이너화 & CI/CD 자동화 배포 파이프라인**
  - **위치**: `Dockerfile`, `.github/workflows/deploy.yml`
  - **TODO**: Dockerfile 작성, 멀티스테이지 빌드 적용 및 GitHub Actions / AWS ECS (or K8s) 자동 배포 파이프라인 연동.
