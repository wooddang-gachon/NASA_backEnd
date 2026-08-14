#!/usr/bin/env bash
# /usr/local/bin/nasa-deploy.sh
# GitHub Actions 가 업로드한 릴리스 tarball 을 실제 서비스 경로에 반영합니다.
# 인자를 받지 않습니다(sudoers 에서 무인자 실행만 허용하므로 인자 주입 여지가 없습니다).
set -euo pipefail

TARBALL=/tmp/nasa-release.tar.gz
APP_DIR=/opt/nasa-backend
APP_USER=nasa

if [[ ! -f "$TARBALL" ]]; then
  echo "❌ 릴리스 파일이 없습니다: $TARBALL"
  exit 1
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

echo "==> 릴리스 압축 해제"
tar xzf "$TARBALL" -C "$STAGE"

echo "==> 서비스 경로 동기화 (.env / uploads / logs / node_modules 는 보존)"
rsync -a --delete \
  --exclude '.env' \
  --exclude 'uploads/' \
  --exclude 'logs/' \
  --exclude 'node_modules/' \
  --exclude '.pm2/' \
  --exclude '.npm/' \
  --exclude '.cache/' \
  "$STAGE"/ "$APP_DIR"/

chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# .env 는 GCP Secret Manager 를 출처로 매 배포마다 다시 만듭니다.
# 서버에서 손으로 채워 넣어야 하는 값이 없습니다.
/usr/local/bin/nasa-render-env.sh

echo "==> 프로덕션 의존성 설치"
# tsc 는 CI 에서 이미 끝났습니다. 2GB VM 이라 여기서 컴파일은 하지 않습니다.
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci --omit=dev --no-audit --no-fund

echo "==> Prisma Client 생성"
sudo -u "$APP_USER" npx prisma generate

echo "==> 앱 기동/재기동"
# NODE_ENV 는 dotenv 로딩보다 먼저 읽히므로 반드시 프로세스 환경으로 넘겨야 합니다.
if sudo -u "$APP_USER" pm2 describe nasa-backend >/dev/null 2>&1; then
  sudo -u "$APP_USER" env NODE_ENV=production pm2 reload nasa-backend --update-env
else
  sudo -u "$APP_USER" env NODE_ENV=production pm2 start dist/src/app.js \
    --name nasa-backend \
    --cwd "$APP_DIR" \
    --time
fi
sudo -u "$APP_USER" pm2 save >/dev/null

rm -f "$TARBALL"

echo "==> 헬스 체크"
for i in $(seq 1 20); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || true)"
  if [[ "$code" != "000" ]]; then
    echo "✅ 앱 응답 확인 (HTTP $code, ${i}회차)"
    exit 0
  fi
  sleep 3
done

echo "❌ 앱이 60초 안에 응답하지 않았습니다. 최근 로그:"
sudo -u "$APP_USER" pm2 logs nasa-backend --lines 40 --nostream || true
exit 1
