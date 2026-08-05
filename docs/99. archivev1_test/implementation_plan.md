# Implementation Plan - TAMMY Backend Setup

## Goal Description
본 계획서는 TAMMY v3 서비스 백엔드를 `Node.js + Express + TypeScript + MySQL` 환경에서 `Prisma ORM`을 사용하여 구축하기 위한 구현 설계서입니다.
`docs/references/back_plan.md` 및 `docs/references/database.md`에 기획된 테이블 설계와 API 사양에 따라 스키마 구성, 의존성 설치, 라우트 바인딩 및 핵심 비즈니스 로직을 구현합니다.

## User Review Required
> [!IMPORTANT]
> **Express 로더 에러 핸들러 로딩 순서 수정**
> 현재 `src/loaders/index.ts`에서 `expressLoader`를 호출할 때 404/500 에러 핸들러가 함께 연동되어, 그 아래에 마운트되는 TSOA API 라우트들이 무시되고 404 에러를 반환하는 문제가 있습니다.
> 따라서 에러 핸들러를 `loaders/express.ts`에서 분리하여 TSOA 라우트 등록 후 맨 마지막에 바인딩되도록 순서를 조정합니다.

> [!NOTE]
> **의존성 패키지 설치**
> MySQL 데이터베이스 통신 및 ORM 지원을 위해 `prisma`, `@prisma/client`, `mysql2` 패키지가 새로 필요합니다. 이 패키지들을 설치하는 명령을 실행할 예정입니다.

## Open Questions
- **더미 유저 및 초기 행성 데이터**: 시스템의 첫 테스트를 위해 기본 회원(ID 1) 및 몇 가지 우주 행성(ID 1~5) 기초 데이터 시드(Seed) 처리를 백엔드 세팅 단계에서 함께 진행할까요?

---

## Proposed Changes

### 1. 의존성 패키지 설치
Prisma ORM 및 MySQL 연동을 위한 패키지를 추가합니다.
- `devDependencies`: `prisma`
- `dependencies`: `@prisma/client`, `mysql2`

### 2. Prisma 설정 및 스키마 [NEW]
`prisma/schema.prisma` 파일을 생성하고 MySQL 데이터베이스 스키마와 매핑시킵니다.

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                Int                  @id @default(autoincrement())
  nickname          String               @db.VarChar(50)
  gender            String?              @db.VarChar(10)
  age               Int?
  height            Decimal?             @db.Decimal(5, 2)
  weight            Decimal?             @db.Decimal(5, 2)
  targetWeight      Decimal?             @map("target_weight") @db.Decimal(5, 2)
  preferredExercise String?              @map("preferred_exercise") @db.VarChar(100)
  exerciseLocation  String?              @map("exercise_location") @db.VarChar(50)
  exerciseTime      String?              @map("exercise_time") @db.VarChar(50)
  createdAt         DateTime             @default(now()) @map("created_at")
  updatedAt         DateTime             @updatedAt @map("updated_at")

  tammyStatus       TammyStatus?
  chatMessages      ChatMessage[]
  longTermMemories  LongTermMemory[]
  foodLogs          FoodLog[]
  exerciseLogs      ExerciseLog[]
  waterLogs         WaterLog[]
  emotionLogs       EmotionLog[]
  spaceTravelState  SpaceTravelState?
  planetHistories   PlanetHistory[]
  monthlyReports    MonthlyReport[]

  @@map("users")
}

model TammyStatus {
  userId         Int      @id @map("user_id")
  level          Int      @default(1)
  currentExp     Int      @default(0) @map("current_exp")
  empathyIndex   Int      @default(0) @map("empathy_index")
  healthIndex    Int      @default(0) @map("health_index")
  activityIndex  Int      @default(0) @map("activity_index")
  happinessIndex Int      @default(0) @map("happiness_index")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("tammy_status")
}

model ChatMessage {
  id          BigInt   @id @default(autoincrement())
  userId      Int      @map("user_id")
  sender      Sender
  messageText String   @map("message_text") @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("chat_messages")
}

enum Sender {
  USER
  TAMMY
}

model LongTermMemory {
  id              Int      @id @default(autoincrement())
  userId          Int      @map("user_id")
  category        String   @db.VarChar(50)
  memoryContent   String   @map("memory_content") @db.Text
  importanceScore Int      @default(1) @map("importance_score")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, category], map: "idx_user_category")
  @@map("long_term_memories")
}

model FoodLog {
  id           BigInt   @id @default(autoincrement())
  userId       Int      @map("user_id")
  foodName     String   @map("food_name") @db.VarChar(100)
  calories     Int      @default(0)
  carbohydrate Decimal  @default(0.00) @db.Decimal(5, 2)
  protein      Decimal  @default(0.00) @db.Decimal(5, 2)
  fat          Decimal  @default(0.00) @db.Decimal(5, 2)
  imageUrl     String?  @map("image_url") @db.VarChar(255)
  comment      String?  @db.VarChar(255)
  registeredAt DateTime @default(now()) @map("registered_at")

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("food_logs")
}

