import "reflect-metadata";
import express from "express";
import Logger from "@/loaders/logger";
import config from "@/config";
import loaders from "@/loaders";

/**
 *
 */
async function startServer() {
  const app = express();

  await loaders({ expressApp: app });

  const server = app
    .listen(config.port, () => {
      Logger.info(`
      ################################################
      🛡️  Server listening on port: ${config.port} 🛡️
      ################################################
    `);
    })
    .on("error", (err) => {
      Logger.error(err);
      process.exit(1);
    });

  const gracefulShutdown = () => {
    Logger.info("SIGTERM/SIGINT signal received: closing HTTP server");
    server.close(() => {
      Logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}

startServer();
