export abstract class BaseMapper<Entity = unknown, Dto = unknown> {
  /**
   * 단건 Entity ➔ DTO 변환 (자식 클래스에서 선택적 구현)
   */
  toDto?(entity: Entity): Dto;

  /**
   * 정적(Static) 리스트 안전 매핑 헬퍼 메서드
   * @param entities
   * @param mapperFn
   */
  public static mapList<E, D>(
    entities: readonly E[] | null | undefined,
    mapperFn: (entity: E) => D,
  ): D[] {
    if (!entities || !Array.isArray(entities)) return [];
    return (entities as readonly E[]).map(mapperFn);
  }
}
