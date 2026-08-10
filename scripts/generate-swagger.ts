import fs from "fs";
import path from "path";
import yaml from "yaml";
import { execSync } from "child_process";

// 1. TSOA Swagger JSON 명세서 및 라우트 최신화 생성
console.log("🔄 TSOA OpenAPI spec-and-routes 생성 중...");
try {
  execSync("npx tsoa spec-and-routes", { stdio: "inherit" });
} catch (error) {
  console.error("❌ TSOA 생성 중 오류 발생:", error);
  process.exit(1);
}

// ESM 호환 패치: const multer = require('multer'); -> import multer from 'multer';
const routesPath = path.join(process.cwd(), "src", "build", "routes.ts");
if (fs.existsSync(routesPath)) {
  let routesContent = fs.readFileSync(routesPath, "utf8");
  routesContent = routesContent.replace("const multer = require('multer');", "import multer from 'multer';");
  fs.writeFileSync(routesPath, routesContent, "utf8");
}

// 2. 생성된 JSON을 다시 YAML로 변환 (외부 공유용)
const jsonPath = path.join(process.cwd(), "docs", "swagger.json");
if (fs.existsSync(jsonPath)) {
  const jsonRaw = fs.readFileSync(jsonPath, "utf8");
  const swaggerSpec = JSON.parse(jsonRaw);
  const yamlString = yaml.stringify(swaggerSpec);
  
  const targetRootYamlPath = path.join(process.cwd(), "swagger.yaml");
  fs.writeFileSync(targetRootYamlPath, yamlString, "utf8");
  console.log("✅ OpenAPI JSON 및 외부 공유용 swagger.yaml 파일 자동 생성이 완료되었습니다.");
} else {
  console.log("✅ OpenAPI JSON 자동 생성이 완료되었습니다 (docs/swagger.json).");
}
