import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { asyncLocalStorage } from "../../loaders/logger";

export function traceIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 클라이언트나 API 게이트웨이에서 넘겨준 ID가 있다면 사용, 없으면 새로 생성
  const traceId =
    (req.headers["x-request-id"] as string) ||
    (req.headers["x-correlation-id"] as string) ||
    randomUUID();

  res.setHeader("X-Request-Id", traceId);

  // 현재 요청 생명주기 동안 유지될 Map 컨텍스트 생성
  const store = new Map<string, string>();
  store.set("traceId", traceId);

  // asyncLocalStorage.run() 내부에서 실행되는 모든 비동기 작업은 동일한 store를 공유함
  asyncLocalStorage.run(store, () => {
    next();
  });
}
