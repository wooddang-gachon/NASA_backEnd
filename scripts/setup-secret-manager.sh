#!/usr/bin/env bash
#
# 런타임 비밀 값을 GCP Secret Manager 에 두고, VM 이 배포 시 읽어가도록 구성합니다.
# 이미 적용이 끝난 상태이며, 이 파일은 재현/문서화 목적으로 둡니다. (멱등)
#
# 설계 요지
#   - GitHub 에는 비밀 값이 하나도 저장되지 않습니다.
#     CD 인증은 Workload Identity Federation(장기 키 없음)으로 하고,
#     레포 시크릿 2개는 비밀이 아닌 식별자입니다.
#   - VM 은 전용 서비스 계정으로 필요한 시크릿에만 읽기 권한을 가집니다.
#   - AI 서버(Cloud Run)와 백엔드가 같은 시크릿 리소스를 보므로
#     공유 키가 어긋날 수 없습니다.
#
set -euo pipefail

PROJECT_ID=tammy-ai-server
ZONE=asia-northeast3-a
INSTANCE=nasa-backend
VM_SA_NAME=nasa-backend-vm
VM_SA="${VM_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
# GitHub Actions 가 배포할 때 쓰는 계정 (setup-cd-permissions.sh 에서 생성)
CD_SA="github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com"

# gcloud 기본 프로젝트가 다르면 setIamPolicy 가 실패합니다.
export CLOUDSDK_CORE_PROJECT="${PROJECT_ID}"

# 백엔드 전용 시크릿. tammy-internal-api-key 는 AI 서버가 이미 쓰던 것이라
# 여기서 만들지 않고 읽기 권한만 붙입니다.
OWN_SECRETS=(
  nasa-backend-db-password
  nasa-backend-jwt-secret
  nasa-backend-swagger-password
)
SHARED_SECRETS=(
  tammy-internal-api-key
)

echo "==> [1/5] Secret Manager API 활성화"
gcloud services enable secretmanager.googleapis.com >/dev/null
echo "    완료"

echo "==> [2/5] VM 런타임 서비스 계정"
if ! gcloud iam service-accounts describe "${VM_SA}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${VM_SA_NAME}" \
    --display-name="NASA backend VM runtime" \
    --description="Secret Manager 읽기 전용" >/dev/null
  echo "    생성됨"
else
  echo "    이미 존재"
fi

echo "==> [3/5] 시크릿 생성 및 권한 부여"
gen() {
  case "$1" in
    *db-password)      openssl rand -hex 24 ;;
    *jwt-secret)       openssl rand -hex 32 ;;
    *swagger-password) openssl rand -hex 12 ;;
    *)                 openssl rand -hex 32 ;;
  esac
}
for S in "${OWN_SECRETS[@]}"; do
  if gcloud secrets describe "$S" >/dev/null 2>&1; then
    echo "    = $S (유지)"
  else
    # 값은 stdin 으로만 넘깁니다. 인자로 주면 프로세스 목록에 남습니다.
    gen "$S" | tr -d '\n' | gcloud secrets create "$S" --replication-policy=automatic --data-file=- >/dev/null
    echo "    + $S 생성"
  fi
done
for S in "${OWN_SECRETS[@]}" "${SHARED_SECRETS[@]}"; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${VM_SA}" \
    --role=roles/secretmanager.secretAccessor --quiet >/dev/null
done
echo "    시크릿별 읽기 권한 부여 완료 (프로젝트 전체 권한 아님)"

echo "==> [4/5] VM 에 서비스 계정 연결"
CURRENT_SA="$(gcloud compute instances describe "${INSTANCE}" --zone="${ZONE}" \
  --format='value(serviceAccounts[0].email)' 2>/dev/null || true)"
if [[ "${CURRENT_SA}" == "${VM_SA}" ]]; then
  echo "    이미 연결됨"
else
  # 서비스 계정/스코프 변경은 인스턴스가 중지된 상태에서만 가능합니다.
  # 고정 IP를 예약해 두었으므로 재시작해도 주소는 유지됩니다.
  echo "    VM 중지 (스코프 변경에 필요)"
  gcloud compute instances stop "${INSTANCE}" --zone="${ZONE}" --quiet >/dev/null
  gcloud compute instances set-service-account "${INSTANCE}" --zone="${ZONE}" \
    --service-account="${VM_SA}" --scopes=cloud-platform >/dev/null
  gcloud compute instances start "${INSTANCE}" --zone="${ZONE}" --quiet >/dev/null
  echo "    연결 및 재기동 완료"
fi

echo "==> [5/5] CD 계정에 actAs 권한 부여"
# 인스턴스에 서비스 계정이 붙어 있으면, SSH/SCP 하는 주체가 그 서비스 계정에 대해
# iam.serviceAccounts.actAs 를 가져야 합니다. 이게 없으면 배포가
# "User does not have iam.serviceAccounts.actAs permission on the instance's
#  service account" 로 실패합니다.
# VM SA 하나에만 부여하므로 프로젝트 전체 권한이 아닙니다.
gcloud iam service-accounts add-iam-policy-binding "${VM_SA}" \
  --member="serviceAccount:${CD_SA}" \
  --role=roles/iam.serviceAccountUser --quiet >/dev/null
echo "    ${CD_SA} -> actAs on ${VM_SA}"

echo
echo "==================================================================="
echo " ✅ Secret Manager 구성 완료"
echo
echo " 값을 바꾸려면 새 버전을 추가한 뒤 재배포하면 반영됩니다:"
echo "   printf '%s' \"새값\" | gcloud secrets versions add nasa-backend-jwt-secret \\"
echo "     --project=${PROJECT_ID} --data-file=-"
echo "==================================================================="
