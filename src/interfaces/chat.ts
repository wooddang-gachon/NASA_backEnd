import { Sender } from "./enums";

export interface EmotionStatus {
  state: string;
  motionType: string;
}

export interface ExtractedMemory {
  category: string;
  content: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatMessageDto {
  id: string;
  userId: number;
  sender: Sender;
  messageText: string;
  motionTag?: string | null;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
}

export interface ChatResponse {
  reply: string;
  emotion: EmotionStatus;
  gainedFuel: number;
  currentFuel: number;
  motionTag?: string;
}

export interface ChatTurn {
  role: "user" | "tammy";
  text: string;
  createdAt?: string;
}

export interface MemoryPillDto {
  id: number;
  category: string;
  memoryContent: string;
  createdAt: string;
}
