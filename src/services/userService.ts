import { Service } from "typedi";
import Logger from "../loaders/logger";
import { UserNotFoundError } from "../errors";
import { UserProfileResponseData, TammyHistoryResponse } from "../dto";
import UserRepository from "../repositories/UserRepository";
import { Inject } from "typedi";
import { UserMapper } from "../mappers";

@Service()
export default class UserService {
  @Inject((_type) => UserRepository)
  private userRepository!: UserRepository;

  public async getUserProfile(
    userId: number,
  ): Promise<UserProfileResponseData> {
    Logger.info(`[UserService] 프로필 조회: userId=${userId}`);

    const user = await this.userRepository.findUserWithTammyStatus(userId);

    if (!user) {
      Logger.warn(`[UserService] 유저 미존재: userId=${userId}`);
      throw new UserNotFoundError(userId);
    }

    return UserMapper.toProfileResponse(user);
  }

  public async getTammyHistory(userId: number): Promise<TammyHistoryResponse> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const logs = await this.userRepository.findTammyStatusLogs(userId, 20);

    return UserMapper.toTammyHistoryResponse(logs);
  }
}
