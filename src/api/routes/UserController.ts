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

  @Get("me")
  public async getMe(@Request() request: express.Request) {
    const userId = (request as any).currentUser.userId;
    return await this.userService.getUserProfile(userId);
  }
}
