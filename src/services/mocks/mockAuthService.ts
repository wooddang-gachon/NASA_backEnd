import { Service } from 'typedi';
import AuthService from '../authService';

@Service()
export default class MockAuthService extends AuthService {
  protected async verifySocialToken(provider: 'KAKAO' | 'GOOGLE' | 'APPLE', token: string) {
    if (provider === 'GOOGLE' && token.startsWith('mock_google_')) {
      return {
        email: `google_${token.replace('mock_google_', '')}@gmail.com`,
        nickname: '구글탐험가',
      };
    }
    if (provider === 'KAKAO' && token.startsWith('mock_kakao_')) {
      return {
        email: `kakao_${token.replace('mock_kakao_', '')}@kakao.com`,
        nickname: '카카오탐험가',
      };
    }
    if (provider === 'APPLE' && token.startsWith('mock_apple_')) {
      return {
        email: `apple_${token.replace('mock_apple_', '')}@apple.com`,
        nickname: '애플유저',
      };
    }
    // Mock이 아니면 실제 로직 수행
    return super.verifySocialToken(provider, token);
  }
}
