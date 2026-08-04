import { Service } from "typedi";
import { getPrisma } from "@/loaders/prisma";
import Logger from "@/loaders/logger";
import { UserNotFoundError } from "@/errors";

export interface UserActionLogRequest {
  userId: number;
  screenName: string;
  actionType: "CLICK" | "SCREEN_VIEW" | "SCROLL" | "TEXT_INPUT" | "BUTTON_TAP";
  targetElementId?: string;
  metadata?: any;
}

@Service()
export default class LogService {
  /**
   * 사용자 행동 분석 로그 수집 (user_action_logs 연동)
   */
  public async logUserAction(request: UserActionLogRequest): Promise<{ success: boolean }> {
    const prisma = getPrisma();

    const user = await prisma.users.findUnique({ where: { id: request.userId } });
    if (!user) throw new UserNotFoundError(request.userId);

    await prisma.user_action_logs.create({
      data: {
        user_id: request.userId,
        screen_name: request.screenName,
        action_type: request.actionType,
        target_element_id: request.targetElementId || undefined,
        metadata: request.metadata ? JSON.parse(JSON.stringify(request.metadata)) : undefined,
      },
    });

    Logger.info(`[LogService] Action logged: ${request.actionType} on ${request.screenName} for user ${request.userId}`);
    return { success: true };
  }
}
