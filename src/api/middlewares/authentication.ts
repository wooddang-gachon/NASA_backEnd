import type express from "express";

/**
 * 개발 & 프로토타이핑용 인증 패스 미들웨어 (JWT 인증 생략)
 */
export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  // 토큰 유무와 상관없이 무조건 기본 테스트 유저(userId: 1)로 인증 성공 통과
  const user = { userId: 1, nickname: "우당탕탕" };
  (request as any).currentUser = user;
  return Promise.resolve(user);
}
