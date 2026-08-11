import dotenv from "dotenv";

const envFound = dotenv.config();

if (envFound.error) {
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  nodeEnv: process.env.NODE_ENV || "development",

  port: parseInt(process.env.PORT as string, 10) || 3000,

  databaseURL: process.env.DATABASE_URL || "",

  mockDatabaseURL: process.env.MOCK_DATABASE_URL || "",

  api: {
    prefix: "/api",
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
  jwtSecret: process.env.JWT_SECRET || "",
  swagger: {
    user: process.env.SWAGGER_USER || "admin",
    password: process.env.SWAGGER_PASSWORD || "",
  },
};
