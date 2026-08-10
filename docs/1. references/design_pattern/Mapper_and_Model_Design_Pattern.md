# TAMMY v3 백엔드 Mapper & Model 계층 설계 패턴 및 타입 안전성 가이드

본 문서는 NASA_backEnd 프로젝트에서 **Mapper(매퍼) 계층** 및 **Model(모델) 계층**을 구현하고 유지보수할 때 준수해야 하는 디자인 패턴, 타입 안전성(Type Safety) 컨벤션, DTO/Param 객체 전달 패턴을 정의합니다.

---

## 1. 아키텍처 원칙 및 설계 목적 (Architectural Principles)

1. **관심사의 분리 (Separation of Concerns)**
   - **Model (`src/models/`)**: 도메인 엔티티, DB 매핑용 타입(`DbMemoryItem`, `DbFoodMappingItem` 등), 매퍼/서비스용 Param 파라미터 객체 타입을 중앙 집중적으로 관리합니다.
   - **Mapper (`src/mappers/`)**: DTO ↔ Entity ↔ DB CreateInput 간 변환(Mapping) 로직만을 담당하며, 매퍼 파일 내부에 타입 선언을 품지 않고 `src/models`를 참조합니다.
   - **DTO (`src/dto/`, `src/interfaces/`)**: API 요청/응답 스키마(`camelCase`)를 표현하며 클라이언트 통신 인터페이스를 격리합니다.

2. **`any` 타입 엄격 금지 (No `any` Policy)**
   - TypeScript의 컴파일 타임 오류 감지, IDE 자동완성(DX), DB 스키마 마이그레이션 안전성을 위해 매퍼 및 모델 레이어에서 `any` 사용을 금지하고 명시적 인터페이스를 사용합니다.

3. **Multi-Parameter 객체 포장 패턴 (Parameter Object Pattern)**
   - 메서드 인자가 3개 이상 늘어날 경우, 위치 기반 개별 인자(`(a, b, c, d)`) 나열 대신 인터페이스로 포장된 **Param 객체**(`params: CreateLongTermMemoryParams`)로 전달받아 인자 전달 순서 실수 및 오타를 컴파일 타임에 방지합니다.
   - 하위 호환성을 보장하기 위해 유연한 오버로딩(`paramsOrUserId: Params | number`) 방식을 지원합니다.

---

## 2. 계층별 상세 패턴 및 작성 규격

### 2.1 Model 계층 (`src/models/*.ts`) 작성 규격
- **DB 엔티티 매핑 타입 (`Db[Entity]Item`)**: DB 컬럼 스키마(`snake_case`) 및 Prisma 타입(`BigInt`, `Decimal`, `Date`)과 일치하는 명시적 인터페이스 정의
  - 예: `DbMemoryItem`, `DbFoodMappingItem`, `DbFoodItem`, `DbQuickLogItem`, `DbTravelResultDetailItem`, `DbTammyStatusLogItem`
- **매퍼 인풋 Param 타입 (`Create[Entity]Params`)**: 인자가 3개 이상인 매퍼 생성 함수를 위한 인풋 전용 인터페이스 정의
  - 예: `CreateUserMessageParams`, `CreateTammyMessageParams`, `CreateLongTermMemoryParams`, `CreateMealInputParams`, `CreateMealItemInputParams`, `CreateTammyStatusLogParams`

***
// 예시: src/models/Chat.ts
export interface DbMemoryItem {
  id: number | bigint | string;
  category: string;
  memory_content: string;
  updated_at?: Date | string | null;
}

export interface CreateLongTermMemoryParams {
  userId: number;
  category: string;
  content: string;
  chatMessageId: bigint;
}
***

---

### 2.2 Mapper 계층 (`src/mappers/*.ts`) 작성 규격

1. **`src/models` 타입 명시적 import**
   - 매퍼 파일 내부에서 자체 인터페이스를 선언하지 않고 `src/models`에서 중앙 집중된 인터페이스를 import하여 사용합니다.

2. **Param 객체 지원 & 하위 호환 오버로딩 패턴**
   - `typeof paramsOrUserId === "object"` 조건 분기를 사용해 객체 전달 방식과 위치 기반 개별 인자 방식을 모두 지원합니다.

***
// 예시: src/mappers/chatMapper.ts
import { DbMemoryItem, CreateLongTermMemoryParams } from "../models";
import { MemoryPillDto } from "../dto";

export class ChatMapper {
  /**
   * 장기 기억 DB 생성 인풋 객체 생성 (Param 객체 및 위치 기반 인자 지원)
   */
  public static toLongTermMemoryInput(
    paramsOrUserId: CreateLongTermMemoryParams | number,
    category?: string,
    content?: string,
    chatMessageId?: bigint
  ) {
    if (typeof paramsOrUserId === "object") {
      return {
        user_id: paramsOrUserId.userId,
        category: paramsOrUserId.category,
        memory_content: paramsOrUserId.content,
        chat_message_id: paramsOrUserId.chatMessageId,
      };
    }
    return {
      user_id: paramsOrUserId,
      category: category!,
      memory_content: content!,
      chat_message_id: chatMessageId!,
    };
  }

  /**
   * DB 엔티티 ➔ DTO 변환 (안전한 타입 변환)
   */
  public static toMemoryPillDtoList(dbMemories: DbMemoryItem[]): MemoryPillDto[] {
    return dbMemories.map((m) => ({
      id: Number(m.id),
      category: m.category,
      memoryContent: m.memory_content,
      createdAt: m.updated_at ? new Date(m.updated_at).toISOString() : new Date().toISOString(),
    }));
  }
}
***

---

## 3. 매퍼 / 모델 개발 체크리스트

1. [ ] 매퍼 파일 내부에 `any` 타입이 포함되어 있지 않은가?
2. [ ] DB 엔티티 조회 결과를 매핑할 때 `src/models`에 정의된 명시적 `Db[Entity]Item` 인터페이스를 사용하였는가?
3. [ ] 파라미터가 3개 이상인 매퍼 함수에 `Create[Entity]Params` 객체 타입이 적용되어 있는가?
4. [ ] `npx tsc --noEmit` 및 `npm run build` 실행 시 타입 컴파일 에러가 발생하지 않는가?
