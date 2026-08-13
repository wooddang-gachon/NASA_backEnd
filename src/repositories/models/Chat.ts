import { Sender } from "../../interfaces/enums";

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

export interface DbMemoryItem {
  id: number | bigint | string;
  category: string;
  memory_content: string;
  updated_at?: Date | string | null;
}

export interface CreateUserMessageParams {
  userId: number;
  userMessage: string;
}

export interface CreateTammyMessageParams {
  userId: number;
  replyText: string;
  motionTag?: string;
  intentLabel?: string;
  labels?: unknown;
}

export interface CreateLongTermMemoryParams {
  userId: number;
  category: string;
  content: string;
  chatMessageId: bigint;
}
