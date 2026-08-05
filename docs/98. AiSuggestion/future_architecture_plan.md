# TAMMY 차세대 아키텍처 및 비용 최적화 개선 계획서 (Future Architecture & Cost Optimization Plan)

본 문서는 TAMMY(타미) 서비스의 고도화 과정에서 필요한 AI 아키텍처 전환(RAG 도입 시점) 및 식단 비전 분석의 토큰/비용 최적화 전략을 다루는 향후 기술 발전 계획서입니다.

---

## 1. RAG (Retrieval-Augmented Generation) 단계별 도입 계획

### 1.1 1단계 (현재 / 초기 MVP) : RDBMS + Context Injection & Function Calling
- **적용 방식**: 수분/운동/식단 데이터 및 기본 사용자 프로필 정보는 Prisma(RDBMS)를 통해 조회하고, 이를 프롬프트에 직접 주입(Context Injection)하거나 LLM Function Calling을 사용합니다.
- **채택 사유**: 정량적 수치 집계 및 정형 데이터 조회 시 100%의 정확도를 보장하며, 비구조화 Vector 검색(RAG) 대비 속도가 빠르고 비용이 적게 듭니다.

### 1.2 2단계 (고도화 단계) : Vector DB 기반 RAG 파이프라인 연동
- **도입 목적**:
  1. **헬스케어 전문 지식 검증 (Domain Knowledge RAG)**: 질환별 운동 가이드라인, 영양학 논문, 안전 주의사항 문서를 Vector DB(Pgvector / ChromaDB)에 저장하고, AI 답변 생성 시 관련 지식을 참조하도록 조치하여 할루시네이션(거짓 정보) 방지.
  2. **비구조화 대화 기반 장기기억 (Semantic Long-term Memory)**: 사용자의 과거 비구조화 대화 이력을 임베딩하여, "지난달 다리 다쳤을 때"와 같이 자연어로 과거 경험 및 맥락을 검색하여 맞춤 답변 제공.

---

## 2. 식단 이미지 분석(Food Vision) 토큰 및 비용 최적화 계획

### 2.1 1단계 (현재 / 초기 MVP) : 경량 Vision API & 파이프라인 최적화
- **이미지 리사이징 & 압축**: 앱/웹 프론트엔드에서 업로드 이미지를 512x512 이하 Low-Res 모드로 압축 전송하여 이미지당 토큰 소모량(Tile 개수) 최소화.
- **초경량 멀티모달 API 채택**: GPT-4o 등 고비용 모델 대신 **Gemini 2.0 Flash** 또는 **GPT-4o-mini** 수준의 초경량 비전 모델 활용 (장당 0.05원~0.1원 수준 비용 유지).
- **묶음(Batch) 프롬프트 호출**: 1끼당 최대 5장의 사진을 5번 나누어 호출하지 않고, 1회의 프롬프트 배열로 묶어 전송함으로써 기본 토큰 중복 소모 방지.
- **사용자 확정 UX (Human-in-the-loop)**: AI는 사진속 음식 후보 태그(`["제육볶음", "공기밥"]`)만 짧게 출력하여 Output 토큰 소모를 줄이고, 최종 확정 및 양 선택은 사용자가 직접 터치하여 기록.

### 2.2 2단계 (상용화 / 고도화) : 자체 서버 경량 음식 분류 AI 모델 도입
- **기술 스택**: Food-101 등 음식 전용 데이터셋으로 파인튜닝된 MobileNet, EfficientNet, ViT, YOLO 기반 경량 분류 모델 (ONNX / PyTorch).
- **효과**: 외부 LLM API 호출 없이 자체 백엔드 Microservice에서 이미지 식별을 수행하여 **외부 API 호출 비용 0원화** 달성 및 응답 속도 극대화.

---

## 3. 로드맵 및 적용 시점 Summary

| 구분 | 1단계 (현재 / 초기 MVP) | 2단계 (서비스 고도화 시점) |
| :--- | :--- | :--- |
| **기억/지식 처리** | RDBMS + Context Injection / Tool Calling | Vector DB (Pgvector) 기반 RAG 파이프라인 |
| **비전 이미지 처리** | Gemini Flash API + Low-Res 512px + Batch 묶음 호출 | 자체 서버 경량 음식 분류 AI (MobileNet/YOLO) |
| **주요 목표** | 빠른 기능 검증 및 개발 가성비 극대화 | 무제한 사용자 확장성 및 비용 0원화, 지식 신뢰성 확보 |
