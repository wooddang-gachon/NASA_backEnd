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

// 2. src/build/swagger.json 파일 경로 읽기
const jsonPath = path.join(process.cwd(), "src", "build", "swagger.json");

if (!fs.existsSync(jsonPath)) {
  console.error("❌ swagger.json 파일을 찾을 수 없습니다:", jsonPath);
  process.exit(1);
}

const jsonRaw = fs.readFileSync(jsonPath, "utf8");
const swaggerSpec = JSON.parse(jsonRaw);

// Swagger Authorize 모달용 securitySchemes 주입
if (!swaggerSpec.components) {
  swaggerSpec.components = {};
}
swaggerSpec.components.securitySchemes = {
  jwt: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
  }
};
fs.writeFileSync(jsonPath, JSON.stringify(swaggerSpec, null, 2), "utf8");

// 3. YAML 포맷 변환 및 저장 (src/build/swagger.yaml & 루트 swagger.yaml)
const yamlString = yaml.stringify(swaggerSpec);

const targetBuildYamlPath = path.join(process.cwd(), "src", "build", "swagger.yaml");
const targetRootYamlPath = path.join(process.cwd(), "swagger.yaml");

fs.writeFileSync(targetBuildYamlPath, yamlString, "utf8");
fs.writeFileSync(targetRootYamlPath, yamlString, "utf8");

console.log("✅ swagger.yaml 파일이 성공적으로 추출되었습니다!");
console.log(`📌 저장 위치 1: ${targetBuildYamlPath}`);
console.log(`📌 저장 위치 2: ${targetRootYamlPath}`);
