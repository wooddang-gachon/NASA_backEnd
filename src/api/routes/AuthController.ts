import { Controller, Route, Post, Delete, Body, Security, Request, Tags } from "tsoa";
import { Service, Container } from "typedi";
import AuthService from "../../services/authService";
import { getAuthenticatedUserId, type AuthenticatedRequest } from "../../interfaces/express";
import { ApiResponse } from "../../dto";
import type {
  UserSignUpRequest,
  UserLoginRequest,
  UserLoginResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserWithdrawRequest,
  UserWithdrawResponse,
  SocialLoginRequest,
} from "../../dto";

@Service()
@Tags("1. Auth - 회원 인증 및 소셜 로그인")
@Route("auth")
export class AuthController extends Controller {
  private authService = Container.get(AuthService);

  /**
   * 이메일과 비밀번호 기반으로 신규 회원을 등록합니다.
   * @summary 일반 회원가입
   */
  @Post("register")
  public async register(@Body() requestBody: UserSignUpRequest): Promise<ApiResponse<UserLoginResponse>> {
    this.setStatus(201);
    const result = await this.authService.signUp(requestBody);
    return ApiResponse.success(result, "회원가입이 성공적으로 완료되었습니다.", 201);
  }

  /**
   * [3.6] 회원가입 API (호환용)
   */
  @Post("signup")
  public async signUp(@Body() requestBody: UserSignUpRequest): Promise<ApiResponse<UserLoginResponse>> {
    this.setStatus(201);
    const result = await this.authService.signUp(requestBody);
    return ApiResponse.success(result, "회원가입이 성공적으로 완료되었습니다.", 201);
  }

  /**
   * [3.6] 로그인 API
   */
  @Post("login")
  public async login(@Body() requestBody: UserLoginRequest): Promise<ApiResponse<UserLoginResponse>> {
    const result = await this.authService.login(requestBody);
    return ApiResponse.success(result, "로그인이 성공적으로 완료되었습니다.");
  }

  /**
   * [3.6] 구글 / 카카오 / 애플 소셜 로그인 API
   */
  @Post("social-login")
  public async socialLogin(@Body() requestBody: SocialLoginRequest): Promise<ApiResponse<UserLoginResponse>> {
    const result = await this.authService.socialLogin(requestBody);
    return ApiResponse.success(result, "소셜 로그인이 성공적으로 완료되었습니다.");
  }

  /**
   * [3.6] 토큰 자동 갱신 API
   */
  @Post("refresh")
  public async refresh(@Body() requestBody: TokenRefreshRequest): Promise<ApiResponse<TokenRefreshResponse>> {
    const result = await this.authService.refresh(requestBody);
    return ApiResponse.success(result, "토큰이 성공적으로 갱신되었습니다.");
  }

  /**
   * [3.6] 회원 탈퇴 API
   */
  @Post("withdraw")
  @Security("jwt")
  public async withdrawPost(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody?: UserWithdrawRequest
  ): Promise<ApiResponse<UserWithdrawResponse>> {
    const userId = getAuthenticatedUserId(request);
    const result = await this.authService.withdraw(userId, requestBody);
    return ApiResponse.success(result, "회원 탈퇴가 완료되었습니다.");
  }

  @Delete("withdraw")
  @Security("jwt")
  public async withdraw(
    @Request() request: AuthenticatedRequest,
    @Body() requestBody?: UserWithdrawRequest
  ): Promise<ApiResponse<UserWithdrawResponse>> {
    const userId = getAuthenticatedUserId(request);
    const result = await this.authService.withdraw(userId, requestBody);
    return ApiResponse.success(result, "회원 탈퇴가 완료되었습니다.");
  }
}

