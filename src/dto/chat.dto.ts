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
