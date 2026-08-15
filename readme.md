# 🚀 NASA Wellness Backend API (NASA_backEnd)

> **AI 가상 펫 "타미(Tammy)"와 함께하는 바이오리듬 게이미피케이션 & 웰니스 헬스케어 백엔드 시스템**
> AI 심리 공감 대화, 로컬 ONNX 기반 고속 음식 인식 & 식약처 영양 DB 연동, 그리고 별여행 게이미피케이션을 제공하는 RESTful API 서버입니다.

---

## 🛠️ 기술 스택 (Tech Stack)

| 분류 | 기술 및 라이브러리 |
| :--- | :--- |
| **Runtime & Language** | Node.js (v18+ / v20+), TypeScript (v5.x) |
| **Web Framework** | Express.js |
| **API Spec & Docs** | TSOA (OpenAPI 3.0 / Swagger UI 자동 생성) |
| **Database & ORM** | MySQL / MariaDB, Prisma ORM 7 |
| **Local AI Engine** | ONNX Runtime Node (`onnxruntime-node`), Sharp |
| **Dependency Injection** | TypeDI (IoC / DI 컨테이너 패턴) |
| **Logging & Monitoring** | Winston (Structured Logging & Masking), Morgan (HTTP Stream) |
| **Testing & Quality** | Jest, Supertest, ESLint, Prettier |

---

## 🚀 시작하기 (Getting Started)

### 1. 사전 요구사항 (Prerequisites)
프로젝트를 로컬에서 실행하기 전에 다음 환경이 준비되어 있어야 합니다:
- **Node.js**: `v18.0.0` 이상 (v20+ 권장)
- **Package Manager**: `npm` (v9+)
- **Database**: MySQL 또는 MariaDB (로컬 또는 원격 인스턴스)

---

### 2. 설치 (Installation)

```bash
# 1. 저장소 클론
git clone https://github.com/wooddang-gachon/NASA_backEnd.git
cd NASA_backEnd

# 2. 의존성 패키지 설치
npm install
```

---

### 3. 환경 변수 설정 (Environment Variables)

프로젝트 루트의 `.env.example` 파일을 복사하여 `.env` 파일을 생성하고 환경에 맞게 값을 설정합니다.

```bash
cp .env.example .env
```

`.env` 파일 주요 항목:
```env
# Database 연결 주소 (MySQL / MariaDB)
DATABASE_URL="mysql://root:password@localhost:3306/nasa_db"
MOCK_DATABASE_URL="mysql://root:password@localhost:3306/nasa_mock_db"

# 실행 환경 (development / production / test)
NODE_ENV="development"

# JWT 인증 시크릿 키
JWT_SECRET="your-jwt-secret-key"

# AI 서버 연동 (선택)
AI_SERVER_URL="https://tammy-ai-server-601688473805.asia-northeast3.run.app"
AI_INTERNAL_API_KEY="your-internal-api-key"

# Swagger UI 접근 계정 (기본값: admin)
SWAGGER_USER="admin"
SWAGGER_PASSWORD="your-password"
```

> **DB 스키마 동기화 및 식약처 DB 시딩:**
> ```bash
> # Prisma 스키마 DB 반영
> npm run db:push
> 
> # (선택) 식약처 표준 영양 DB 1.5만 건 일괄 이식
> npx tsx scripts/import-food-db.ts
> ```

---

### 4. 서버 실행 (Running the App)

#### 🟢 개발 서버 실행 (Development Mode)
코드 변경 사항이 실시간으로 반영(Watch 모드)되며, TSOA 라우트 및 Swagger 문서를 자동으로 동기화하여 구동합니다.

```bash
# 개발 서버 구동 (Hot Reload)
npm run dev
```

- **API 서버 주소**: `http://localhost:3000`
- **Swagger API 문서 (UI)**: `http://localhost:3000/api/docs`

#### 🔵 상용(프로덕션) 서버 실행 (Production Mode)
TypeScript 코드를 최적화된 정적 JavaScript 파일(`dist/`)로 빌드한 후 고성능 프로덕션 모드로 구동합니다.

```bash
# 1. 프로덕션 빌드 (Swagger 생성 + TypeScript 컴파일)
npm run build

# 2. 상용 서버 구동
npm start
```

- **빌드 결과물 경로**: `dist/` 디렉터리
- **실행 엔트리포인트**: `dist/src/app.js`

---

## 📂 폴더 구조 (Directory Structure)

```
NASA_backEnd/
├── data/                   # 식약처 국가 표준 영양성분 공공데이터 (food_nutrition.csv)
├── docs/                   # 프로젝트 기획서, 시퀀스 다이어그램, 아키텍처 가이드
├── models/
│   └── yolo/               # 로컬 ONNX YOLOv8 음식 인식 모델 파일 (best.onnx)
├── prisma/                 # Prisma DB 스키마 (schema.prisma) 및 시드 스크립트
├── scripts/                # DB 마이그레이션 및 영양 DB 일괄 이식 스크립트
├── src/
│   ├── api/
│   │   ├── middlewares/    # 전역 에러 핸들러, TraceID, CORS, Rate Limit 등 미들웨어
│   │   └── routes/         # TSOA 컨트롤러 엔드포인트 (*Controller.ts)
│   ├── config/             # 환경 변수 및 공통 설정 모듈
│   ├── dto/                # 요청/응답 Data Transfer Object 정의 (*.dto.ts)
│   ├── errors/             # 비즈니스 커스텀 예외 클래스 (BadRequestError 등)
│   ├── interfaces/         # 서비스 간 공유 인터페이스 및 도메인 모델 타입
│   ├── loaders/            # Express, Prisma, Winston 로거, Swagger 초기화 로더
│   ├── mappers/            # DB Model <-> DTO 데이터 변환 계층 (*Mapper.ts)
│   ├── repositories/       # 데이터 접근 계층 (Repository Pattern 기반 DB 쿼리 격리)
│   ├── services/           # 비즈니스 로직 계층 (FoodVisionService, AiService 등)
│   └── utils/              # 이미지 압축, 어노테이션, 비동기 큐, 도메인 유틸
├── tests/                  # Jest + Supertest 기반 단위 및 통합 테스트 슈트
└── package.json
```

---

## 📜 스크립트 명령어 (Scripts)

| 명령어 | 설명 |
| :--- | :--- |
| **`npm run dev`** | 라우트/Swagger 생성 후 개발 모드로 서버 실행 (Hot Reload) |
| **`npm run start`** | 빌드된 프로덕션 서버 실행 (`dist/src/app.js`) |
| **`npm run build`** | Swagger 생성 및 TypeScript 컴파일/빌드 (`dist/`) |
| **`npm run test`** | Jest 기반 전체 단위 및 통합 테스트 실행 |
| **`npm run swagger`** | TSOA 라우트 및 Swagger(OpenAPI) 스펙 문서 재생성 |
| **`npm run typecheck`** | TypeScript 컴파일 에러 정적 검사 (`tsc --noEmit`) |
| **`npm run lint`** | ESLint 정적 코드 분석 검사 |
| **`npm run format`** | Prettier 코드 포맷팅 자동 정리 |
| **`npm run lint:fix`** | Prettier 포맷팅 및 ESLint 자동 수정 일괄 적용 |
| **`npm run db:push`** | Prisma 스키마를 데이터베이스에 즉시 동기화 |
| **`npm run db:studio`** | Prisma Studio 웹 콘솔 실행 |
