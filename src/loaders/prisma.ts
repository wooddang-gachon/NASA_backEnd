import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import config from "../config";
import Logger from "./logger";

let prisma: PrismaClient;

export const initPrisma = (): PrismaClient => {
  try {
    // 1. .env 파일에 명시된 NODE_ENV 값 기반으로 DB 연결 스위칭
    const currentEnv = config.nodeEnv.toLowerCase();
    const isProduction = currentEnv === "production";
    const useMockDb = !isProduction;

    if (useMockDb) {
      Logger.info(
        `⚡  Running in [${config.nodeEnv}] mode. Using Mock Database URL (nasa_mock_db). ⚡`,
      );
    } else {
      Logger.info(
        `⚡  Running in [PRODUCTION] mode. Using Real Database URL (nasa_db). ⚡`,
      );
    }

    const urlString =
      useMockDb && config.mockDatabaseURL
        ? config.mockDatabaseURL
        : config.databaseURL;

    if (!urlString) {
      throw new Error(
        "Database connection URL is not configured in .env file.",
      );
    }

    const dbUrl = new URL(urlString);
    const host = dbUrl.hostname;
    const port = dbUrl.port ? parseInt(dbUrl.port) : 3306;
    const user = decodeURIComponent(dbUrl.username);
    const password = decodeURIComponent(dbUrl.password);
    const database = dbUrl.pathname.replace("/", "");

    // 2. Prisma 7 호환용 MariaDB 드라이버 어댑터 생성
    // (이 어댑터가 MySQL과 MariaDB 양쪽 연결을 모두 담당합니다)
    const adapter = new PrismaMariaDb({
      host,
      port,
      user,
      password,
      database,
      connectionLimit: config.nodeEnv === "test" ? 3 : 10,
      allowPublicKeyRetrieval: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 3. PrismaClient 초기화
    prisma = new PrismaClient({
      adapter,
      log: isProduction
        ? [{ emit: "stdout", level: "error" }]
        : [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ],
    });

    // 개발 환경일 때, 100ms 이상 걸리는 Slow Query만 출력하도록 변경하여 로그 도배 방지
    if (!isProduction) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).$on("query", (e: any) => {
        if (e.duration >= 100) {
          Logger.warn(
            `[Prisma Slow Query] ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`,
          );
        }
      });
    }

    Logger.info("✌️  Prisma Client initialized with MySQL Engine  ✌️");
    return prisma;
  } catch (error) {
    Logger.error("🔥  Failed to initialize Prisma Client  🔥", error);
    throw error;
  }
};

export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    return initPrisma();
  }
  return prisma;
};

export const clearPrisma = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined as unknown as PrismaClient;
  }
};

export { prisma };
