import { Controller, Route, Get, Query } from "tsoa";
import { Service } from "typedi";
import UserService from "../../services/userService";

@Service()
@Route("users")
export class UserController extends Controller {
  constructor(private userService: UserService) {
    super();
  }

  /**
   * 내 프로필 및 타미 상태 정보를 조회합니다.
   */
  @Get("me")
  public async getMe(@Query() userId: number = 1) {
    return await this.userService.getUserProfile(userId);
  }
}
