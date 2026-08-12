import "reflect-metadata";
import UserService from "../../../services/userService";
import UserRepository from "../../../repositories/UserRepository";
import { Container } from "typedi";
import { UserNotFoundError } from "../../../errors";
import { UserMapper } from "../../../mappers";

jest.mock("../../../repositories/UserRepository");

describe("UserService Unit Tests", () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    Container.set(UserRepository, mockUserRepository);
    
    userService = Container.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("getUserProfile", () => {
    it("should return user profile if user exists", async () => {
      // given
      const mockUser = {
        id: 1,
        email: "test@test.com",
        nickname: "test",
        fuel_amount: 100,
        tammy: { level: 1, exp: 0 },
        space_ship: { current_planet_id: 1 }
      };
      mockUserRepository.findUserWithTammyStatus.mockResolvedValue(mockUser as any);
      
      const toProfileResponseSpy = jest.spyOn(UserMapper, 'toProfileResponse').mockReturnValue({ id: 1 } as any);

      // when
      const result = await userService.getUserProfile(1);

      // then
      expect(mockUserRepository.findUserWithTammyStatus).toHaveBeenCalledWith(1);
      expect(toProfileResponseSpy).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ id: 1 });
      
      toProfileResponseSpy.mockRestore();
    });

    it("should throw UserNotFoundError if user does not exist", async () => {
      // given
      mockUserRepository.findUserWithTammyStatus.mockResolvedValue(null as any);

      // when & then
      await expect(userService.getUserProfile(1)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("getTammyHistory", () => {
    it("should return tammy history if user exists", async () => {
      // given
      const mockUser = { id: 1 };
      const mockLogs = [{ id: 1, changes: 10 }];
      
      mockUserRepository.findUserById.mockResolvedValue(mockUser as any);
      mockUserRepository.findTammyStatusLogs.mockResolvedValue(mockLogs as any);

      const toTammyHistoryResponseSpy = jest.spyOn(UserMapper, 'toTammyHistoryResponse').mockReturnValue({ logs: mockLogs } as any);

      // when
      const result = await userService.getTammyHistory(1);

      // then
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.findTammyStatusLogs).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual({ logs: mockLogs });

      toTammyHistoryResponseSpy.mockRestore();
    });

    it("should throw UserNotFoundError if user does not exist", async () => {
      // given
      mockUserRepository.findUserById.mockResolvedValue(null as any);

      // when & then
      await expect(userService.getTammyHistory(1)).rejects.toThrow(UserNotFoundError);
    });
  });
});
