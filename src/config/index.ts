import dotenv from "dotenv";



const envFound = dotenv.config();

if (envFound.error) {
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}


export default {
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
    apiKey: process.env.NVIDIA_GLM_5_2_API_KEY || "",
  },
};
