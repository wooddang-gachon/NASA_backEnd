import type express from "express";

/**
 * JWT authentication middleware for TSOA controllers
 */
export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === "jwt") {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // TODO: jwt.verify(token, secret) 적용
      const user = { userId: 1, email: "user@example.com", nickname: "우주탐험가" };
      (request as any).currentUser = user;
      return Promise.resolve(user);
    }

    // 개발 및 테스트 보조 식별자 처리 (쿼리 파라미터 userId)
    const userIdQuery = request.query.userId;
    if (userIdQuery) {
      const user = { userId: Number(userIdQuery), nickname: "우주탐험가" };
      (request as any).currentUser = user;
      return Promise.resolve(user);
    }
  }

  // 기본 테스트 유저 통과 처리
  const defaultUser = { userId: 1, nickname: "우주탐험가" };
  (request as any).currentUser = defaultUser;
  return Promise.resolve(defaultUser);
}
