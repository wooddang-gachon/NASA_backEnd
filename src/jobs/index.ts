import cron from "node-cron";
import Logger from "../loaders/logger";
import { runProactiveTriggerJob } from "./proactiveTriggerJob";
import { runMonthlyReportJob } from "./monthlyReportJob";

export default async (): Promise<void> => {
  Logger.info("✌️  Scheduler Jobs loading from src/jobs...");

  // 작업 1: 매일 밤 11시 30분에 실행
  cron.schedule("30 23 * * *", async () => {
    await runProactiveTriggerJob();
  });

  // 작업 2: 매월 1일 새벽 1시에 실행
  cron.schedule("0 1 1 * *", async () => {
    await runMonthlyReportJob();
  });

  Logger.info("✌️  Scheduler Jobs successfully registered");
};
