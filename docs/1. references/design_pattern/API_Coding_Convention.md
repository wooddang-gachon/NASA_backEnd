# TAMMY v3 백엔드 API 컨트롤러 및 DTO 코딩 컨벤션 & 디자인 패턴 가이드

본 문서는 TAMMY v3 서비스 백엔드(Node.js / Express / tsoa / TypeDI)의 컨트롤러(Controller) 및 DTO(Data Transfer Object) 구현 시 준수해야 하는 API 코드 작성 규격, DTO 설계 규칙, 매퍼 패턴 및 표준 코딩 컨벤션을 정의합니다.

---

## 1. 아키텍처 개요 및 계층 구조 (Layered Architecture)

TAMMY v3 백엔드는 **tsoa**를 이용한 OpenAPI(Swagger) 문서 자동화와 **TypeDI**를 활용한 의존성 주입(DI) 기반의 레이어드 아키텍처를 따릅니다.

1. **Controller Layer (`src/api/routes`)**: HTTP 요청 바인딩, 인증 검증, DTO 포매팅, HTTP 상태 코드 설정 및 서비스 호출
2. **DTO Layer (`src/interfaces`, `src/models`, `src/dto`)**: Request/Response 데이터 구조체 정의, 검증 타입, 공통 응답 래핑 및 변환 매퍼 함수
3. **Service Layer (`src/services`)**: 비즈니스 로직 처리, DTO ↔ Entity 변환 매핑, 트랜잭션 관리, AI 서버 연동 및 외부 API 호출
4. **Data Access / Model Layer (`src/models`, Prisma)**: 데이터베이스 독점 CRUD 트랜잭션 및 도메인 엔티티 정의

---

## 2. DTO (Data Transfer Object) 설계 및 작성 규격

DTO는 API의 입출력 데이터를 명확히 규정하고 도메인 DB 엔티티가 외부에 직접 노출되지 않도록 분리(Encapsulation)하는 핵심 레이어입니다.

### 2.1 Request DTO 작성 규격 (Req DTO)
- **파일명/위치**: `src/models/[Domain].ts` 또는 `src/interfaces/[domain].ts`
- **네이밍 규칙**: `[Domain][Action]Request` 또는 `[Domain][Action]ApiRequest` (예: `UserSignUpRequest`, `QuickLogApiRequest`, `FoodLogConfirmRequest`)
- **작성 지침**:
  - 클라이언트가 전달해야 하는 모든 필드의 타입, 필수/선택 여부(`?`), Enum 인터페이스를 명확히 선언합니다.
  - 보안상 중요한 비밀번호 등은 Request DTO에만 존재해야 하며 Response DTO로 유출되지 않아야 합니다.

```typescript
// 예시: 1-Tap 퀵로그 요청 DTO (src/models/QuickLog.ts)
import { QuickLogCategory, EmotionType } from "@prisma/client";

export interface QuickLogApiRequest {
  category: QuickLogCategory;     // WATER | EMOTION | JOURNAL | EXERCISE
  amount?: number;                 // 수분 섭취량 (ml)
  emotionType?: EmotionType;       // HAPPY | SAD | ANGRY | STRESSED | CALM
  journalContent?: string;         // 감정 일기 내용
  exerciseName?: string;           // 운동 항목명
  durationMinutes?: number;        // 운동 시간 (분)
}
```

### 2.2 Response DTO 작성 규격 (Res DTO)
- **네이밍 규칙**: `[Domain][Action]Response` 또는 `[Domain][Action]ApiResponse` (예: `UserLoginResponse`, `QuickLogApiResponse`, `TravelStateInfoResponse`)
- **작성 지침**:
  - 클라이언트에 필요한 비즈니스 데이터만 선별하여 정의합니다.
  - DB 엔티티의 스네이크 케이스(`user_id`, `created_at`)를 카멜 케이스(`userId`, `createdAt`)로 변환하여 정의합니다.
  - 모든 API 응답은 최상위에서 `ApiResponse<T>` 제네릭 구조로 감싸집니다.

```typescript
// 예시: 1-Tap 퀵로그 응답 데이터 DTO (src/models/QuickLog.ts)
export interface QuickLogApiResponse {
  logId: string;
  category: string;
  earnedFuel: number;
  totalFuel: number;
}
```

### 2.3 공통 응답 래핑 DTO 규약 (`ApiResponse<T>`)
모든 외부 RESTful API는 `src/dto/ApiResponse.ts`에 정의된 `ApiResponse<T>` 클래스를 통해 래핑되어 동일한 응답 컨트랙트를 보장합니다.

