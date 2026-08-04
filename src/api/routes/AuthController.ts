import { Controller, Route, Post, Get, Delete, Body, Security, Request } from "tsoa";
import { Service, Container } from "typedi";
import AuthService from "../../services/authService";
import type {
  UserSignUpRequest,
  UserLoginRequest,
  UserLoginResponse,
  UserLogoutRequest,
  UserLogoutResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserAuthMeResponse,
  UserWithdrawRequest,
  UserWithdrawResponse,
} from "../../interfaces";

@Service()
@Route("auth")
export class AuthController extends Controller {
  private authService = Container.get(AuthService);

  constructor() {
    super();
  }

  /**
   * 이메일 회원가입
   */
  @Post("signup")
  public async signUp(@Body() requestBody: UserSignUpRequest): Promise<UserLoginResponse> {
    this.setStatus(201);
    return await this.authService.signUp(requestBody);
  }

  /**
   * 로그인
   */
  @Post("login")
  public async login(@Body() requestBody: UserLoginRequest): Promise<UserLoginResponse> {
    return await this.authService.login(requestBody);
  }

  /**
   * 로그아웃
   */
  @Post("logout")
  @Security("jwt")
  public async logout(@Body() requestBody: UserLogoutRequest): Promise<UserLogoutResponse> {
    return await this.authService.logout(requestBody);
  }

  /**
   * Access Token 재발급
   */
  @Post("refresh")
  public async refresh(@Body() requestBody: TokenRefreshRequest): Promise<TokenRefreshResponse> {
    return await this.authService.refresh(requestBody);
  }

  /**
   * 내 계정 프로필 조회
   */
  @Get("me")
  @Security("jwt")
  public async getProfile(@Request() request: any): Promise<UserAuthMeResponse> {
    const userId = request.currentUser?.userId || 1;
    return await this.authService.getProfile(userId);
  }

  /**
   * 회원 탈퇴
   */
  @Delete("withdraw")
  @Security("jwt")
  public async withdraw(
    @Request() request: any,
    @Body() requestBody?: UserWithdrawRequest
  ): Promise<UserWithdrawResponse> {
    const userId = request.currentUser?.userId || 1;
    return await this.authService.withdraw(userId, requestBody);
  }
}
