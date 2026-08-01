import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import config from "../config";
import Logger from "./logger";

let prisma: PrismaClient;

export const initPrisma = (): PrismaClient => {
  try {
    // 1. 테스트 실행 모드(NODE_ENV=TEST) 여부에 따라 DB 연결 주소 동적 스위칭
    const isTest = process.env.NODE_ENV === "TEST";

    if (isTest) {
      Logger.info("⚡  Running in TEST mode. Using mock database URL. ⚡");
    } else {
      Logger.info(
        "⚡  Running in NORMAL mode. Using production database URL. ⚡",
      );
    }
    const urlString =
      isTest && config.mockDatabaseURL
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
    const adapter = new PrismaMariaDb({
      host,
      port,
      user,
      password,
      database,
      connectionLimit: 10,
    });

    // 3. 어댑터를 주입하여 PrismaClient 초기화 (WASM 기반 컴파일러 연동)
    prisma = new PrismaClient({
      adapter,
      log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "info" },
        { emit: "stdout", level: "warn" },
        { emit: "stdout", level: "error" },
      ],
    });

    // winston 로거에 쿼리 실시간 바인딩
    (prisma as any).$on("query", (e: any) => {
      Logger.info(
        `[Prisma Query] ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`,
      );
    });

    Logger.info("✌️  Prisma Client (v7) initialized with MariaDB Adapter  ✌️");
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
export { prisma };
