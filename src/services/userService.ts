import { Service } from "typedi";
import Logger from "../loaders/logger";

@Service()
export default class UserService {
  /**
   * 유저 프로필 및 타미 캐릭터 상태 정보를 조회합니다. (스텁)
   */
  public async getUserProfile(userId: number): Promise<any> {
    Logger.info(`[UserService] 프로필 조회: userId=${userId}`);

    // TODO: DB 사용자 프로필 및 타미 가상 펫 상태(1:1) 조회

    throw new Error("Method not implemented.");
  }
}
