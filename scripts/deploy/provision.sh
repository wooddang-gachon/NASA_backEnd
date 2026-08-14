#!/usr/bin/env bash
# nasa-backend VM 최초 프로비저닝 스크립트 (한 번만 실행)
# 멱등하게 작성되어 재실행해도 안전합니다.
set -euo pipefail

APP_DIR=/opt/nasa-backend
APP_USER=nasa
AI_INTERNAL_IP=10.178.0.2
AI_PORT=8000

echo "==> [1/8] 스왑 2GB 설정 (e2-small 2GB RAM 보완)"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # 메모리 부족 상황에서만 스왑을 쓰도록 (SSD 수명/성능 보호)
  sysctl -w vm.swappiness=10
  grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
  echo "    스왑 생성 완료"
else
  echo "    스왑 이미 존재, 건너뜀"
fi

echo "==> [2/8] 시스템 패키지 설치"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  ca-certificates curl gnupg git \
  build-essential python3 \
  nginx mariadb-server \
  >/dev/null
echo "    nginx / mariadb / build tools 설치 완료"

echo "==> [3/8] Node.js 24 설치"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v24* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs >/dev/null
fi
echo "    node $(node -v) / npm $(npm -v)"

echo "==> [4/8] pm2 설치"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2 >/dev/null 2>&1
fi
echo "    pm2 $(pm2 -v)"

echo "==> [5/8] 앱 전용 사용자 및 디렉터리 생성"
if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "$APP_DIR" --shell /bin/bash "$APP_USER"
else
  echo "    사용자 이미 존재"
fi
mkdir -p "$APP_DIR" "$APP_DIR/uploads" "$APP_DIR/logs"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "==> [6/8] MariaDB 데이터베이스 및 계정 생성"
systemctl enable --now mariadb >/dev/null 2>&1
ENV_FILE="$APP_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
  echo "    .env 이미 존재 -> 비밀번호 재생성하지 않고 유지"
else
  # URL 구분자와 충돌하지 않도록 16진수 문자열로만 생성 (@ : / 등 미포함)
  DB_PASS="$(openssl rand -hex 24)"
  JWT_SECRET="$(openssl rand -hex 32)"
  SWAGGER_PASS="$(openssl rand -hex 12)"

  mysql <<SQL
CREATE DATABASE IF NOT EXISTS nasa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nasa'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER 'nasa'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON nasa_db.* TO 'nasa'@'localhost';
FLUSH PRIVILEGES;
SQL

  cat > "$ENV_FILE" <<ENVEOF
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# 로컬 MariaDB (같은 VM). 비밀번호는 프로비저닝 시 자동 생성됨.
DATABASE_URL="mysql://nasa:${DB_PASS}@127.0.0.1:3306/nasa_db"
MOCK_DATABASE_URL=""

JWT_SECRET="${JWT_SECRET}"

SWAGGER_USER="admin"
SWAGGER_PASSWORD="${SWAGGER_PASS}"

# AI 서버(tammy-service)를 VPC 내부 IP로 호출합니다. 외부망을 타지 않습니다.
AI_SERVER_URL="http://${AI_INTERNAL_IP}:${AI_PORT}"

# TODO: AI 서버와 공유하는 내부 API 키를 직접 채워 넣어야 합니다.
AI_INTERNAL_API_KEY=""
ENVEOF
  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "    DB/계정 생성 및 .env 작성 완료 (권한 600)"
fi

echo "==> [7/8] Nginx 리버스 프록시 설정"
cat > /etc/nginx/sites-available/nasa-backend <<'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 음식 사진 업로드가 있어 기본 1MB 제한으로는 부족합니다.
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";

        # 비전 추론이 오래 걸릴 수 있어 기본 60초보다 넉넉히 잡습니다.
        proxy_connect_timeout 60s;
        proxy_send_timeout    120s;
        proxy_read_timeout    120s;
    }
}
NGINXEOF
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/nasa-backend /etc/nginx/sites-enabled/nasa-backend
nginx -t
systemctl reload nginx
systemctl enable nginx >/dev/null 2>&1
echo "    nginx 80 -> localhost:3000 프록시 설정 완료"

echo "==> [8/8] pm2 부팅 시 자동 기동 등록"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "$APP_DIR" >/dev/null 2>&1 || true
systemctl enable "pm2-$APP_USER" >/dev/null 2>&1 || true
echo "    pm2 systemd 유닛 등록 완료"

echo
echo "===================== 프로비저닝 완료 ====================="
echo " 앱 경로   : $APP_DIR"
echo " 실행 계정 : $APP_USER"
echo " 환경파일  : $ENV_FILE (chmod 600)"
echo " 남은 작업 : .env 의 AI_INTERNAL_API_KEY 채우기"
echo "==========================================================="
