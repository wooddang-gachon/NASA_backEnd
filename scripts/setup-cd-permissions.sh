#!/usr/bin/env bash
#
# CD 파이프라인에 필요한 "권한" 설정을 한 번에 적용합니다. (최초 1회만 실행)
#
# 이 스크립트가 하는 일:
#   1. GitHub Actions 서비스 계정에 IAM 역할 3개 부여
#   2. Workload Identity Federation 풀/공급자 생성 (장기 키 없이 GitHub -> GCP 인증)
#   3. VM 에 sudoers 규칙 추가 (배포 스크립트 하나만 무인자 sudo 허용)
#   4. GitHub 레포 시크릿 2개 등록
#
# 실행:  bash scripts/setup-cd-permissions.sh
# 필요:  gcloud (yeong010601@gmail.com 로그인), gh (yeongin-ji 로그인)
#
set -euo pipefail

PROJECT_ID=tammy-ai-server
PROJECT_NUMBER=601688473805
ZONE=asia-northeast3-a
INSTANCE=nasa-backend
REPO=wooddang-gachon/NASA_backEnd

SA_NAME=github-actions-deploy
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
POOL=github-pool
PROVIDER=github-provider

# gcloud 의 기본 프로젝트가 다른 값이면 --project 를 줘도 할당량/리소스 컨텍스트가
# 어긋나 setIamPolicy 가 PERMISSION_DENIED 로 실패합니다.
# 이 스크립트 실행 동안만 컨텍스트를 고정합니다(전역 설정은 건드리지 않습니다).
export CLOUDSDK_CORE_PROJECT="${PROJECT_ID}"

echo "==================================================================="
echo " 대상 프로젝트 : ${PROJECT_ID}"
echo " 서비스 계정   : ${SA_EMAIL}"
echo " 대상 레포     : ${REPO}"
echo "==================================================================="
# 대화형 셸에서만 확인을 받습니다. 파이프/비대화형 실행(예: bash script.sh)에서는
# 입력을 받을 수 없어 그대로 진행합니다. --yes 를 주면 항상 건너뜁니다.
if [[ "${1:-}" != "--yes" && -t 0 ]]; then
  read -rp "위 설정으로 진행할까요? (y/N) " ans
  [[ "$ans" == "y" || "$ans" == "Y" ]] || { echo "취소했습니다."; exit 1; }
fi

echo
echo "==> [1/4] 서비스 계정에 IAM 역할 부여"
# compute.viewer            : 인스턴스 조회 (gcloud compute ssh 가 대상을 찾기 위해 필요)
# iap.tunnelResourceAccessor: IAP 터널로 SSH (22 포트가 인터넷에 열려있지 않으므로 필수)
# compute.osLogin           : SSH 로그인. sudo 없는 일반 권한이며,
#                             배포 스크립트 실행 권한만 아래 3단계 sudoers 로 따로 허용합니다.
for ROLE in \
  roles/compute.viewer \
  roles/iap.tunnelResourceAccessor \
  roles/compute.osLogin
do
  echo "    - ${ROLE}"
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --condition=None \
    --quiet >/dev/null
done
echo "    완료"

echo
echo "==> [2/4] Workload Identity Federation 구성"
if ! gcloud iam workload-identity-pools describe "${POOL}" \
     --project="${PROJECT_ID}" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "${POOL}" \
    --project="${PROJECT_ID}" \
    --location=global \
    --display-name="GitHub Actions Pool" >/dev/null
  echo "    풀 생성됨"
else
  echo "    풀이 이미 존재함"
fi

if ! gcloud iam workload-identity-pools providers describe "${PROVIDER}" \
     --project="${PROJECT_ID}" --location=global \
     --workload-identity-pool="${POOL}" >/dev/null 2>&1; then
  # attribute-condition 으로 이 레포에서 온 토큰만 받아들입니다.
  # 이게 없으면 GitHub 의 아무 레포나 이 서비스 계정을 흉내낼 수 있습니다.
  gcloud iam workload-identity-pools providers create-oidc "${PROVIDER}" \
    --project="${PROJECT_ID}" \
    --location=global \
    --workload-identity-pool="${POOL}" \
    --display-name="GitHub OIDC" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='${REPO}'" >/dev/null
  echo "    공급자 생성됨 (${REPO} 에서 온 토큰만 허용)"
else
  echo "    공급자가 이미 존재함"
fi

MEMBER="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${REPO}"
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --project="${PROJECT_ID}" \
  --role=roles/iam.workloadIdentityUser \
  --member="${MEMBER}" \
  --quiet >/dev/null
echo "    서비스 계정 가장(impersonation) 권한 연결 완료"

echo
echo "==> [3/4] VM sudoers 규칙 추가"
# 배포 스크립트에 한해, 인자 없이 실행할 때만 비밀번호 없는 sudo 를 허용합니다.
# ("" 는 '인자를 받지 않는 호출만 허용' 이라는 뜻입니다)
# 이렇게 하면 CI 계정이 서버에서 임의의 root 명령을 실행할 수 없습니다.
gcloud compute ssh "${INSTANCE}" \
  --project="${PROJECT_ID}" --zone="${ZONE}" --tunnel-through-iap --quiet \
  --command='sudo sh -c '"'"'
    printf "ALL ALL=(root) NOPASSWD: /usr/local/bin/nasa-deploy.sh \"\"\n" > /etc/sudoers.d/nasa-deploy
    chmod 0440 /etc/sudoers.d/nasa-deploy
    if visudo -c -f /etc/sudoers.d/nasa-deploy; then
      echo "    sudoers 규칙 적용 완료"
    else
      rm -f /etc/sudoers.d/nasa-deploy
      echo "    sudoers 문법 오류로 되돌렸습니다"
      exit 1
    fi
  '"'"''

echo
echo "==> [4/4] GitHub 레포 시크릿 등록"
PROVIDER_PATH="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"
gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER --repo "${REPO}" --body "${PROVIDER_PATH}"
gh secret set GCP_SERVICE_ACCOUNT           --repo "${REPO}" --body "${SA_EMAIL}"
echo "    시크릿 2개 등록 완료"

echo
echo "==================================================================="
echo " ✅ CD 권한 설정 완료"
echo
echo " 남은 수동 작업:"
echo "   1) 서버 .env 에 AI_INTERNAL_API_KEY 채우기"
echo "      gcloud compute ssh ${INSTANCE} --project=${PROJECT_ID} \\"
echo "        --zone=${ZONE} --tunnel-through-iap \\"
echo "        --command='sudo nano /opt/nasa-backend/.env'"
echo
echo "   2) 최초 DB 스키마 반영 (첫 배포 후 1회)"
echo "      gcloud compute ssh ${INSTANCE} --project=${PROJECT_ID} \\"
echo "        --zone=${ZONE} --tunnel-through-iap \\"
echo "        --command='cd /opt/nasa-backend && sudo -u nasa npx prisma migrate deploy'"
echo "==================================================================="
