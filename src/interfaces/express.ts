import type { Request as ExRequest } from "express";
import { UnauthorizedError } from "../errors";

export interface UserPayload {
  userId: number;
  email?: string;
  nickname?: string;
}

export interface AuthenticatedRequest extends ExRequest {
  currentUser?: UserPayload;
}

/**
 *
 * @param request
 */
export function getAuthenticatedUserId(request: AuthenticatedRequest): number {
  const userId = request.currentUser?.userId;
  if (!userId) {
    throw new UnauthorizedError("인증된 사용자 정보를 찾을 수 없습니다.");
  }
  return userId;
}
