import { Service } from "typedi";

@Service()
export default class AuthService {
  /**
   * 사용자 인증 및 토큰 검증 로직을 수행합니다. (스텁)
   */
  public async authenticate(token: string): Promise<any> {
    // TODO: JWT 토큰 검증 및 유저 식별 처리
    throw new Error("Method not implemented.");
  }
}
