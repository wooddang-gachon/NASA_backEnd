# NASA BackEnd Study Project

TypeScript와 Node.js를 기반으로 개발하는 백엔드 스터디용 프로젝트입니다. NASA 관련 오픈 API를 연동하거나 백엔드 기본기를 학습하기 위한 용도로 구성되어 있습니다.

## 🛠 기술 스택

- **Runtime**: Node.js (v20+ 권장)
- **Language**: TypeScript
- **Execution Tool**: `tsx` (TypeScript Execute)

## 📁 디렉토리 구조

```text
├── docs/               # 프로젝트 관련 문서 보관 디렉토리
├── src/                # 소스 코드 디렉토리
│   └── index.ts        # 애플리케이션 진입점 (Entry Point)
├── package.json        # 의존성 관리 및 빌드 스크립트 설정
├── tsconfig.json       # TypeScript 컴파일러 설정
└── readme.md           # 프로젝트 설명 문서
```

## 🚀 시작하기

### 1. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 환경 변수들을 설정합니다.

### 2. 패키지 설치

프로젝트에 필요한 패키지를 설치합니다.

```bash
npm install
```

### 3. 데이터베이스 및 Prisma 설정

데이터베이스 스키마를 적용하고 Prisma 클라이언트를 생성합니다.

```bash
# DB 마이그레이션 실행 (개발 모드)
npm run prisma:migrate

# Prisma 클라이언트 생성
npm run prisma:generate

# Prisma Studio 실행 (웹 브라우저에서 DB 관리)
npm run prisma:studio
```

### 4. Swagger API 문서 생성

tsoa를 사용하여 Swagger 스펙 및 라우트를 생성합니다.

```bash
npm run swagger
```

### 5. 개발 서버 실행 (`tsx watch`)

소스 코드가 변경될 때마다 자동으로 재시작되는 개발 모드입니다.

```bash
npm run dev
```

### 6. 프로젝트 빌드 및 실행

TypeScript 코드를 JavaScript로 컴파일하고 빌드된 파일을 실행합니다.

```bash
# 프로젝트 빌드 (Swagger 문서 생성 포함)
npm run build

# 빌드된 프로덕션 서버 실행
npm run start
```

### 7. 타입 체크

컴파일 없이 TypeScript 타입 오류만 검사합니다.

```bash
npm run typecheck
```

## 🧪 테스트 실행

Jest를 사용하여 테스트를 수행합니다.

### 테스트 실행 명령어

```bash
# 전체 테스트 실행
npm run test
```
