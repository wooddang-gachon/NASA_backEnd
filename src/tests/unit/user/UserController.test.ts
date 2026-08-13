import "reflect-metadata";
import { UserController } from "../../../api/routes/UserController";
import UserService from "../../../services/userService";
import { Container } from "typedi";
import type { AuthenticatedRequest } from "../../../interfaces/express";
import { UserProfileResponseData, TammyHistoryResponse } from "../../../dto";

jest.mock("../../../services/userService");

describe("UserController Unit Tests", () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockUserService = new UserService() as jest.Mocked<UserService>;
    Container.set(UserService, mockUserService);

    userController = new UserController();
    Object.assign(userController, { getUserId: jest.fn().mockReturnValue(1) });
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  it("should get me and return success response", async () => {
    // given
    const mockRequest = {} as AuthenticatedRequest;
    const mockProfile: UserProfileResponseData = {
      id: 1,
      email: "test@test.com",
      nickname: "test",
      fuel_amount: 100,
      tammy: { level: 1, exp: 0, required_exp: 100, evolution_stage: 1 },
      space_ship: { current_planet_id: 1, unlocked_planet_ids: [1] },
    } as never;

    mockUserService.getUserProfile.mockResolvedValue(mockProfile);

    // when
    const response = await userController.getMe(mockRequest);

    // then
    expect(mockUserService.getUserProfile).toHaveBeenCalledWith(1);
    expect(response.code).toBe(200);
    expect(response.message).toBe(
      "내 프로필 및 타미 상태 조회가 완료되었습니다.",
    );
    expect(response.data).toEqual(mockProfile);
  });

  it("should get tammy history and return success response", async () => {
    // given
    const mockRequest = {} as AuthenticatedRequest;
    const mockHistory: TammyHistoryResponse = {
      logs: [],
    } as never;

    mockUserService.getTammyHistory.mockResolvedValue(mockHistory);

    // when
    const response = await userController.getTammyHistory(mockRequest);

    // then
    expect(mockUserService.getTammyHistory).toHaveBeenCalledWith(1);
    expect(response.code).toBe(200);
    expect(response.message).toBe("타미 성장 히스토리 조회가 완료되었습니다.");
    expect(response.data).toEqual(mockHistory);
  });
});
