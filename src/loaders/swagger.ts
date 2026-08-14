import type { IRouter } from "express";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import Logger from "@/loaders/logger";

export default ({ app }: { app: IRouter }) => {
  try {
    let swaggerPath = path.join(process.cwd(), "docs/swagger.json");

    if (!fs.existsSync(swaggerPath)) {
      swaggerPath = path.join(process.cwd(), "src/build/swagger.json");
    }

    if (!fs.existsSync(swaggerPath)) {
      swaggerPath = path.join(process.cwd(), "build/swagger.json");
    }

    const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (err) {
    Logger.error("Failed to load swagger.json for API docs:", err);
  }
};
