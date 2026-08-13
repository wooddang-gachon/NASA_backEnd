import "reflect-metadata";
import { AuthController } from "../../../api/routes/AuthController";
import AuthService from "../../../services/authService";
import { Container } from "typedi";
import type { AuthenticatedRequest } from "../../../interfaces/express";

// AuthService를 Mocking합니다.
jest.mock("../../../services/authService");

describe("AuthController Unit Tests", () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    // TypeDI 컨테이너에 Mock Service 주입
    Container.set(AuthService, mockAuthService);

    // BaseController가 getAuthenticatedUserId 함수를 사용하므로 해당 함수 모킹을 위해 request 객체를 안전하게 구성합니다.
    authController = new AuthController();
    // getUserId를 오버라이드하여 편하게 테스트할 수 있습니다.
    (authController as unknown as Record<string, unknown>).getUserId = jest
      .fn()
      .mockReturnValue(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  it("should withdraw user and return success response", async () => {
    // given
    const mockRequest = {} as AuthenticatedRequest;
    const requestBody = { reason: "test" } as unknown as { reason: string }; // 타입 캐스팅으로 강제 우회

    mockAuthService.withdraw.mockResolvedValue(null as never);

    // when
    const response = await authController.withdraw(mockRequest, requestBody);

    // then
    expect(mockAuthService.withdraw).toHaveBeenCalledWith(1, requestBody);
    expect(response.code).toBe(200); // statusCode -> code
    expect(response.message).toBe("회원 탈퇴가 완료되었습니다.");
  });
});
