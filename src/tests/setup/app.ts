import express from "express";
import loaders from "../../loaders";
import { getPrisma } from "../../loaders/prisma";

let app: express.Application;

export const getTestApp = async (): Promise<express.Application> => {
  if (app) return app;
  app = express();
  await loaders({ expressApp: app });

  // 테스트 실행용 1번 유저 & 기본 타미 상태 사전 준비 (Seed)
  const prisma = getPrisma();

  await prisma.users.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      email: "testuser@example.com",
      nickname: "우당탕탕",
      gender: "FEMALE",
      age: 26,
      current_fuel: 100,
    },
  });

  await prisma.tammy_statuses.upsert({
    where: { user_id: 1 },
    update: {},
    create: {
      user_id: 1,
      level: 1,
      current_exp: 0,
    },
  });

  return app;
};

export const closeTestApp = async (): Promise<void> => {
  const { clearPrisma } = await import("../../loaders/prisma");
  await clearPrisma();
  app = undefined as unknown as express.Application;
};

afterAll(async () => {
  await closeTestApp();
});
