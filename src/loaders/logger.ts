import winston from "winston";
import config from "@/config";
import { AsyncLocalStorage } from "async_hooks";

export const asyncLocalStorage = new AsyncLocalStorage<string>();

const correlationIdFormat = winston.format((info) => {
  const correlationId = asyncLocalStorage.getStore();
  if (correlationId) {
    info.correlationId = correlationId;
  }
  return info;
});

const transports = [];

if (process.env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        correlationIdFormat(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.colorize(),
        correlationIdFormat(),
        winston.format.printf(
          (info) =>
            `[${info.timestamp}] [${info.level}]${info.correlationId ? ` [${info.correlationId}]` : ""}: ${info.message}`,
        ),
      ),
    }),
  );
}

const LoggerInstance = winston.createLogger({
  level: config.logs.level,
  levels: winston.config.npm.levels,
  transports,
});

export default LoggerInstance;
