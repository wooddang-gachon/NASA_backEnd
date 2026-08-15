# Structured Logging (구조화된 로깅) 적용 계획 및 가이드

본 문서는 NASA_backEnd 프로젝트 전반에 구조화된 로깅을 통일성 있게 적용하기 위한 가이드라인 및 액션 플랜입니다.

## 1. 목적 (Purpose)
* **로그 검색 및 필터링 최적화**: ELK, Datadog 등의 모니터링 환경에서 특정 JSON Key 단위로 필터링을 용이하게 합니다.
* **로컬 디버깅 향상**: 로컬 터미널 출력 시 메타데이터 객체를 예쁘게(Pretty-print) 정렬하여 개발 효율을 높입니다.
* **에러 트래킹 고도화**: 단순 텍스트 에러가 아닌 StackTrace 및 당시 상태(Context)를 함께 보존하여 원인 파악을 가속화합니다.

## 2. 적용 가이드라인 및 단계별 계획

### 1단계: Logger Factory를 통한 Boilerplate 제거 및 Prefix 바인딩
매 로깅 호출마다 수동으로 `prefix`를 넣는 실수를 방지하기 위해, **팩토리 패턴(Factory Pattern)**을 사용하여 해당 클래스 전용 로거 인스턴스를 생성합니다.
```typescript
import LoggerFactory from '@/loaders/logger';

class FoodVisionService {
  // 생성 시점에 Prefix가 자동으로 바인딩된 로거 생성
  private readonly logger = LoggerFactory.getLogger(FoodVisionService.name);

  async process() {
    // prefix를 넘길 필요 없이 메타데이터만 전송
    this.logger.info('Uploading and analyzing food vision file', {
      fileName: file.originalname,
      fileSize: file.size
    });
  }
}
```

### 2단계: Trace ID (Correlation ID) 공통 주입
ELK나 Datadog에서 단일 HTTP 요청의 흐름을 한 번에 추적(Trace)하기 위해, `AsyncLocalStorage`를 활용해 전역적으로 고유 식별자를 발급하여 로그에 자동 병합합니다. (현재 `logger.ts`의 `correlationIdFormat` 기능 활용 및 고도화)

### 3단계: 핵심 비즈니스 로직(파이프라인) 상태 및 에러 로깅
파이프라인의 "상태 변화"와 에러 당시의 "Context(스택트레이스 포함)"를 분리된 객체로 기록합니다.
```typescript
this.logger.error('YOLO 스캔 중 치명적 에러 발생', {
  action: 'stageLocalYoloScan',
  imageUrl: ctx.imageUrl,
  errorMessage: err instanceof Error ? err.message : String(err),
  stackTrace: err instanceof Error ? err.stack : undefined
});
```

### 4단계: 민감 정보 및 대용량 객체 마스킹 (Sanitization)
객체를 통째로 넘기다 발생할 수 있는 사고를 방지하기 위해, Winston 로거 레벨에서 특정 Key를 마스킹 처리합니다.
* **필터링 대상**: `buffer`, `password`, `token`, ` 주민번호(PII)` 등
* **적용 방식**: Winston format 단에서 정규식이나 Key 검사를 통해 해당 값을 `[MASKED]` 또는 `[FILTERED]`로 변환하는 안전장치 추가.
