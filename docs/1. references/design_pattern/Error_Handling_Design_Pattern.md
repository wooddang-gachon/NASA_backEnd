# TAMMY v3 백엔드 예외 처리 디자인 패턴 및 에러 핸들링 규격

본 문서는 NASA_backEnd 프로젝트에서 비즈니스 로직 및 외부 시스템 연동 시 준수해야 하는 **예외 처리 디자인 패턴(Error Handling & Exception Translation Pattern)** 및 규격을 정의합니다.

---

## 1. 아키텍처 원칙 및 패턴 목적

### 1.1 예외 번역 패턴 (Exception Translation Pattern)
- **개념**: 하위 레이어(데이터베이스, 외부 HTTP API, 타사 SDK 등)에서 발생한 저기급/시스템 예외를 상위 비즈니스 레이어가 이해할 수 있는 의미 있는 도메인 전용 예외(Domain Exception)로 변환(Translation)하여 재던지는 패턴입니다.
- **목적**:
  1. **정보 은닉 및 보안 (Information Hiding)**: 외부 서비스 스택 트레이스, DB 쿼리 오류, 내부 서버 IP 등의 민감한 시스템 정보가 클라이언트에 직노출되는 것을 방지합니다.
  2. **디버깅 용이성 (Traceability)**: 서버 로거에는 원본 에러 객체와 컨텍스트 메시지를 남겨 트러블슈팅 속도를 극대화합니다.
  3. **계층 간 결합도 감소 (Decoupling)**: Controller나 Middleware가 외부 라이브러리/DB 전용 에러 클래스에 직접 의존하지 않고 표준 `AppError` 계층에만 의존합니다.

### 1.2 우아한 성능 저하 패턴 (Graceful Degradation / Fallback Pattern)
- **개념**: 외부 AI 서버나 부가 서비스 연동이 일시적으로 실패하더라도, 시스템 전체가 500 에러로 중단되지 않고 기본값(Fallback)을 제공하거나 사용자에게 안전한 안내를 전달하는 패턴입니다.

---

## 2. 계층별 에러 핸들링 책무 (Layer Responsibilities)

```text
[ External API / DB Layer ]
           │ (Raw Error 발생: Fetch Error, Prisma Error 등)
           ▼
[ Service Layer ] ── (Logger.error 기록 + 예외 번역) ──► Throw Custom AppError
           │
           ▼
[ Controller Layer ] ──► (비즈니스 로직에만 집중, 에러 Catch 생략)
           │
           ▼
[ Global Error Middleware ] ──► (AppError 타입 판별 ➔ ApiResponse 5xx/4xx 이쁜 응답 변환)
```

1. **Service Layer**
   - 외부 통신 및 DB 조회 실패 시 `try-catch`로 포획합니다.
   - `Logger.error(...)`를 통해 원본 시스템 에러를 기록합니다.
   - 의미에 맞는 커스텀 에러(`BadGatewayError`, `AiServerError` 등)로 래핑하여 던집니다.

2. **Controller Layer**
   - 개별 라우터마다 비대해지는 `try-catch`를 최소화하고 서비스가 던진 커스텀 에러가 글로벌 미들웨어로 전파되도록 합니다.

3. **Global Error Middleware (`src/api/middlewares/errorHandler.ts`)**
   - 포획된 에러가 `AppError`의 인스턴스인 경우 해당 에러의 `status` 및 `message`를 기반으로 표준 `ApiResponse.error()` 형태로 응답합니다.

---

## 3. 커스텀 예외 클래스 계층 구조 (`src/errors/index.ts`)

프로젝트 내 모든 예외는 `AppError` 최상위 클래스를 상속받아 구현합니다.

```text
AppError (Base)
 ├── BadRequestError (400)
 ├── UnauthorizedError (401)
 ├── ForbiddenError (403)
 ├── NotFoundError (404)
 │    └── UserNotFoundError (404)
 ├── ConflictError (409)
 ├── BadGatewayError (502)          # 외부 API / 소셜 연동 실패 시
 ├── AiServerError (503)            # AI 서비스 전용 장애 시
 └── InternalServerError (500)      # 시스템 내부 심각한 에러
```

---

## 4. 예외 처리 코드 작성 표준 규격

### 4.1 서비스 레이어 외부 연동 예시 (`AuthService.ts`)

```typescript
import Logger from "@/loaders/logger";
import { BadGatewayError, UnauthorizedError } from "@/errors";

public async getSocialProfile(provider: string, token: string) {
  try {
    const response = await fetch(`https://api.${provider}.com/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new UnauthorizedError("유효하지 않은 소셜 토큰입니다.");
    }

    return await response.json();
  } catch (err: any) {
    // 1. 이미 도메인 커스텀 에러인 경우 그대로 전파
    if (err instanceof AppError) throw err;

    // 2. 서버 콘솔/파일에는 상세한 원본 에러 로그 기록
    Logger.error(`[AuthService] 외부 소셜 인증 서버 통신 실패 (${provider}): ${err.message}`, { err });

    // 3. 클라이언트 노출용 표준 비즈니스 에러로 번역하여 Throw
    throw new BadGatewayError("외부 소셜 인증 서비스 연동 중 오류가 발생했습니다.");
  }
}
```

### 4.2 Graceful Degradation / Fallback 패턴 예시 (`FoodService.ts`)

```typescript
public async analyzeFoodVision(imageUrl: string) {
  let aiVisionResult: any;
  try {
    aiVisionResult = await this.aiService.analyzeFoodVision(imageUrl);
  } catch (e) {
    // 완전한 중단 대신 안전한 기본값(Mock/Fallback)을 준비하고 사용자 안내 메시지 포함
    Logger.warn(`[FoodService] AI Vision scan fallback triggered: ${e}`);
    aiVisionResult = {
      scanEngine: "YOLO",
      message: "AI 서버 연동이 지연되어 기본 식단 정보를 제공합니다.",
      detectedFoods: [
        { foodName: "일반 식단", estimatedGram: 200, calories: 250 }
      ]
    };
  }
  return aiVisionResult;
}
```

---

## 5. 개발자 체크리스트

1. [ ] 서비스 레이어에서 외부 연동/시스템 호출 시 원본 에러 메시지가 클라이언트에 그대로 던져지지 않는가?
2. [ ] 예외 포획 시 `Logger.error`에 원본 에러 컨텍스트가 기록되어 있는가?
3. [ ] 정의된 `AppError` 하위 커스텀 에러 클래스(`BadGatewayError`, `AiServerError` 등)를 적절히 사용하였는가?
4. [ ] 비즈니스 영향도에 따라 'Exception Translation (에러 던지기)'과 'Fallback (기본값 제공)' 중 적절한 패턴을 선택하였는가?
