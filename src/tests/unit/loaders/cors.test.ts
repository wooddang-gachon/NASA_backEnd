import express from "express";
import request from "supertest";
import cors from "cors";
import config from "../../../config";

describe("CORS Configuration Loader Tests", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    const whitelist = config.cors.origins;
    const corsOptions = {
      origin: function (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("CORS policy violation: Not allowed by CORS"));
        }
      },
      credentials: true,
    };

    app.use(cors(corsOptions));
    app.get("/test", (req, res) => {
      res.status(200).json({ success: true });
    });

    // Error handling middleware for CORS violation error
    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        if (err.message.includes("CORS policy violation")) {
          res.status(403).json({ error: err.message });
          return;
        }
        next(err);
      },
    );
  });

  it("Origin 헤더가 없는 서버 간/Postman 요청은 허용되어야 한다", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("화이트리스트에 등록된 Origin(예: http://localhost:3000) 요청은 CORS 헤더와 함께 허용되어야 한다", async () => {
    const res = await request(app)
      .get("/test")
      .set("Origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
  });

  it("화이트리스트에 등록되지 않은 Origin 요청은 거부되어야 한다", async () => {
    const res = await request(app)
      .get("/test")
      .set("Origin", "http://unauthorized-domain.com");

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("CORS policy violation");
  });
});
