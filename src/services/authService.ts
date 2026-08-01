import { Service } from "typedi";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import config from "../config";
import { UserModel } from "../models/User";
import { UserSignUpRequest, UserLoginRequest, UserLoginResponse } from "../interfaces";

@Service()
export default class AuthService {
  /**
   * 신규 사용자를 가입시키고 해싱된 비밀번호와 정보를 DB에 적재합니다.
   */
  public async signUp(signUpData: UserSignUpRequest): Promise<number> {
    // 1. 비밀번호 단방향 암호화 (argon2id 최신 안전 해싱)
    const hashedPassword = await argon2.hash(signUpData.password);

    // 2. 사용자 데이터베이스 적재 (UserModel 호출)
    const userId = await UserModel.create({
      nickname: signUpData.nickname,
      gender: undefined, // 최초 가입 단계에는 입력 필드 없음
      age: undefined,
      target_weight_kg: undefined,
      preferred_exercise: undefined,
      exercise_location: undefined,
      preferred_exercise_time: undefined
    });

    // NOTE: 실제 운영 환경에서는 이메일 및 해싱된 패스워드를 별도 테이블(auth_credentials) 혹은
    // users 테이블의 컬럼에 hashedPassword를 안전하게 바인딩하여 관리합니다.
    return userId;
  }

  /**
   * 이메일/비밀번호 로그인을 처리하고 JWT 토큰을 발행합니다.
   */
  public async login(loginData: UserLoginRequest): Promise<UserLoginResponse> {
    // 1. DB에서 이메일 기반 사용자 계정 정보를 조회하는 쿼리가 여기에 연동됩니다.
    // (예: const auth = await AuthModel.findByEmail(loginData.email);)
    
    // 임시 테스트용 가짜 해시 패스워드 (실제 DB 조회값 대체용)
    const dummyHashedPassword = await argon2.hash("password123!");
    const dummyUserId = 1;
    const dummyNickname = "우주여행자";

    // 2. 암호 비교 검증
    const isMatch = await argon2.verify(dummyHashedPassword, loginData.password);
    if (!isMatch) {
      throw new Error("이메일 혹은 비밀번호가 일치하지 않습니다.");
    }

    // 3. JWT 액세스 토큰 서명 발행 (만료 시간 7일)
    const accessToken = jwt.sign(
      { userId: dummyUserId, nickname: dummyNickname },
      config.ai.apiKey || "super-secret-jwt-key",
      { expiresIn: "7d" }
    );

    return {
      accessToken,
      userId: dummyUserId,
      nickname: dummyNickname
    };
  }
}