```typescript
// src/dto/ApiResponse.ts
export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  code?: number;

  constructor(success: boolean, message: string, data?: T, code: number = 200) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.code = code;
  }

  static success<T>(data: T, message: string = "요청이 성공적으로 처리되었습니다.", code: number = 200): ApiResponse<T> {
    return new ApiResponse(true, message, data, code);
  }

  static error(message: string = "요청 처리 중 오류가 발생했습니다.", code: number = 400): ApiResponse<undefined> {
    return new ApiResponse(false, message, undefined, code);
  }
}
```

### 2.4 DTO 변환 헬퍼 (Mapper / Converter) 패턴
DB Prisma 엔티티와 DTO 간 변환 로직은 `to[Domain]Response` 순수 함수 형태로 작성하여 재사용성과 테스토빌리티를 높입니다.

```typescript
// 예시: Prisma DB 객체를 Res DTO로 변환하는 Mapper 함수 (src/models/PlanetTravel.ts)
import { planet_travels, TravelStatus } from "@prisma/client";
import { PlanetTravelResponse } from "../interfaces/travel";

export function toPlanetTravelResponse(travel: planet_travels): PlanetTravelResponse {
  return {
    id: travel.id.toString(),
    userId: travel.user_id,
    planetId: travel.planet_id,
    planetType: travel.planet_type,
    fuelSpent: travel.fuel_spent,
    status: travel.status,
    startedAt: travel.started_at.toISOString(),
    completedAt: travel.completed_at ? travel.completed_at.toISOString() : null,
  };
}
```

---

## 3. API 컨트롤러 핵심 코딩 규격 5대 원칙

### 3.1 클래스 데코레이터 및 의존성 주입 (Dependency Injection)
- 컨트롤러 클래스는 TypeDI 싱글톤 등록을 위해 `@Service()`를 선언합니다.
- tsoa 라우팅 및 Swagger 태깅을 위해 `@Route("경로")`와 `@Tags("번호. 태그명")`을 명시합니다.
- `Service` 레이어 인스턴스는 `Container.get(ServiceClass)`를 통해 주입받습니다.

### 3.2 명확한 반환 타입 및 `ApiResponse<T>` 래핑
- 모든 컨트롤러 메소드는 `Promise<ApiResponse<T>>` 형태의 명시적 반환 타입을 가져야 합니다.
- 응답 생성 시 `ApiResponse.success(data, message, statusCode)` static 팩토리 메소드를 사용하여 일관된 JSON 래핑 구조를 유지합니다.

### 3.3 HTTP Status Code 명시
- 기본 성공 200 OK 외에 신규 리소스 생성(201 Created) 시 `this.setStatus(201)`을 명시적으로 호출합니다.
- `ApiResponse.success(..., statusCode)`의 3번째 인자에도 동일한 상태 코드를 전달합니다.

### 3.4 JWT 인증 및 사용자 식별
- 인증이 필요한 엔드포인트에는 `@Security("jwt")` 데코레이터를 적용합니다.
- 요청 객체에서 유저 ID 추출 시 `@Request() request: AuthenticatedRequest`와 `getAuthenticatedUserId(request)` 헬퍼 함수를 사용합니다.

### 3.5 JSDoc 기반 OpenAPI 문서 자동화
- 메소드 상단에 `@summary` 주석을 작성하여 Swagger UI에 직관적인 기능 제목이 표시되도록 합니다.

---

## 4. 대표 표준 패턴 코드 예시

### 4.1 [Pattern 1] 리소스 생성 패턴 (Req & Res DTO 연동 / POST 201 Created)
클라이언트의 Request DTO를 받아 처리 후 201 Created 상태와 Response DTO를 반환하는 기본 패턴입니다.

```typescript
import { Controller, Route, Post, Body, Tags } from "tsoa";
import { Service, Container } from "typedi";
import AuthService from "../../services/authService";
import { ApiResponse } from "../../dto";
import type { UserSignUpRequest, UserLoginResponse } from "../../interfaces";

@Service()
@Tags("1. Auth - 회원 인증 및 소셜 로그인")
@Route("auth")
export class AuthController extends Controller {
  private authService = Container.get(AuthService);

  /**
   * 이메일과 비밀번호 기반으로 신규 회원을 등록합니다.
   * @summary 일반 회원가입
   */
  @Post("register")
  public async register(
    @Body() requestBody: UserSignUpRequest
  ): Promise<ApiResponse<UserLoginResponse>> {
    this.setStatus(201);
    const result = await this.authService.signUp(requestBody);
    return ApiResponse.success(result, "회원가입이 성공적으로 완료되었습니다.", 201);
  }
}
```

### 4.2 [Pattern 2] JWT 인증 및 1-Tap 퀵기록 생성 패턴 (Protected Req DTO ➔ Res DTO)
JWT 토큰 검증이 필요한 요청에서 `userId`를 추출하고 Request DTO를 받아 Response DTO를 생성하는 패턴입니다.

