import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const FRONTEND_DIR = process.env.FRONTEND_DIR || "../frontend/types"; 
// 실제 프론트엔드 경로가 있다면 이 환경변수 또는 경로를 변경하면 됩니다.
const SOURCE_DTO_DIR = path.join(process.cwd(), "src", "dto");

console.log("🔄 클라이언트용 타입 추출을 시작합니다...");

// 단순히 src/dto 폴더의 내용물을 프론트엔드 프로젝트로 복사하는 예제 스크립트
// 더 복잡한 타입 추론이 필요하면 swagger.json을 기반으로 OpenAPI-Generator를 사용하는 것을 권장합니다.

try {
  // 프론트엔드 폴더가 존재하는 경우 복사 수행 (주석 처리해둠)
  /*
  if (fs.existsSync(FRONTEND_DIR)) {
    execSync(`cp -r ${SOURCE_DTO_DIR}/* ${FRONTEND_DIR}`, { stdio: "inherit" });
    console.log(`✅ 타입이 성공적으로 ${FRONTEND_DIR} 로 복사되었습니다.`);
  } else {
    console.log(`⚠️ 프론트엔드 디렉토리를 찾을 수 없어 복사를 생략합니다: ${FRONTEND_DIR}`);
  }
  */
  console.log("✅ 클라이언트용 타입 스크립트 실행 완료.");
} catch (error) {
  console.error("❌ 타입 복사 중 오류 발생:", error);
  process.exit(1);
}
