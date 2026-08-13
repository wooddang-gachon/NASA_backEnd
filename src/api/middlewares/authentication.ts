import type express from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { UnauthorizedError } from '../../errors';

/**
 * JWT authentication middleware for TSOA controllers
 */
export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[],
): Promise<any> {
  if (securityName === 'jwt') {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // 개발 및 테스트용 Mock 토큰 예외 지원 (프로덕션 환경에서는 차단)
      if (
        (process.env.NODE_ENV !== 'production' && token.startsWith('mock_')) ||
        process.env.NODE_ENV === 'test'
      ) {
        const mockUser = { userId: 1, email: 'mock_user@example.com', nickname: '우주탐험가' };
        (request as any).currentUser = mockUser;
        return Promise.resolve(mockUser);
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as { userId: number; email?: string };
        const user = { userId: decoded.userId, email: decoded.email };
        (request as any).currentUser = user;
        return Promise.resolve(user);
      } catch (err) {
        return Promise.reject(new UnauthorizedError('만료되었거나 유효하지 않은 인증 토큰입니다.'));
      }
    }

    // 개발 및 테스트 보조 식별자 처리 (쿼리 파라미터 userId) - 프로덕션 환경에서는 차단
    const userIdQuery = request.query.userId;
    if (userIdQuery && process.env.NODE_ENV !== 'production') {
      const user = { userId: Number(userIdQuery), nickname: '우주탐험가' };
      (request as any).currentUser = user;
      return Promise.resolve(user);
    }

    if (process.env.NODE_ENV === 'test') {
      const mockUser = { userId: 1, email: 'mock_user@example.com', nickname: '우주탐험가' };
      (request as any).currentUser = mockUser;
      return Promise.resolve(mockUser);
    }
  }

  return Promise.reject(new UnauthorizedError('인증 헤더(Bearer Token)가 누락되었습니다.'));
}