```typescript
import { Controller, Route, Post, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import QuickLogService from "../../services/quickLogService";
import { getAuthenticatedUserId, type AuthenticatedRequest } from "../../interfaces/express";
import { QuickLogApiRequest, QuickLogApiResponse } from "../../models/QuickLog";
import { ApiResponse } from "../../dto";

@Service()
@Tags("3. QuickLog - 1-Tap 웰니스 퀵기록")
@Route("quick-log")
export class QuickLogController extends Controller {
  private quickLogService = Container.get(QuickLogService);

  /**
   * 데일리 웰니스 항목을 1-Tap으로 원터치 기록하고 우주 연료(Fuel)를 적립합니다.
   * @summary 1-Tap 웰니스 퀵기록 생성
   */
  @Post("")
  @Security("jwt")
  public async createQuickLog(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody: QuickLogApiRequest
  ): Promise<ApiResponse<QuickLogApiResponse>> {
    const userId = getAuthenticatedUserId(request);
    this.setStatus(201);
    const result = await this.quickLogService.createQuickLog(userId, requestBody);
    return ApiResponse.success(result, "퀵기록이 성공적으로 등록되었습니다.", 201);
  }
}
```

### 4.3 [Pattern 3] 인증 기반 리소스 조회 패턴 (Res DTO 반환 / GET 200 OK)
현재 로그인한 사용자의 프로필, 대시보드 통계 등을 조회하여 Response DTO로 감싸 반환하는 패턴입니다.

```typescript
import { Controller, Route, Get, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import UserService from "../../services/userService";
import { getAuthenticatedUserId, type AuthenticatedRequest } from "../../interfaces/express";
import { UserProfileResponse } from "../../models/User";
import { ApiResponse } from "../../dto";

@Service()
@Tags("2. User - 내 정보 및 프로필 관리")
@Route("users")
export class UserController extends Controller {
  private userService = Container.get(UserService);

  /**
   * 로그인한 현재 사용자의 닉네임, 보유 연료량, 타미 펫 상태를 조회합니다.
   * @summary 내 프로필 및 타미 상태 조회
   */
  @Get("me")
  @Security("jwt")
  public async getMe(
    @Request() request: AuthenticatedRequest
  ): Promise<ApiResponse<UserProfileResponse>> {
    const userId = getAuthenticatedUserId(request);
    const result = await this.userService.getUserProfile(userId);
    return ApiResponse.success(result, "내 프로필 및 타미 상태 조회가 완료되었습니다.");
  }
}
```

### 4.4 [Pattern 4] 파일 업로드 & Multipart Form 패턴 (Media Upload)
이미지 파일 업로드 및 추가 폼 필드를 바인딩하여 분석하는 패턴입니다.

```typescript
import { Controller, Route, Post, UploadedFile, FormField, Security, Tags } from "tsoa";
import { Service, Container } from "typedi";
import FoodService from "../../services/foodService";
import { MealType } from "../../interfaces/enums";
import { ApiResponse } from "../../dto";

@Service()
@Tags("4. FoodVision - 식단 스캔 & 영양성분 기록")
@Route("food-vision")
export class FoodVisionController extends Controller {
  private foodService = Container.get(FoodService);

  /**
   * 식단 사진 이미지 파일(multipart/form-data)을 업로드하고 AI 비전 모델로 분석합니다.
   * @summary 식단 사진 파일 업로드 & AI 비전 분석 스캔
   */
  @Post("scan")
  @Security("jwt")
  public async scanFoodVision(
    @UploadedFile("file") file: Express.Multer.File,
    @FormField("mealType") mealType?: MealType
  ): Promise<ApiResponse<any>> {
    const data = await this.foodService.uploadAndAnalyzeFoodVision(file, mealType);
    return ApiResponse.success(data, "식단 이미지 업로드 및 분석이 성공적으로 완료되었습니다.");
  }
}
```

---

## 5. 체크리스트 (Code Review Checklist)

API 작성 후 PR/동료 검수 시 아래 항목을 체크하세요.

- [ ] Request/Response DTO가 도메인 엔티티(DB)와 명확히 분리되었는가?
- [ ] DTO의 카멜 케이스(camelCase) 필드명이 스네이크 케이스(snake_case) DB 칼럼과 제대로 매핑되었는가?
- [ ] `@Route` 및 `@Tags` 설정이 API Specification 문서와 일치하는가?
- [ ] `@Security("jwt")` 미들웨어가 필요한 엔드포인트에 누락 없이 작성되었는가?
- [ ] 메소드 상단에 `@summary`를 포함한 JSDoc 주석이 작성되어 있는가?
- [ ] 생성 요청(POST)의 경우 `this.setStatus(201)` 및 `ApiResponse.success(..., 201)`이 올바르게 명시되었는가?
- [ ] 반환값이 `Promise<ApiResponse<T>>` 타입으로 엄격하게 지켜졌는가?
