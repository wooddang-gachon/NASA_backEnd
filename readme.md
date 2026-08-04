# 🚀 NASA Wellness Backend API (NASA_backEnd)

> **AI 가상 펫 "타미(Tammy)"와 함께하는 바이오리듬 게이미피케이션 & 웰니스 헬스케어 백엔드 시스템**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.0+-indigo.svg)](https://www.prisma.io/)
[![Jest](https://img.shields.io/badge/Jest-Integration_Tests-red.svg)](https://jestjs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 1. 프로젝트 개요

**NASA_backEnd**는 AI 심리 공감 챗봇, AI 비전 스캔 기반 영양 분석, 그리고 별여행 게이미피케이션을 유기적으로 결합한 웰니스 헬스케어 백엔드 서비스입니다. 

사용자가 식단 사진을 올리거나 1-Tap 수분/운동 완 기록을 남기면, AI 가상 펫 **타미(Tammy)**가 별여행 미션 연료(Fuel) 및 경험치(EXP) 보상을 지급하고 다음 웰니스 행성으로 워프(Warp)하는 경험을 제공합니다.

---

## 🌟 2. 핵심 3대 기둥 & 주요 기능

### 🗣️ Pillar 1. AI 타미 심리 공감 대화 (`[CHT]`)
- **실시간 대화 & 감정 추출**: 사용자의 다이어트/일상 스트레스를 공감하고 감정 상태(STRESSED, COMFORTED 등)를 분석합니다.
- **장기 기억 캡슐 (Memory Pill)**: 대화 중 중요한 가치관이나 취향을 자동 추출하여 DB에 보관하고 대화 맥락에 반영합니다.

### 🥗 Pillar 2. 사진 비전 영양 분석 (`[FOD]`)
- **AI 비전 스캔**: 음식 사진 업로드 시 5대 영양소(탄/단/지/비/미) 및 칼로리를 자동 추정합니다.
- **확정 등록 보상**: 사용자가 수정한 영양 성분을 확정하면 **연료 +50 Fuel, EXP +30** 보상이 지급됩니다.

### 🌌 Pillar 3. 타미 별여행 게이미피케이션 & 1-Tap 데일리 케어 (`[TRV/CARE/WKO]`)
- **1-Tap 수분 및 운동 완 기록**: 수분 섭취(250ml ➔ +10 Fuel), 오늘 운동 완(➔ +30 Fuel) 단 1초 만에 기록.
- **행성 탐사 & 워프(Warp)**: 누적 연료가 목표치(300 Fuel)에 도달하면 신규 행성("네뷸라 크리스탈 행성" 등)으로 워프합니다.

### 📊 온디맨드 AI 건강 리포트 (`[RPT]`)
- **상시 웰니스 대시보드**: 주간/월간 칼로리 추이 및 영양 밸런스 차트 데이터를 제공합니다.
- **AI 종합 진단서**: 사용자의 요청 시 누적 데이터를 기반으로 맞춤 웰니스 개선 가이드를 동적 생성합니다.

---

## 🛠️ 3. 기술 스택 & 아키텍처

- **Language & Runtime**: TypeScript, Node.js
- **Web Framework**: Express.js
- **API Spec & Swagger Automation**: TSOA (OpenAPI 3.0 스펙 기반 Swagger UI 자동 생성)
- **Dependency Injection**: TypeDI (`@Service()`, `@Inject()` IoC 컨테이너 패턴)
- **Database & ORM**: MariaDB / MySQL, Prisma 7 (MariaDB Driver Adapter 연동)
- **Logging & Monitoring**: Winston (File & Console Log), Morgan (HTTP Access Log), Prisma Query Event Listener
- **Testing**: Jest, Supertest (Supertest 기반 HTTP API 통합 자동화 테스트)
- **Cron Jobs**: Node-cron (월간 리포트 30일 만료 파기 및 안부 미션 트리거)

---

## 📂 4. 디렉토리 구조

```
NASA_backEnd/
├── docs/                   # 기능 명세서, API 문서, 비즈니스 룰, 백엔드 구현 계획서
├── prisma/                 # Prisma DB 스키마 (schema.prisma)
├── src/
│   ├── api/
│   │   ├── middlewares/    # 에러 핸들러, CORS, 개발용 인증 패스 미들웨어
│   │   └── routes/         # TSOA Controller 엔드포인트
│   ├── config/             # 환경 변수 설정 (.env 매핑)
│   ├── interfaces/         # DTO 및 API 표준 응답 인터페이스
│   ├── jobs/               # Background Cron Scheduler 스케줄러
│   ├── loaders/            # Express, Prisma, Winston Logger 로더
│   ├── services/           # 핵심 비즈니스 로직 & AI 통신 파이프라인
│   └── utils/              # 커스텀 에러 예외 클래스 (AppError, UserNotFoundError)
├── tests/                  # Supertest 기반 Jest 통합 테스트 슈트
└── package.json
```

---

## ⚡ 5. 서버 실행 가이드 (Getting Started)

### 1) 환경 변수 설정 (`.env`)
프로젝트 루트의 `.env` 파일에 실행 환경(`NODE_ENV`)과 DB 주소를 설정합니다:

```env
# Database Connection URLs
DATABASE_URL="mysql://root:password@localhost:3306/nasa_db"          # 실운영 DB
MOCK_DATABASE_URL="mysql://root:password@localhost:3306/nasa_mock_db" # 개발/테스트용 Mock DB

# Environment State (.env 파일 설정에 따라 DB 연결이 동적으로 스위칭됩니다)
NODE_ENV="development" # "development"일 시 Mock DB 연동 / "production"일 시 실운영 DB 연동

# AI Server Connection
AI_SERVER_URL="http://localhost:8000"
```

### 2) 패키지 설치
```bash
npm install
```

---

### 🗄️ [DB 가이드] Prisma DB 테이블 1초 자동 생성 & 동기화
`schema.prisma` 파일의 23개 데이터 모델을 기반으로 DB 테이블을 1초 만에 자동으로 만들어 줍니다.

```bash
# 개발/테스트용 Mock DB (nasa_mock_db)에 테이블 자동 생성 및 동기화
npm run prisma:mock:push

# 실운영 DB (nasa_db)에 테이블 자동 생성 및 동기화
npm run prisma:prod:push

# Mock DB 웹 데이터 GUI 뷰어 띄우기 (Prisma Studio)
npm run prisma:mock:studio
```

---

### 🟢 [방법 A] 개발 모드 실서버 구동 (Development Run)
`.env`에 `NODE_ENV="development"`가 설정되어 있을 때 라우터를 자동 재빌드하며 안전하게 **Mock DB (`nasa_mock_db`)**에 연동하여 구동합니다.

```bash
# 1. TSOA 라우트 & Swagger 문서 자동 생성
npm run swagger

# 2. 개발용 실서버 구동 (3000번 포트)
npm run dev
```
- **실서버 접속 주소**: `http://localhost:3000`
- **Swagger UI 웹 테스트 주소**: `http://localhost:3000/api/docs`

---

### 🔵 [방법 B] 실제 프로덕션 운영 서버 구동 (Production Run)
프로덕션 환경에서는 TypeScript 트랜스파일링 없이 정적 JavaScript 파일(`dist/`)로 최적의 성능으로 상시 가동하며, **실운영 DB(`nasa_db`)**와 직접 연동됩니다.

```bash
# 1. 프로덕션 정적 파일 빌드 (TSOA 라우트 갱신 + tsc 컴파일 + tsc-alias 변환)
npm run build

# 2. (선택) 상용 DB 스키마 동기화 & 가짜/시드 데이터 주입
npm run prisma:prod:push
npm run seed

# 3. 실운영 프로덕션 서버 구동 (스크립트 내 NODE_ENV=production 자동 세팅)
npm start
```
- **실운영 포트**: `3000`
- **연동 DB**: `DATABASE_URL` (`nasa_db`)
- **실행 모드**: 고성능 JS 정적 컴파일 프로세스 가동 (`dist/app.js`)

---

### 🧪 [방법 C] API 통합 자동화 테스트 실행 (Testing)
Supertest + Jest 기반으로 13개 전체 백엔드 API 모듈의 HTTP 응답과 DB/AI 통신을 자동 검증합니다.

```bash
npm test
```

---

## 🧪 6. 에러 핸들링 및 안전 장치

- **자동 생성 방지 (No Auto-Create)**: DB에 유저나 대상 리소스가 존재하지 않을 경우 자동 생성을 금지하고 `404 USER_NOT_FOUND` 예외를 명확히 반환합니다.
- **AI 서버 격리 (AI Server Fallback)**: AI 통신 장애 발생 시 백엔드가 다운되지 않고 `503 AI_SERVER_UNAVAILABLE` 에러 코드를 제공합니다.
- **Mock DB 동적 연동**: `.env` 파일의 `NODE_ENV` 설정에 따라 실운영 DB와 `nasa_mock_db` 간의 동적 스위칭이 보장됩니다.

---

## 📝 7. 문서 관리 (Documentation)

자세한 기능 요구사항 및 백엔드 아키텍처 명세는 `docs/references/v3/` 폴더에서 확인하실 수 있습니다:
- `3. Functional Specification.md` (기능 상세 명세서)
- `5. api_docs.md` (API 표준 스펙 및 통신 규약)
- `6. Buisness Rule.md` (보상 매트릭스 및 비즈니스 룰)
- `100. backend_implementation_plan.md` (단계별 구체 구현 계획서)
