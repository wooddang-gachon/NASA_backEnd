/* eslint-disable camelcase */
import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import { Prisma, user_push_tokens } from "@prisma/client";
import { BaseRepository } from "./BaseRepository";

@Service()
export default class NotificationRepository extends BaseRepository<
  user_push_tokens,
  Prisma.user_push_tokensCreateInput,
  Prisma.user_push_tokensUpdateInput
> {
  constructor() {
    super(getPrisma().user_push_tokens);
  }

  public async upsertPushToken(
    userId: number,
    deviceToken: string,
    deviceType: string,
  ) {
    return getPrisma().user_push_tokens.upsert({
      where: {
        user_id_device_token: {
          user_id: userId,
          device_token: deviceToken,
        },
      },
      update: {
        device_type: deviceType as import("@prisma/client").$Enums.DeviceType,
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        device_token: deviceToken,
        device_type: deviceType as import("@prisma/client").$Enums.DeviceType,
        is_active: true,
      },
    });
  }

  public async findActivePushTokens(userId: number) {
    return this.findMany({
      user_id: userId,
      is_active: true,
    });
  }
}
