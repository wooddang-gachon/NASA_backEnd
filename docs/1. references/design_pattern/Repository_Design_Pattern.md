# Repository Design Pattern

## 목적
비즈니스 로직을 담당하는 **Service 계층**과 데이터베이스 접근을 담당하는 **Repository 계층**을 명확히 분리하여, 코드의 재사용성과 테스트 용이성을 높이고 Prisma(ORM) 의존성을 낮춥니다.

## 기본 원칙
1. **Service 계층의 독립성**
   - Service 클래스 내부에서는 `getPrisma()`나 `prisma` 인스턴스를 직접 호출하지 않습니다.
   - 데이터베이스 접근이 필요한 모든 작업은 주입된 Repository를 통해 수행합니다.

2. **Repository 계층의 역할**
   - Repository는 `find`, `create`, `update`, `delete`와 같은 데이터 조작 및 조회 메서드만 제공합니다.
   - 복잡한 비즈니스 로직이나 에러 처리(예: `throw new UserNotFoundError()`)는 Service에서 수행하며, Repository는 단순히 쿼리 결과(데이터 혹은 `null`)를 반환합니다.

3. **의존성 주입 (Dependency Injection)**
   - `typedi`의 `@Inject` 데코레이터를 사용하여 Service에 Repository를 주입합니다.

## 구현 패턴

### 1. Repository 구현
```typescript
import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma } from "@prisma/client";

@Service()
export default class UserRepository {
  public async findUserById(userId: number) {
    const prisma = getPrisma();
    return prisma.users.findUnique({
      where: { id: userId },
    });
  }

  public async createUser(data: Prisma.usersCreateInput) {
    const prisma = getPrisma();
    return prisma.users.create({ data });
  }
}
```

### 2. Service 구현
```typescript
import { Service, Inject } from "typedi";
import UserRepository from "@/repositories/UserRepository";
import { UserNotFoundError } from "@/errors";

@Service()
export default class UserService {
  // Repository 의존성 주입
  @Inject((type) => UserRepository)
  private userRepository!: UserRepository;

  public async getUserProfile(userId: number) {
    // 1. Repository를 통해 데이터 조회
    const user = await this.userRepository.findUserById(userId);

    // 2. 비즈니스 로직 및 에러 처리
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return user;
  }
}
```

## 장점
- **관심사 분리**: 비즈니스 로직과 데이터 접근 로직이 분리되어 유지보수가 용이해집니다.
- **테스트 용이성**: Service를 테스트할 때 Prisma DB를 직접 연결할 필요 없이, Repository 모킹(Mocking) 객체를 주입하여 단위 테스트(Unit Test)를 쉽게 작성할 수 있습니다.
- **ORM 교체 유연성**: 추후 Prisma에서 TypeORM 등 다른 ORM으로 교체하더라도, 비즈니스 로직이 담긴 Service 클래스는 수정할 필요가 없으며 Repository 로직만 변경하면 됩니다.
