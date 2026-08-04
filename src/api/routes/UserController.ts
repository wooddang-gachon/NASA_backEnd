import { Controller, Route, Get, Query } from "tsoa";
import { Service, Container } from "typedi";
import UserService from "../../services/userService";

@Service()
@Route("users")
export class UserController extends Controller {
  private userService = Container.get(UserService);

  constructor() {
    super();
  }

  /**
   * 내 프로필 및 타미 상태 정보를 조회합니다.
   */
  @Get("me")
  public async getMe(@Query() userId: number = 1) {
    console.log("userId", userId);
    return await this.userService.getUserProfile(userId);
  }

  /**
   * 타미 경험치/지수 변동 성장 일지 히스토리를 조회합니다.
   */
  @Get("tammy/history")
  public async getTammyHistory(@Query() userId: number = 1) {
    return await this.userService.getTammyHistory(userId);
  }
}
