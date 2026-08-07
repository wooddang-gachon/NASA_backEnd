import { Controller, Route, Get, Query, Tags, Security, Request } from "tsoa";
import { Service, Container } from "typedi";
import UserService from "../../services/userService";
import { getAuthenticatedUserId, type AuthenticatedRequest } from "../../interfaces/express";
import { UserProfileResponseData, TammyHistoryResponse } from "../../dto";
import { ApiResponse } from "../../dto";

@Service()
@Tags("2. User - 내 정보 및 프로필 관리")
@Route("users")
export class UserController extends Controller {
  private userService = Container.get(UserService);

  constructor() {
    super();
  }

  /**
   * 로그인한 현재 사용자의 닉네임, 보유 연료량, 타미 펫 상태(레벨/경험치)를 조회합니다.
   * @summary 내 프로필 및 타미 상태 조회
   */
  @Get("me")
  @Security("jwt")
  public async getMe(@Request() request: AuthenticatedRequest): Promise<ApiResponse<UserProfileResponseData>> {
    const userId = getAuthenticatedUserId(request);
    const result = await this.userService.getUserProfile(userId);
    return ApiResponse.success(result, "내 프로필 및 타미 상태 조회가 완료되었습니다.");
  }

  /**
   * 타미 펫 캐릭터의 경험치 및 지수 변동 성장 기록 히스토리를 조회합니다.
   * @summary 타미 성장 일지 히스토리 조회
   */
  @Get("tammy/history")
  @Security("jwt")
  public async getTammyHistory(@Request() request: AuthenticatedRequest): Promise<ApiResponse<TammyHistoryResponse>> {
    const userId = getAuthenticatedUserId(request);
    const result = await this.userService.getTammyHistory(userId);
    return ApiResponse.success(result, "타미 성장 히스토리 조회가 완료되었습니다.");
  }
}

