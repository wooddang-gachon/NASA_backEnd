import express from "express";
import expressLoader from "./express";
import Logger from "./logger";
import { initPrisma } from "./prisma";
import jobsLoader from "../jobs";

// import "./events";
export default async ({ expressApp }: { expressApp: express.Application }) => {
    // 0. Database ORM 초기화
    initPrisma();
    Logger.info('✌️ Prisma Client loaded');

    // 1. Express 기본 세팅, 라우터, Swagger 및 에러 핸들러 연동
    await expressLoader({ app: expressApp });
    Logger.info('✌️ Express base, routes and swagger configured');

    // 3. 백그라운드 스케줄러(Jobs) 가동
    await jobsLoader();
    Logger.info('✌️ Background jobs loaded');
};
