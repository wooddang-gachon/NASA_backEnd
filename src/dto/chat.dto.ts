import { Sender } from "../interfaces/enums";

export interface ChatMessageApiRequest {
  messageText: string;
}

export interface ChatEmotionResponse {
  primaryEmotion?: string;
  intensity?: number;
  state?: string;
  motionType: string;
}

export interface ChatMessageApiResponse {
  reply: string;
  motionTag: string;
  gainedFuel: number;
  currentFuel: number;
  emotion?: ChatEmotionResponse;
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