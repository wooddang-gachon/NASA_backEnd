import { UserMapper } from "../../../mappers/userMapper";
import { UserSignUpRequest } from "../../../dto";

describe("userMapper", () => {
  it("should map toUserCreateInput with all fields", () => {
    const req = {
      email: "test@example.com",
      nickname: "Test User",
      gender: "M",
      age: 25,
    } as UserSignUpRequest;
    const res = UserMapper.toUserCreateInput(req, "hashedPassword");
  });

  it("should map toUserCreateInput with missing optional fields", () => {
    const req = {
      email: "test2@example.com",
      nickname: "Test User 2",
    } as UserSignUpRequest;
    const res = UserMapper.toUserCreateInput(req, "hashedPassword");
    expect(res.email).toBe("test2@example.com");
    expect(res.gender).toBeNull();
  });

  it("should map toProfileResponse correctly", () => {
    const dbUser = {
      id: 1,
      email: "a@a.com",
      nickname: "A",
      gender: "F",
      age: 20,
      current_fuel: 50,
      tammy_statuses: {
        level: 2,
        current_exp: 100,
      },
      created_at: new Date(),
    };
    const res = UserMapper.toProfileResponse(dbUser as any);
    expect(res.userId).toBe(1);
    expect(res.nickname).toBe("A");
    expect(res.gender).toBe("F");
    expect(res.tammyStatus!.level).toBe(2);
  });

  it("should map toProfileResponse correctly when optional fields are missing", () => {
    const dbUser = {
      id: 1,
      email: "a@a.com",
      nickname: "A",
    };
    const res = UserMapper.toProfileResponse(dbUser as any);
    expect(res.gender).toBeUndefined();
    expect(res.tammyStatus!.level).toBe(1);
    expect(res.currentFuel).toBe(0);
  });
});
