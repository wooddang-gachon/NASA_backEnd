import { Controller, Route, Get, Request, Security } from "tsoa";
import type express from "express";
import { Service } from "typedi";
import UserService from "../../services/userService";

@Service()
@Route("users")
@Security("jwt")
export class UserController extends Controller {
  constructor(private userService: UserService) {
    super();
  }

  /**
   * 내 프로필 및 타미 상태 정보를 조회합니다.
   */
  @Get("me")
  public async getMe(@Request() request: express.Request) {
    const userId = (request as any).currentUser?.userId || 1;
    return await this.userService.getUserProfile(userId);
  }
}
