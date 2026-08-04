export interface MemoryPill {
  id: number;
  userId: number;
  chatMessageId?: number;
  category: string;
  memoryContent: string;
  createdAt?: Date;
}

export class MemoryPillModel {
  /**
   * 사용자의 AI 장기 기억 캡슐 목록 조회 (스텁)
   */
  public static async findByUserId(userId: number): Promise<MemoryPill[]> {
    throw new Error("Method not implemented.");
  }
}
