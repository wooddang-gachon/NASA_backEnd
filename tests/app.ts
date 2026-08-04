import express from "express";
import loaders from "../src/loaders";
import { getPrisma } from "../src/loaders/prisma";
import { ensureDefaultPlanet } from "../src/services/travelService";

let app: express.Application;

export const getTestApp = async (): Promise<express.Application> => {
  if (app) return app;
  app = express();
  await loaders({ expressApp: app });

  // 테스트 실행용 1번 유저 & 기본 행성/타미 상태/우주선 상태 사전 준비 (Seed)
  const prisma = getPrisma();
  const planetId = await ensureDefaultPlanet(prisma);

  await prisma.users.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      email: "testuser@example.com",
      nickname: "우당탕탕",
      gender: "FEMALE",
      age: 26,
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

  await prisma.space_travel_states.upsert({
    where: { user_id: 1 },
    update: {},
    create: {
      user_id: 1,
      current_fuel: 100,
      current_planet_id: planetId,
    },
  });

  return app;
};
