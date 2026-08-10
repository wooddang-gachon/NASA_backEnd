# 🚀 NASA Wellness Backend API (NASA_backEnd)

> **AI 가상 펫 "타미(Tammy)"와 함께하는 바이오리듬 게이미피케이션 & 웰니스 헬스케어 백엔드 시스템**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.0+-indigo.svg)](https://www.prisma.io/)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-v1.28+-orange.svg)](https://onnxruntime.ai/)
[![Jest](https://img.shields.io/badge/Jest-Integration_Tests-red.svg)](https://jestjs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 1. 프로젝트 개요

**NASA_backEnd**는 AI 심리 공감 챗봇, 로컬 ONNX YOLOv8 고속 비전 스캔 기반 영양 분석, 식약처 1.5만 건 식품 DB 연동, 그리고 별여행 게이미피케이션을 유기적으로 결합한 웰니스 헬스케어 백엔드 서비스입니다. 

사용자가 식단 사진을 올리거나 1-Tap 수분/운동 완료 기록을 남기면, AI 가상 펫 **타미(Tammy)**가 별여행 미션 연료(Fuel) 및 경험치(EXP) 보상을 지급하고 다음 웰니스 행성으로 워프(Warp)하는 경험을 제공합니다.

---

## 🌟 2. 핵심 3대 기둥 & 주요 기능

### 🗣️ Pillar 1. AI 타미 심리 공감 대화 (`[CHT]`)
- **실시간 대화 & 감정 추출**: 사용자의 다이어트/일상 스트레스를 공감하고 감정 상태(STRESSED, COMFORTED 등)를 분석합니다.
- **장기 기억 캡슐 (Memory Pill)**: 대화 중 중요한 가치관이나 취향을 자동 추출하여 DB에 보관하고 대화 맥락에 반영합니다.

### 🥗 Pillar 2. 비전 스캔 & 식약처 영양 DB 연동 (`[FOD]`)
- **로컬 ONNX YOLOv8 1차 고속 비전 스캔 (`LocalVisionService`)**: 서버 내부에서 `onnxruntime-node` 기반 0.1초 고속 추론으로 6대 주요 음식(고등어구이, 김밥, 김치볶음밥, 불고기, 삼겹살, 양념치킨) 및 바운딩 박스를 검출합니다.
- **Vision LLM 2차 Fallback**: 미식별/불분명 사진에 대해 외부 AI 서버(Vision LLM)로 2차 정밀 분석을 자동 위임합니다.
- **식약처 국가 표준 영양 DB (15,568건)**: 식약처 공공데이터 기반 수만 개 한식/외식 레시피의 칼로리, 3대 영양소(탄/단/지), 표준 제공량 및 중량을 100% 일치시켜 즉시 매칭합니다.
- **확정 등록 보상**: 사용자가 영양 성분을 확정하면 **연료 +50 Fuel, EXP +30** 보상이 지급됩니다.

### 🌌 Pillar 3. 타미 별여행 게이미피케이션 & 1-Tap 데일리 케어 (`[TRV/CARE/WKO]`)
- **1-Tap 수분 및 운동 완 기록**: 수분 섭취(250ml ➔ +10 Fuel), 오늘 운동 완(➔ +30 Fuel) 단 1초 만에 기록.
- **행성 탐사 & 워프(Warp)**: 누적 연료가 목표치(300 Fuel)에 도달하면 신규 행성("아쿠아 웰니스 행성", "비타민 에너제틱 행성" 등)으로 워프합니다.

### 📊 온디맨드 AI 건강 리포트 (`[RPT]`)
- **상시 웰니스 대시보드**: 주간/월간 칼로리 추이 및 영양 밸런스 차트 데이터를 제공합니다.
- **AI 종합 진단서**: 사용자의 요청 시 누적 데이터를 기반으로 맞춤 웰니스 개선 가이드를 동적 생성합니다.

---

## 🛠️ 3. 기술 스택 & 아키텍처 Design Pattern

- **Language & Runtime**: TypeScript, Node.js
- **Web Framework**: Express.js
- **Architecture Pattern**: 
  - **Repository Pattern**: Prisma ORM 의존성을 Service 레이어에서 100% 제거하고 `src/repositories/` 계층으로 완전 격리하여 데이터 무결성과 아키텍처 확장성 확보.
  - **Exception Translation Pattern**: 외부 AI 및 인프라 에러가 클라이언트에 날것으로 노출되지 않도록 비즈니스 에러로 표준화 번역.
- **Local AI Engine**: ONNX Runtime Node (`onnxruntime-node`), Sharp (Image Preprocessing & Normalization)
- **API Spec & Swagger Automation**: TSOA (OpenAPI 3.0 스펙 기반 Swagger UI 자동 생성)
- **Dependency Injection**: TypeDI (`@Service()`, `@Inject()` IoC 컨테이너 패턴)
- **Database & ORM**: MariaDB / MySQL, Prisma 7 (MariaDB Driver Adapter 연동)
- **Logging & Monitoring**: Winston (File & Console Log), Morgan (HTTP Access Log), Prisma Query Event Listener
- **Testing**: Jest, Supertest (Supertest 기반 HTTP API 통합 자동화 테스트)

---

## 📂 4. 디렉토리 구조

```
NASA_backEnd/
├── data/                   # 식약처 국가 표준 영양성분 공공데이터 (food_nutrition.csv)
├── docs/                   # 기능 명세서, API 문서, 비즈니스 룰, 설계 패턴 문서
│   └── 1. references/design_pattern/ # Repository 패턴 & 에러 핸들링 설계 사양서
├── models/
│   └── yolo/               # 로컬 ONNX YOLOv8 비전 모델 (best.onnx, best.pt)
├── prisma/                 # Prisma DB 스키마 (schema.prisma) 및 시드 스크립트 (seed.ts)
├── scripts/                # 식약처 DB 1.5만 건 대량 이식 스크립트 (import-food-db.ts)
├── src/
│   ├── api/
│   │   ├── middlewares/    # 에러 핸들러, CORS, 개발용 인증 패스 미들웨어
│   │   └── routes/         # TSOA Controller 엔드포인트
│   ├── config/             # 환경 변수 설정 (.env 매핑)
│   ├── dto/                # Data Transfer Object 정의
│   ├── interfaces/         # API 표준 응답 및 내부 도메인 인터페이스
│   ├── loaders/            # Express, Prisma, Winston Logger 로더
│   ├── mappers/            # Domain <-> DTO 데이터 매핑 계층
│   ├── repositories/       # [NEW] 데이터 접근 계층 (Auth, Chat, Food, Notification, QuickLog, Travel, User)
│   ├── services/           # 비즈니스 로직 계층 (AiService, LocalVisionService, FoodService 등)
│   └── utils/              # 커스텀 에러 및 음식 토크나이저 유틸
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

### 🗄️ [DB 가이드] Prisma DB 동기화 & 식약처 1.5만 건 식품 DB 대량 이식

#### A. DB 스키마 자동 동기화
```bash
# 개발/테스트용 Mock DB (nasa_mock_db)에 스키마 동기화
npm run prisma:mock:push

# 실운영 DB (nasa_db)에 스키마 동기화
npm run prisma:prod:push
```

#### B. 식약처 1.5만 건 식품 영양 DB 일괄 이식 (Bulk Import)
```bash
# 개발/테스트용 Mock DB (nasa_mock_db)에 식약처 DB 1.5만 건 이식
npx tsx scripts/import-food-db.ts

# 실운영 DB (nasa_db)에 식약처 DB 1.5만 건 이식
NODE_ENV=production npx tsx scripts/import-food-db.ts
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
# 1. 프로덕션 정적 파일 빌드 (TSOA 라우트 갱신 + tsc 컴파일)
npm run build

# 2. 실운영 프로덕션 서버 구동
npm start
```
- **실운영 포트**: `3000`
- **연동 DB**: `DATABASE_URL` (`nasa_db`)
- **실행 모드**: 고성능 JS 정적 컴파일 프로세스 가동 (`dist/app.js`)

---

### 🧪 [방법 C] API 통합 자동화 테스트 실행 (Testing)
Supertest + Jest 기반으로 백엔드 API 모듈의 HTTP 응답과 DB/AI 통신을 자동 검증합니다.

```bash
npm test
```

---

## 🧪 6. 에러 핸들링 및 설계 원칙

- **Repository Pattern 100% 적용**: Service 레이어에서 Prisma에 직접 접근하지 않고, 완벽히 분리된 `Repository` 클래스를 통해서만 DB 입출력을 처리합니다.
- **로컬 비전 스캔 & Fallback 체계**: `LocalVisionService`를 이용해 서버 자체에서 0.1초 만에 1차 YOLO 탐지를 시도하며, 미식별 시에만 외부 Vision LLM으로 Fallback 분기합니다.
- **자동 생성 방지 (No Auto-Create)**: DB에 유저나 대상 리소스가 존재하지 않을 경우 자동 생성을 금지하고 `404 USER_NOT_FOUND` 예외를 명확히 반환합니다.
- **Exception Translation Pattern**: 외부 통신 장애 발생 시 백엔드가 다운되지 않고 표준 비즈니스 에러(`503 AI_SERVER_UNAVAILABLE`)로 번역하여 전달합니다.

---

## 📝 7. 문서 관리 (Documentation)

자세한 기능 요구사항 및 백엔드 설계 사양서는 `docs/` 폴더에서 확인하실 수 있습니다:
- `docs/1. references/design_pattern/Repository_Design_Pattern.md` (Repository 패턴 설계 가이드)
- `docs/1. references/design_pattern/Error_Handling_Design_Pattern.md` (예외 처리 규칙)
- `docs/2. v3/3. Functional Specification.md` (기능 상세 명세서)
- `docs/2. v3/4. Sequence Diagram.md` (시퀀스 다이어그램)
- `docs/2. v3/5. api_docs.md` (API 표준 스펙)
