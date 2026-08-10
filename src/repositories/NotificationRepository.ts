import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";

@Service()
export default class NotificationRepository {
  public async upsertPushToken(
    userId: number,
    deviceToken: string,
    deviceType: any
  ) {
    return getPrisma().user_push_tokens.upsert({
      where: {
        user_id_device_token: {
          user_id: userId,
          device_token: deviceToken,
        },
      },
      update: {
        device_type: deviceType,
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        device_token: deviceToken,
        device_type: deviceType,
        is_active: true,
      },
    });
  }

  public async findActivePushTokens(userId: number) {
    return getPrisma().user_push_tokens.findMany({
      where: {
        user_id: userId,
        is_active: true,
      },
    });
  }
}
