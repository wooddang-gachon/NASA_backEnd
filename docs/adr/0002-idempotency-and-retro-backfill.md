# ADR 0002: Idempotency with Client Request ID and Monthly Retro 2-Tier Backfill

## Status
Accepted

## Context
모바일 앱 환경에서는 네트워크 단절 및 불안정으로 인한 자동 재시도로 인해 동일한 기록 요청이 복수 회 전송될 수 있습니다. 이로 인해 연료가 2배로 적립되거나 거리가 중복 차감되는 문제가 발생할 수 있습니다. 또한 매월 1일 실행되는 월간 회고 크론 배치가 서버 장애나 재시작으로 누락될 위험이 있습니다.

## Decision
1. **DB 레벨 멱등성 보장**:
   - `fuel_logs` 테이블의 `client_request_id` 컬럼에 UNIQUE 인덱스를 설정.
   - 요청 수신 시 동일 `client_request_id`가 이미 존재하면 게이지 변동 없이 `gainedFuel: 0`, `distanceReduced: 0`과 함께 기존 상태를 정상 반환.
2. **월간 회고 2중 방어**:
   - Tier 1: 매월 1일 09:00 KST 크론 배치 자동 실행.
   - Tier 2: 사용자 접속 시 전월 리포트 미발행 상태가 감지되면 즉시 온디맨드 백필 생성.

## Consequences
- 긍정적: 네트워크 오류로 인한 데이터 오염 및 중복 적립 원천 차단, 서버 장애 시에도 월간 회고 무누락 보장.
