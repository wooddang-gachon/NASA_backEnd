# ADR 0001: Star Travel Two-Gauge System and Lifecycle Separation

## Status
Accepted

## Context
기존 시스템은 `users.current_fuel` 단일 연료만 존재하여, 한 가지 활동만 반복하는 사용자(예: 물만 마시는 사용자)가 다른 행성으로 가거나 특정 행성을 목표로 행동하는 목적성이 희미했습니다. 또한 탐사 출발과 리포트 생성이 단일 동기 API로 묶여 있어, 애니메이션 처리 및 비정상 앱 종료 시 롤백 이슈가 존재했습니다.

## Decision
1. **Two-Gauge 분리**:
   - 전역 공용 연료 `Fuel` (0~100)
   - 4대 행성별 독립 거리 `Distance` (100~0)
2. **편식 방지 밸런스**:
   - 거리 -10 활동은 10회 = Fuel 100 도달.
   - 거리 -5 활동은 20회 = Fuel 200 (100 캡).
   - 편식하더라도 거리 0 도달 시 항상 Fuel은 100 이상을 보장.
3. **출발/도착 2단계 라이프사이클**:
   - `POST /planet-travel/depart`: 출발 즉시 Fuel 100 소모(0 차감) 및 `TRAVELING` 전환.
   - `POST /planet-travel/arrive`: 도착 즉시 해당 행성 Distance 100 리셋, `READY` 복귀 및 비동기 리포트 생성 잡 등록.

## Consequences
- 긍정적: 한 행성만 파는 편식 사용자도 좌절 없이 탐사 출발 가능, 애니메이션 도중 추가 활동 연료 보존, 재접속 시 여행 상태 완벽 복구.
- 주의사항: `user_planet_progress` 테이블을 통한 원자적 상태 관리가 필요함.
