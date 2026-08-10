export abstract class BaseMapper<Entity, Dto> {
  /**
   * Entity(Database Model)를 DTO로 변환합니다.
   * 각 도메인 Mapper에서 반드시 구현해야 합니다.
   */
  abstract toDto(entity: Entity): Dto;

  /**
   * Entity 배열을 DTO 배열로 변환합니다.
   * 기본적으로 toDto를 배열 요소마다 매핑하여 반환합니다.
   */
  toDtoList(entities: Entity[]): Dto[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
