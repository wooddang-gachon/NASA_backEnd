import dotenv from "dotenv";

import path from "path";

const env = process.env.NODE_ENV || "development";
const envFile = `.env.${env}`;
const envFound = dotenv.config({ path: path.join(process.cwd(), envFile) });

if (envFound.error) {
  // 환경별 파일이 없으면 기본 .env 로드 시도
  const defaultEnvFound = dotenv.config();
  if (defaultEnvFound.error) {
    console.warn(`⚠️  Couldn't find ${envFile} or .env file  ⚠️`);
  }
}

export default {
  nodeEnv: process.env.NODE_ENV || "development",

  port: parseInt(process.env.PORT as string, 10) || 3000,

  databaseURL: process.env.DATABASE_URL || "",

  mockDatabaseURL: process.env.MOCK_DATABASE_URL || "",

  api: {
    prefix: "/api/v1",
  },
  logs: {
    level: process.env.LOG_LEVEL || "silly",
  },
  ai: {
    serverUrl: process.env.AI_SERVER_URL || "http://localhost:8000",
    // AI 서버와 공유하는 내부 API 키. X-Internal-Api-Key 헤더로 나갑니다.
    // AI 서버는 Gemini를 자체 키로 호출하므로 모델 제공자 키와는 무관합니다.
    apiKey: process.env.AI_INTERNAL_API_KEY || "",
  },
  get jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        "⚠️  JWT_SECRET 환경 변수가 설정되지 않았습니다. 보안을 위해 서버 실행을 중단합니다.  ⚠️",
      );
    }
    return secret;
  },
  swagger: {
    user: process.env.SWAGGER_USER || "admin",
    password: process.env.SWAGGER_PASSWORD || "",
  },
};
