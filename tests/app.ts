import express from "express";
import loaders from "../src/loaders";

let app: express.Application;

export const getTestApp = async (): Promise<express.Application> => {
  if (app) return app;
  app = express();
  await loaders({ expressApp: app });
  return app;
};