model ExerciseLog {
  id              BigInt   @id @default(autoincrement())
  userId          Int      @map("user_id")
  exerciseName    String   @map("exercise_name") @db.VarChar(100)
  durationMinutes Int      @map("duration_minutes")
  burnedCalories  Int      @default(0) @map("burned_calories")
  isCompleted     Boolean  @default(true) @map("is_completed")
  performedAt     DateTime @default(now()) @map("performed_at")

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("exercise_logs")
}

model WaterLog {
  id         BigInt   @id @default(autoincrement())
  userId     Int      @map("user_id")
  intakeMl   Int      @map("intake_ml")
  recordedAt DateTime @default(now()) @map("recorded_at")

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("water_logs")
}

model EmotionLog {
  id           BigInt   @id @default(autoincrement())
  userId       Int      @map("user_id")
  emotionState String   @map("emotion_state") @db.VarChar(50)
  causeSummary String?  @map("cause_summary") @db.VarChar(255)
  recordedAt   DateTime @default(now()) @map("recorded_at")

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("emotion_logs")
}

model SpaceTravelState {
  userId           Int      @id @map("user_id")
  currentFuel      Int      @default(0) @map("current_fuel")
  shipCoordinateX  Decimal  @default(0.0000) @map("ship_coordinate_x") @db.Decimal(8, 4)
  shipCoordinateY  Decimal  @default(0.0000) @map("ship_coordinate_y") @db.Decimal(8, 4)
  currentPlanetId  Int      @default(1) @map("current_planet_id")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("space_travel_states")
}

model PlanetHistory {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  planetId      Int      @map("planet_id")
  reachedAt     DateTime @default(now()) @map("reached_at")
  growthSummary String?  @map("growth_summary") @db.Text

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("planet_histories")
}

model MonthlyReport {
  id               Int      @id @default(autoincrement())
  userId           Int      @map("user_id")
  reportYearMonth  String   @map("report_year_month") @db.Char(7)
  healthScore      Int      @default(0) @map("health_score")
  summaryContent   String?  @map("summary_content") @db.Text
  aggregatedData   Json?    @map("aggregated_data")
  createdAt        DateTime @default(now()) @map("created_at")

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, reportYearMonth], map: "uq_user_month")
  @@map("monthly_reports")
}
```

### 3. Prisma Client 로더 작성 [NEW]
`src/loaders/prisma.ts` 파일을 생성하여 싱글톤 Prisma Client 인스턴스를 관리하고 `typedi` 의존성 주입 컨테이너에 연동합니다.

```typescript
import { PrismaClient } from "@prisma/client";
import { Container } from "typedi";

export const prisma = new PrismaClient();

export default () => {
  Container.set("prisma", prisma);
};
```

### 4. Express Loader 에러 핸들러 순서 수정 [MODIFY]
`src/loaders/express.ts` 및 `src/loaders/index.ts`를 리팩토링합니다.

#### `src/loaders/express.ts` 에서 404 및 500 에러 처리 제거
```typescript
// expressLoader 에서는 express.json(), cors(), status 라우트만 등록
// 에러 핸들러 미들웨어는 분리하여 별도 export 진행
```

#### `src/loaders/index.ts` 수정
```typescript
// 1. expressLoader 호출 (에러 핸들러 없이 미들웨어 세팅만 수행)
// 2. prismaLoader 호출 (Prisma 클라이언트 컨테이너 등록)
// 3. swaggerLoader 호출 (Swagger Docs 세팅)
// 4. API Routes 마운트 (tsoa RegisterRoutes)
// 5. 에러 핸들러 및 404 처리 미들웨어 후순위 등록
```

### 5. API 기능별 Controller & Service 개발 [NEW]
각 기능 영역에 대해 Prisma ORM을 사용한 CRUD 처리를 수행하는 서비스(Service)와 tsoa 기반의 컨트롤러(Controller)를 생성합니다.

- **UserService / UserController**: 사용자 가입/조회/수정 및 캐릭터 스탯 갱신.
- **ChatService / ChatController**: 메시지 영속화 및 장기기억(`LongTermMemory`) 저장/조회.
- **FoodService / FoodController**: 분석 식사 로그 적재, 수분 섭취량(`water_logs`) 적재, 우주선 연료 지급 로직 연계.
- **ExerciseService / ExerciseController**: 운동 결과 기록 및 칼로리 차감, 우주선 연료 지급 로직 연계.
- **SpaceService / SpaceController**: 연료 누적, 게이지 계산, 행성 도달 시 상태 갱신 및 히스토리 기록.
- **ReportService / ReportController**: 월간 데이터 집계 통계(JSON) 조회 및 캐싱.

---

## Verification Plan

### Automated Tests
tsoa 빌드 및 서버 구동 여부 확인을 위한 명령어 실행:
```bash
# 1. tsoa swagger 및 routes 컴파일
npm run swagger

# 2. TypeScript 컴파일 테스트
npm run typecheck

# 3. 로컬 개발 서버 실행 및 동작 검증
npm run dev
```

### Manual Verification
1. 서버 구동 후 `http://localhost:3000/status` 호출하여 200 OK 응답 검증.
2. `http://localhost:3000/api/docs` (Swagger UI) 경로에 진입하여 신규 생성된 API(User, Chat, Food, Exercise, Space, Report) 명세서가 정상 노출되고 호출 가능한지 검증.
3. 데이터베이스(MySQL)에 실제 테이블들이 스키마 매핑 정보대로 생성되었는지 확인.
