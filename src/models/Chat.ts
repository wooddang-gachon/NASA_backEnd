import { Sender } from "../interfaces/enums";

export interface ChatMessage {
  id: number;
  userId: number;
  sender: Sender | "USER" | "TAMMY";
  messageText: string;
  isEdited?: boolean;
  isDeleted?: boolean;
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
  sender: Sender | "USER" | "TAMMY";
  messageText: string;
  originalCreatedAt: Date;
  archivedAt?: Date;
}

export interface MemoryPill {
  id: number;
  userId: number;
  category: string;
  memoryContent: string;
  createdAt?: Date;
}
