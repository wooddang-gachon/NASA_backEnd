import { Service } from "typedi";
import AuthService from "../authService";

@Service()
export default class MockAuthService extends AuthService {
  public async socialLogin(data: import("@/dto").SocialLoginRequest) {
    const { provider, token } = data;
    let email = "";
    let nickname = "";

    if (provider === "GOOGLE" && token.startsWith("mock_google_")) {
      email = `google_${token.replace("mock_google_", "")}@gmail.com`;
      nickname = "구글탐험가";
    } else if (provider === "KAKAO" && token.startsWith("mock_kakao_")) {
      email = `kakao_${token.replace("mock_kakao_", "")}@kakao.com`;
      nickname = "카카오탐험가";
    } else if (provider === "APPLE" && token.startsWith("mock_apple_")) {
      email = `apple_${token.replace("mock_apple_", "")}@apple.com`;
      nickname = "애플유저";
    } else {
      // Mock이 아니면 실제 로직 수행
      return super.socialLogin(data);
    }

    let user = await (this as any).authRepository.findUserByEmail(email);
    const mappers = await import("@/mappers");

    if (!user) {
      user = await (this as any).authRepository.createUser(
        mappers.UserMapper.toSocialUserCreateInput(email, provider, nickname),
      );
    } else {
      await (this as any).authRepository.updateUser(user.id, {
        auth_provider: provider,
        last_login_at: new Date(),
      });
    }

    const tokens = await (this as any).generateAndSaveTokens(user);
    return mappers.UserMapper.toLoginResponse(user, tokens);
  }
}
