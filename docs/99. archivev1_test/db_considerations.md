# Database Considerations for Backend Development

본 문서는 TAMMY 서비스 백엔드 개발 시 데이터베이스(MySQL) 설계 및 쿼리 구현 과정에서 성능, 동시성, 데이터 정밀성을 보장하기 위해 반드시 고려해야 할 핵심 가이드라인을 정의합니다.

---

## 1. 조회 성능 최적화 (Index 설계)

### 1.1 채팅 메시지 조회 최적화
AI 채팅 기능의 특성상 `chat_messages` 테이블에는 사용자당 대량의 대화 이력이 누적됩니다. 사용자가 채팅방에 진입하거나 이전 대화 내역을 스크롤할 때 페이징 조회가 발생합니다.
- **조회 패턴**: `WHERE user_id = ? ORDER BY id DESC LIMIT 20` 또는 `WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
- **인덱스 전략**: 외래 키 단일 인덱스 대신, 성능을 극대화하기 위해 `(user_id, created_at DESC)` 또는 `(user_id, id DESC)` 복합 인덱스(Composite Index)를 명시적으로 구성합니다.

### 1.2 활동 로그 날짜 범위 검색 최적화
`food_logs`, `exercise_logs`, `water_logs`, `emotion_logs` 등은 일간/주간/월간 집계를 위해 날짜 필터링이 수반됩니다.
- **조회 패턴**: 특정 유저의 최근 일주일 또는 한 달치 범위 검색
- **인덱스 전략**: `(user_id, registered_at)`, `(user_id, performed_at)` 등 `유저ID + 날짜` 조합의 복합 인덱스를 적용하여 인덱스 스캔(Index Scan) 범위 내에서 빠르게 데이터를 추출합니다.

---

## 2. 동시성 제어 및 무결성 보장

### 2.1 우주선 연료 계산 레이스 컨디션 (Race Condition)
사용자가 여러 기록을 동시에 등록하거나 짧은 간격으로 API가 중복 호출될 때, `space_travel_states`의 연료 가산(+5, +10 등) 연산에서 동시성 충돌이 발생할 수 있습니다.
- **예상 이슈**: 현재 연료가 95인 상태에서 식사 기록 API와 운동 완료 API가 동시 처리되어 둘 다 100을 돌파하는 조건문을 타게 되면, 행성 도달(연료 0으로 초기화 및 `planet_histories` 삽입) 로직이 중복으로 발생할 우려가 있습니다.
- **해결 방안**: 
  - 백엔드 비즈니스 로직 처리 시 해당 유저의 `space_travel_states` 행에 비관적 락(Pessimistic Lock, 예: `SELECT ... FOR UPDATE`)을 적용하여 연료 정산 과정을 순차적으로 강제해야 합니다.
  - DB 레벨에서는 `current_fuel`이 100을 넘을 수 없도록 `CHECK (current_fuel >= 0 AND current_fuel <= 100)` 제약조건을 명시하여 데이터 오염을 2차적으로 방지합니다.

### 2.2 부모-자식 상속 관계 데이터 일관성
`planets` 테이블과 도메인별 자식 테이블(`exercise_planets` 등)은 Class Table Inheritance 구조를 가집니다.
- **해결 방안**: 행성 마스터 데이터를 새로 적재하거나 변경할 때, 반드시 하나의 데이터베이스 트랜잭션(Transaction) 내에서 부모 테이블(planets)과 자식 테이블의 쓰기가 모두 성공하거나 실패(Rollback)하도록 개발단에서 트랜잭션을 엄격하게 제어해야 합니다.

---

## 3. JSON 데이터 타입 활용 기준

### 3.1 `monthly_reports.aggregated_data` 운용
통계 데이터의 편의성을 위해 JSON 타입을 채택했습니다.
- **주의 사항**: JSON 내부 속성에 직접적으로 인덱스를 적용할 수 없으므로, JSON 내부의 데이터는 WHERE 조건절이나 ORDER BY 정렬 대상이 되어서는 안 됩니다.
- **규칙**:
  - 조건 검색, 필터링, 정렬 기준이 되는 데이터(예: `health_score`, `report_year_month`)는 반드시 별도의 물리 컬럼으로 분리하여 인덱스를 부여합니다.
  - JSON 컬럼은 통계 렌더링에 필요한 대량의 가공 정보(차트용 배열 등)를 한 번에 단순 조회하는 캐싱 용도로만 국한해야 합니다.

---

## 4. 데이터 급증 대책 및 보존 정책

### 4.1 채팅 데이터 파티셔닝 및 아카이빙
서비스가 활성화됨에 따라 `chat_messages` 데이터가 기하급수적으로 증가하게 됩니다.
- **고려 사항**: 
  - 과거 오래된 대화는 읽기 전용 보존 영역(Cold Storage)으로 주기적으로 백업 및 이관하고, 라이브 DB에서는 최근 대화 위주로 최적화하는 아카이빙 파이프라인 설계를 향후 검토해야 합니다.
  - 데이터가 임계점 이상으로 늘어날 경우, `created_at` 컬럼 기준의 레인지 파티셔닝(Range Partitioning) 적용을 검토합니다.
