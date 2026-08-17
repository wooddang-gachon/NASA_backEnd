import winston from "winston";
import config from "@/config";
import { AsyncLocalStorage } from "async_hooks";

export const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

const injectTraceId = winston.format((info) => {
  const store = asyncLocalStorage.getStore();
  if (store && store.has("traceId")) {
    info.traceId = store.get("traceId");
  }
  return info;
});

// 민감 정보 마스킹 포맷
const sanitizeData = winston.format((info) => {
  const sensitiveKeys = ["password", "token", "buffer", "secret"];

  const mask = (obj: Record<string, unknown> | null | undefined) => {
    if (!obj || typeof obj !== "object") return;
    for (const key in obj) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        obj[key] = "***MASKED***";
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        mask(obj[key] as Record<string, unknown>);
      }
    }
  };

  mask(info);
  return info;
});

const transports = [];

if (process.env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        injectTraceId(),
        sanitizeData(),
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
        injectTraceId(),
        sanitizeData(),
        winston.format.printf((info) => {
          const { timestamp, level, traceId, message, prefix, ...meta } = info;
          const prefixStr = prefix ? `[${prefix}]` : "";
          const corrStr = traceId ? ` [${traceId}]` : "";
          const metaString =
            Object.keys(meta).length > 0
              ? `\n${JSON.stringify(meta, null, 2)}`
              : "";
          return `[${timestamp}] [${level}]${corrStr} ${prefixStr}: ${message}${metaString}`;
        }),
      ),
    }),
  );
}

const coreLogger = winston.createLogger({
  level: config.logs.level,
  levels: winston.config.npm.levels,
  transports,
});

export class LoggerFactory {
  static getLogger(context: string) {
    return coreLogger.child({ prefix: context });
  }
}

export default coreLogger;
