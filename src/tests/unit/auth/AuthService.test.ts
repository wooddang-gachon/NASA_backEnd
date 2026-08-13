import "reflect-metadata";
import AuthService from "../../../services/authService";
import AuthRepository from "../../../repositories/AuthRepository";
import { Container } from "typedi";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import {
  ConflictError,
  UnauthorizedError,
  UserNotFoundError,
} from "../../../errors";
import { UserMapper } from "../../../mappers";

jest.mock("../../../repositories/AuthRepository");
jest.mock("argon2");
jest.mock("jsonwebtoken");

describe("AuthService Unit Tests", () => {
  let authService: AuthService;
  let mockAuthRepository: jest.Mocked<AuthRepository>;
  let globalFetchMock: jest.Mock;

  beforeEach(() => {
    mockAuthRepository = new AuthRepository() as jest.Mocked<AuthRepository>;
    Container.set(AuthRepository, mockAuthRepository);

    authService = Container.get(AuthService);

    globalFetchMock = jest.fn();
    global.fetch = globalFetchMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    Container.reset();
  });

  describe("signUp", () => {
    it("should sign up a user successfully", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null as never);
      (argon2.hash as jest.Mock).mockResolvedValue("hashed_password");
      mockAuthRepository.createUser.mockResolvedValue({
        id: 1,
        email: "test@test.com",
      } as never);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("access_token")
        .mockReturnValueOnce("refresh_token");
      mockAuthRepository.updateUser.mockResolvedValue(undefined as never);

      const toUserCreateInputSpy = jest
        .spyOn(UserMapper, "toUserCreateInput")
        .mockReturnValue({} as never);
      const toLoginResponseSpy = jest
        .spyOn(UserMapper, "toLoginResponse")
        .mockReturnValue({ accessToken: "access_token" } as never);

      const result = await authService.signUp({
        email: "test@test.com",
        password: "password",
        nickname: "test",
      });

      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(
        "test@test.com",
      );
      expect(argon2.hash).toHaveBeenCalledWith("password");
      expect(mockAuthRepository.createUser).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      );
      expect(result).toEqual({ accessToken: "access_token" });

      toUserCreateInputSpy.mockRestore();
      toLoginResponseSpy.mockRestore();
    });

    it("should throw ConflictError if email already exists", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue({ id: 1 } as never);

      await expect(
        authService.signUp({
          email: "test@test.com",
          password: "password",
          nickname: "test",
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      const mockUser = {
        id: 1,
        email: "test@test.com",
        password_hash: "hashed_password",
      };
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser as never);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("access_token")
        .mockReturnValueOnce("refresh_token");

      const toLoginResponseSpy = jest
        .spyOn(UserMapper, "toLoginResponse")
        .mockReturnValue({ accessToken: "access_token" } as never);

      const result = await authService.login({
        email: "test@test.com",
        password: "password",
      });

      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith(
        "test@test.com",
      );
      expect(argon2.verify).toHaveBeenCalledWith("hashed_password", "password");
      expect(result).toEqual({ accessToken: "access_token" });

      toLoginResponseSpy.mockRestore();
    });

    it("should throw UnauthorizedError if user not found", async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null as never);

      await expect(
        authService.login({ email: "test@test.com", password: "password" }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError if password is wrong", async () => {
      const mockUser = {
        id: 1,
        email: "test@test.com",
        password_hash: "hashed_password",
      };
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser as never);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: "test@test.com", password: "password" }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      mockAuthRepository.updateUser.mockResolvedValue(undefined as never);

      const result = await authService.logout({
        userId: 1,
        refreshToken: "dummy_token",
      });

      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(1, {
        refresh_token: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("refresh", () => {
    it("should refresh token successfully", async () => {
      const mockUser = {
        id: 1,
        email: "test@test.com",
        refresh_token: "old_refresh_token",
      };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
      mockAuthRepository.findUserById.mockResolvedValue(mockUser as never);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("new_access_token")
        .mockReturnValueOnce("new_refresh_token");

      const result = await authService.refresh({
        refreshToken: "old_refresh_token",
      });

      expect(result.accessToken).toBe("new_access_token");
      expect(result.refreshToken).toBe("new_refresh_token");
      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(1, {
        refresh_token: "new_refresh_token",
      });
    });

    it("should throw UnauthorizedError if token is invalid", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error();
      });

      await expect(
        authService.refresh({ refreshToken: "invalid" }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("withdraw", () => {
    it("should withdraw successfully", async () => {
      mockAuthRepository.findUserById.mockResolvedValue({ id: 1 } as never);
      mockAuthRepository.deleteUser.mockResolvedValue(undefined as never);

      const result = await authService.withdraw(1);

      expect(mockAuthRepository.deleteUser).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });

    it("should throw UserNotFoundError if user not found", async () => {
      mockAuthRepository.findUserById.mockResolvedValue(null as never);

      await expect(authService.withdraw(1)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("socialLogin", () => {
    it("should social login and create new user", async () => {
      globalFetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ email: "google@google.com", name: "google" }),
      });

      mockAuthRepository.findUserByEmail.mockResolvedValue(null as never);
      mockAuthRepository.createUser.mockResolvedValue({
        id: 1,
        email: "google@google.com",
      } as never);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("access_token")
        .mockReturnValueOnce("refresh_token");

      const toSocialUserCreateInputSpy = jest
        .spyOn(UserMapper, "toSocialUserCreateInput")
        .mockReturnValue({} as never);
      const toLoginResponseSpy = jest
        .spyOn(UserMapper, "toLoginResponse")
        .mockReturnValue({ accessToken: "access_token" } as never);

      const result = await authService.socialLogin({
        provider: "GOOGLE",
        token: "token",
      });

      expect(mockAuthRepository.createUser).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: "access_token" });

      toSocialUserCreateInputSpy.mockRestore();
      toLoginResponseSpy.mockRestore();
    });
  });
});
