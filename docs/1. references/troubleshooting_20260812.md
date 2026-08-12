# 🛠️ 종합 작업 및 트러블슈팅 로그 (2026-08-12)

이 문서는 오늘 하루 동안 진행된 **'코드 아키텍처 분석 및 개선(리팩토링)'** 작업과, 그 이후 발생한 **에러들의 트러블슈팅 과정**을 모두 포함하여 기록한 학습용 문서입니다.

---

## 🏗️ 1부: 아키텍처 분석 및 구조 개선 (이전 대화 내용)

오늘 가장 먼저 수행한 작업은 전체 프로젝트의 코드를 분석하고 개선점을 도출하여 `docs/architecture-report.md` 문서를 생성한 것이었습니다.

### 1. 주요 개선(리팩토링) 사항
이전 대화에서는 5가지 핵심 영역에 대한 리팩토링을 수행했습니다.

- **[확장성] 로그 구조화 (Correlation ID 도입)**: `AsyncLocalStorage`와 `crypto.randomUUID()`를 활용해 모든 요청마다 고유 식별자(`X-Correlation-Id`)를 부여했습니다. 이제 Winston 로거가 출력하는 모든 로그에 요청 ID가 자동으로 매핑되어, 에러 발생 시 특정 요청의 흐름을 추적하기가 매우 쉬워졌습니다.
- **[아키텍처] 도메인 로직 분리 (TravelMapper)**: Mapper 내부에 하드코딩되어 있던 행성 탐사 진행률 계산식 등의 비즈니스 로직을 `TravelService`로 이동시켰습니다.
- **[보안] Rate Limiting 적용**: `express-rate-limit`를 도입하여 API 라우터에 15분당 최대 100회 요청 제한을 걸어 무차별 대입 공격(Brute-force)을 방지했습니다.
- **[보안] 테스트 인증 우회 차단**: `?userId=` 형태의 백도어 우회 로직이 실제 운영(Production) 환경에서는 작동하지 않도록 `NODE_ENV` 검증 로직을 추가했습니다.
- **[확장성] API 버저닝 체계 도입**: API Base Path를 `/api`에서 `/api/v1`으로 변경하여 명시적인 API 버전을 관리하도록 구조를 개선했습니다.
- **폴더 구조 재편성 (Co-location 및 Layer 분리)**: 도메인 내부 타입 및 DB 모델 인터페이스들을 `src/repositories/models/` 로 이동시키고, 테스트 파일들을 `src/tests/` 하위로 모아 응집도를 높였습니다.

- **아키텍처 스코어 향상**: 이러한 개선들을 통해 전체 아키텍처 품질 점수를 85점(A등급)으로 끌어올렸습니다.

> **💡 학습 포인트:**
> 시스템이 커질수록 도메인별(혹은 역할별)로 폴더 구조를 깔끔하게 나누는 것이 매우 중요합니다. 하지만 파일들의 위치를 이동시킬 때는 반드시 다른 파일에서 해당 파일을 부르는 `import` 경로들도 함께 수정해야 합니다. (이 부분이 뒤에 이어지는 에러의 원인이 되었습니다.)

---

## 🐛 2부: 리팩토링 후속 조치 및 트러블슈팅 (현재 대화 내용)

구조 개선 작업 직후 서버를 실행했을 때 마주친 치명적인 에러들과 이를 해결한 과정입니다.

### 에러 1: `asyncQueue.ts` 문법(Syntax) 에러 (TS1068, TS1128)

**🚨 문제 현상**
```text
src/utils/asyncQueue.ts(83,7): error TS1068: Unexpected token...
```
**🔍 원인 및 💡 해결**
- 코드 수정 중 `catch` 블록 내부에 있던 `if (job) {` 이라는 조건문 시작 부분이 실수로 지워져 닫는 중괄호 `}`만 남는 구문 오류가 발생했습니다.
- 지워진 `if (job) {`을 다시 복구하여 중괄호 짝을 맞춰 해결했습니다.

### 에러 2: Prisma DB 연결 에러 (환경변수 우선순위 문제)

**🚨 문제 현상**
```text
🔥 Failed to initialize Prisma Client 🔥
Error: Database connection URL is not configured in .env file.
```
**🔍 원인 및 💡 해결**
- 아키텍처 개선 과정에서 `.env.development`, `.env.production`, `.env.test` 파일로 환경 설정을 분리했습니다.
- `npm run dev` 실행 시 `NODE_ENV=development`가 되면서 `.env.development`를 우선적으로 읽어옵니다. 하지만 해당 파일 안에 `DATABASE_URL=""` 처럼 값이 비어있어서 DB 연결에 실패했습니다.
- `.env`에 있던 실제 DB 접속 URL, JWT 시크릿, API 설정 등을 `.env.development`, `.env.production`, `.env.test` 3곳에 모두 복사해 넣어 해결했습니다.

### 에러 3: 폴더 이동으로 인한 경로 및 타입 매핑 에러 (TS2307, TS2322)

**🚨 문제 현상**
```text
src/interfaces/user.ts(1,22): error TS2307: Cannot find module '../models/User'
```
**🔍 원인 및 💡 해결**
- **경로 에러**: 앞선 1부에서 `models` 폴더를 `repositories/models`로, 테스트 파일들을 `src/tests/`로 이동시켰지만, 기존 파일들의 `import` 경로는 옛날 경로 그대로 남아있었습니다.
- **해결**: 에러가 발생한 10여 개의 파일에서 `import` 경로를 현재 위치에 맞는 상대 경로(`../` 또는 `../../`)로 일일이 추적하여 수정했습니다.
  - 예: `../models/User` ➔ `../repositories/models/User`
- **타입 매핑 에러**: `travelMapper.ts`에서 응답 데이터를 매핑할 때, `string`과 `string[]` 사이의 타입 불일치가 발생한 부분을 안전한 Type Casting(강제 형변환)을 통해 해결했습니다.

---

## 📝 종합 교훈
1. **리팩토링 후엔 Typecheck 필수**: 폴더나 파일 위치를 대대적으로 변경했다면, 반드시 `npm run typecheck`를 돌려 깨진 `import` 경로가 없는지 검증해야 합니다.
2. **환경변수 분리 시 초기값 세팅**: 환경별(dev, prod, test)로 설정 파일을 나누었다면, 각각의 파일에 애플리케이션 구동에 필수적인 값들이 모두 잘 들어있는지 확인해야 합니다.
3. **IDE 에러 꼼꼼히 살피기**: 사소하게 지워진 괄호 하나가 전체 서버 실행을 막습니다. 텍스트 에디터나 IDE의 문법 에러 표시를 항상 주의 깊게 봐야 합니다.
