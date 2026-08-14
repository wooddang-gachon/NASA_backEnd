#!/usr/bin/env bash
# /usr/local/bin/nasa-render-env.sh
#
# GCP Secret Manager 를 유일한 출처로 삼아 서버의 .env 를 생성합니다.
# 배포할 때마다 실행되므로, 시크릿을 교체하면 다음 배포에 자동 반영됩니다.
# VM 은 nasa-backend-vm 서비스 계정으로 4개 시크릿에 대해서만 읽기 권한을 가집니다.
set -euo pipefail

APP_DIR=/opt/nasa-backend
APP_USER=nasa
ENV_FILE="$APP_DIR/.env"
PROJECT=tammy-ai-server

# AI 서버는 Cloud Run 에서 동작합니다. (VM tammy-service 가 아닙니다)
AI_SERVER_URL="https://tammy-ai-server-npgubkcxuq-du.a.run.app"

sec() {
  gcloud secrets versions access latest --secret="$1" --project="$PROJECT" 2>/dev/null
}

echo "==> Secret Manager 에서 값 조회"
DB_PASS="$(sec nasa-backend-db-password)"
JWT_SECRET="$(sec nasa-backend-jwt-secret)"
SWAGGER_PASS="$(sec nasa-backend-swagger-password)"
# AI 서버(Cloud Run)가 INTERNAL_API_KEY 로 읽는 것과 같은 시크릿입니다.
# 양쪽이 같은 리소스를 보므로 값이 어긋날 수 없습니다.
AI_KEY="$(sec tammy-internal-api-key)"

for pair in "DB_PASS:$DB_PASS" "JWT_SECRET:$JWT_SECRET" "SWAGGER_PASS:$SWAGGER_PASS" "AI_KEY:$AI_KEY"; do
  name="${pair%%:*}"
  [[ -n "${pair#*:}" ]] || { echo "❌ ${name} 조회 실패 — 시크릿 권한을 확인하세요"; exit 1; }
done
echo "    4개 시크릿 조회 완료"

echo "==> MariaDB 계정 비밀번호를 시크릿 값과 동기화"
# 시크릿을 교체하면 DB 비밀번호도 따라오도록 매번 맞춥니다(멱등).
mysql <<SQL
CREATE DATABASE IF NOT EXISTS nasa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nasa'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER 'nasa'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON nasa_db.* TO 'nasa'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "==> .env 생성"
umask 077
cat > "$ENV_FILE" <<ENVEOF
# 이 파일은 배포 시 nasa-render-env.sh 가 GCP Secret Manager 에서 생성합니다.
# 직접 수정하지 마세요. 값을 바꾸려면 Secret Manager 에 새 버전을 추가한 뒤
# 재배포하면 됩니다.
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

DATABASE_URL="mysql://nasa:${DB_PASS}@127.0.0.1:3306/nasa_db"
MOCK_DATABASE_URL=""

JWT_SECRET="${JWT_SECRET}"

SWAGGER_USER="admin"
SWAGGER_PASSWORD="${SWAGGER_PASS}"

AI_SERVER_URL="${AI_SERVER_URL}"
AI_INTERNAL_API_KEY="${AI_KEY}"
ENVEOF

chown "$APP_USER:$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo "    .env 생성 완료 (chmod 600, 소유자 ${APP_USER})"
