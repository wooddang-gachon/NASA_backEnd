export abstract class BaseMapper<Entity = any, Dto = any> {
  /**
   * 단건 Entity ➔ DTO 변환 (자식 클래스에서 선택적 구현)
   */
  toDto?(entity: Entity): Dto;

  /**
   * 인스턴스 기준 Entity 배열 ➔ DTO 배열 변환
   */
  toDtoList(entities: Entity[]): Dto[] {
    if (!entities || !Array.isArray(entities)) return [];
    if (this.toDto) {
      return entities.map((entity) => this.toDto!(entity));
    }
    return [];
  }

  /**
   * 정적(Static) 리스트 안전 매핑 헬퍼 메서드
   */
  public static mapList<E, D>(entities: readonly E[] | null | undefined, mapperFn: (entity: E) => D): D[] {
    if (!entities || !Array.isArray(entities)) return [];
    return (entities as readonly E[]).map(mapperFn);
  }
}

