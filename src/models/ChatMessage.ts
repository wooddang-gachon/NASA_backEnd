export interface ChatMessage {
  id: number;
  userId: number;
  sender: "USER" | "TAMMY";
  messageText: string;
  isEdited?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessageEdit {
  id: number;
  chatMessageId: number;
  previousText: string;
  editedAt?: Date;
}

export interface ChatMessageArchive {
  id: number;
  userId: number;
  sender: "USER" | "TAMMY";
  messageText: string;
  originalCreatedAt: Date;
  archivedAt?: Date;
}

export class ChatMessageModel {
  /**
   * 사용자의 최근 대화 내역 조회 (스텁)
   */
  public static async findRecentByUserId(userId: number, limit = 20): Promise<ChatMessage[]> {
    throw new Error("Method not implemented.");
  }
}
