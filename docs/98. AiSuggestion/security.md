# Express & TypeScript 백엔드 보안 강화 가이드

본 문서는 TAMMY 백엔드 서비스의 웹 취약점 방어와 API 오남용(DDoS, 무차별 대입 공격 등)을 차단하기 위한 보안 라이브러리 추천 및 적용 가이드라인입니다.

---

## 1. 추천 보안 라이브러리 개요

| 라이브러리명 | 설치 대상 | 주요 방어 영역 | 필수 여부 |
| :--- | :--- | :--- | :--- |
| **helmet** | `helmet`, `@types/helmet` | HTTP 보안 헤더 설정 (XSS, 클릭재킹, sniffing 방지 등) | **필수** (강력 권장) |
| **express-rate-limit** | `express-rate-limit` | API 요청 요율 제한 (DDoS, Brute-force 공격 방지) | **필수** (강력 권장) |
| **hpp** | `hpp`, `@types/hpp` | HTTP 파라미터 오염 방지 (중복 매개변수 오류 차단) | 권장 |

---

## 2. npm 설치 명령어

프로젝트 루트 디렉토리 터미널에서 아래 명령어를 실행하여 라이브러리를 설치합니다.

```bash
npm install helmet express-rate-limit hpp
npm install --save-dev @types/hpp
```
*(참고: `helmet`과 `express-rate-limit`은 최신 버전 기준 TypeScript 정의가 패키지 내부에 내장되어 있어 별도의 `@types/` 개발 의존성이 필요하지 않습니다. `hpp`만 개발 의존성이 필요합니다.)*

---

## 3. 적용 방법 및 예시 코드 (TypeScript)

### 3.1 Rate Limit (요청 제한) 설정 파일 작성
보안 제한 수치를 중앙에서 관리하기 위해 `src/api/middlewares/rateLimiter.ts` 파일을 생성해 다음 규칙을 정의합니다.

```typescript
import rateLimit from "express-rate-limit";

// 1. 공통 전역 요율 제한 (15분간 최대 100회 요청)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    message: "너무 많은 요청이 발생했습니다. 15분 뒤에 다시 시도해주세요."
  },
  standardHeaders: true, // RateLimit-* 헤더 반환
  legacyHeaders: false,
});

// 2. 로그인/회원가입 등 인증 계열 API 대상 엄격한 제한 (1시간에 최대 5회 시도)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    status: 429,
    message: "비밀번호 오류 등으로 인한 요청 한도를 초과했습니다. 1시간 뒤 시도해주세요."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. AI 관련 API용 중 제한 (1분간 최대 10회 요청)
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    status: 429,
    message: "AI 응답 요청이 너무 잦습니다. 잠시 후 다시 이용해주세요."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

### 3.2 Express 로더에 일괄 미들웨어 적용
현재 프로젝트의 Express 초기화 코드인 `src/loaders/express.ts`에 미들웨어 형태로 등록해 줍니다.

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import { globalLimiter } from "../api/middlewares/rateLimiter";

export default ({ app }: { app: express.Application }) => {
  // 1. HTTP 보안 헤더 설정
  app.use(helmet());

  // 2. HTTP 파라미터 오염 방지
  app.use(hpp());

  // 3. CORS 설정 (이미 구성된 설정을 유지하되 필요한 도메인만 엄격히 지정)
  app.use(cors());

  // 4. JSON 및 URL 인코딩 파싱 제한 설정 (Body size 대용량 공격 방지)
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // 5. 전역 API 요율 제한기 작동
  app.use("/api", globalLimiter);
};
```

---

## 4. 라이브러리 상세 기능 요약

### 4.1 Helmet 헤더 세부 효과
`helmet()`은 실행 시 내부적으로 15개의 하위 미들웨어를 구동하여 다음과 같은 강력한 헤더들을 응답에 자동으로 추가합니다.
- `Content-Security-Policy`: 신뢰하지 않는 리소스가 웹 브라우저에서 실행되는 것을 방지합니다.
- `X-Frame-Options`: iframe 내에 사이트가 렌더링되지 않게 막아 클릭재킹 공격을 예방합니다.
- `Strict-Transport-Security`: 웹 서핑 시 강제로 HTTPS 프로토콜만 타게끔 브라우저에 명령합니다.
- `X-Content-Type-Options`: 브라우저가 임의로 파일의 MIME 형식을 스니핑하여 다른 파일로 변환 해석하는 취약점을 원천 차단합니다.

### 4.2 HPP (HTTP Parameter Pollution) 방지 원리
클라이언트 측에서 의도적이든 실수든 중복된 이름의 쿼리 값을 전송했을 때 배열로 파싱되면서 발생하는 에러를 막아줍니다.
- 예: `/users?name=John&name=Smith`
- HPP가 없을 시: `req.query.name` -> `['John', 'Smith']` (배열 타입)
- HPP 적용 시: `req.query.name` -> `'Smith'` (최종 문자열로 안전하게 필터링)

---

## 5. 로깅 및 인증/인가(Auth) 추가 권장 사항

### 5.1 Morgan (HTTP 요청 로거 - 적극 권장)
`morgan`은 유효성 검사 도구가 아니라 **실시간 HTTP 요청 로그를 기록해주는 로깅 라이브러리**입니다.
- **필요성**: 서버에 어떤 API 요청이 들어왔고 응답 속도가 얼마나 걸렸는지(`GET /api/chat 200 - 45.123 ms`) 콘솔에 보기 좋게 찍어줍니다. `winston` 로거와 병행하여 디버깅 및 모니터링 시 매우 유용하므로 도입하는 것을 권장합니다.
- **설치**: `npm install morgan` 및 `npm install --save-dev @types/morgan`
- **설정**: `app.use(morgan('dev'));`

### 5.2 JWT 인증 및 인가 (jsonwebtoken & express-jwt - 필수)
이메일 로그인 및 소셜 로그인 연동 후, 로그인 상태를 증명하고 API 접근 권한을 제어하기 위한 토큰 시스템 구축에 필수적입니다.
- **역할**: 
  - `jsonwebtoken`: 서버 측에서 JWT 토큰을 발행(Sign)하고 검증(Verify)하는 용도.
  - `express-jwt`: 특정 라우트 진입 전 미들웨어로 작동하여 HTTP Authorization Bearer 토큰을 자동으로 파싱 및 검증하고 `req.auth`에 사용자 정보를 넣어주는 역할.
- **TSOA와의 궁합**: TSOA는 자체적으로 `@Security("jwt")`와 같은 데코레이터를 지원합니다. TSOA의 `expressAuthentication` 정의 시 `jsonwebtoken`을 활용해 토큰 검증 핸들러를 매핑하면 TSOA 데코레이터와 매끄럽게 연결됩니다.

### 5.3 express-basic-auth (관리자 페이지/Swagger 문서 보호 - 권장)
관리자 전용 대시보드나 API 문서 페이지(예: `/api-docs` Swagger UI)를 외부 공격자로부터 감추고 싶을 때, ID/PW 기반의 초경량 HTTP Basic Auth를 씌우는 도구입니다.
- **역할**: 민감한 라우트에 간편한 미들웨어 형태로 적용해 비인증 사용자의 열람을 완전히 차단합니다.
- **설치**: `npm install express-basic-auth`
- **적용**: 
```typescript
import basicAuth from "express-basic-auth";

app.use("/api-docs", basicAuth({
    users: { 'admin': 'super-secret-password' },
    challenge: true,
    unauthorizedResponse: '인증 정보가 유효하지 않습니다.'
}));
```

