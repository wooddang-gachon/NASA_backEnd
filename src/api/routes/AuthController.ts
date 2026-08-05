import { Controller, Route, Post, Delete, Body, Security, Request } from "tsoa";
import { Service, Container } from "typedi";
import AuthService from "../../services/authService";
import type {
  UserSignUpRequest,
  UserLoginRequest,
  UserLoginResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserWithdrawRequest,
  UserWithdrawResponse,
} from "../../interfaces";

@Service()
@Route("auth")
export class AuthController extends Controller {
  private authService = Container.get(AuthService);

  /**
   * [3.6] 회원가입 API
   */
  @Post("register")
  public async register(@Body() requestBody: UserSignUpRequest): Promise<UserLoginResponse> {
    this.setStatus(201);
    return await this.authService.signUp(requestBody);
  }

  /**
   * [3.6] 회원가입 API (호환용)
   */
  @Post("signup")
  public async signUp(@Body() requestBody: UserSignUpRequest): Promise<UserLoginResponse> {
    this.setStatus(201);
    return await this.authService.signUp(requestBody);
  }

  /**
   * [3.6] 로그인 API
   */
  @Post("login")
  public async login(@Body() requestBody: UserLoginRequest): Promise<UserLoginResponse> {
    return await this.authService.login(requestBody);
  }

  /**
   * [3.6] 토큰 자동 갱신 API
   */
  @Post("refresh")
  public async refresh(@Body() requestBody: TokenRefreshRequest): Promise<TokenRefreshResponse> {
    return await this.authService.refresh(requestBody);
  }

  /**
   * [3.6] 회원 탈퇴 API
   */
  @Post("withdraw")
  @Security("jwt")
  public async withdrawPost(
    @Request() request: any,
    @Body() requestBody?: UserWithdrawRequest
  ): Promise<UserWithdrawResponse> {
    const userId = request.currentUser?.userId || 1;
    return await this.authService.withdraw(userId, requestBody);
  }

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
