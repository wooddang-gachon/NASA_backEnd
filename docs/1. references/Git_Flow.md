# Git 플로우

우리 팀의 코드 일관성과 안정적인 배포를 위해 아래의 Git Flow 정책을 준수합니다. **모든 `main`, `develop` 브랜치로의 반영은 반드시 Pull Request(PR)를 거쳐야 하며, 직접 Push는 금지합니다.**

---

## 1. 브랜치 전략 (Branch Strategy)

| **브랜치명** | **설명** | **권한** |
| --- | --- | --- |
| **`main`** | 제품 배포 브랜치 (가장 안정적인 상태) | **PR 필수** |
| **`develop`** | 다음 버전 개발 브랜치 (기능 통합) | **PR 필수** |
| **`feat/기능명`** | 각 기능별 작업 브랜치 | 작업자 자유 |

---

## 2. 작업 프로세스 (Work Flow)

### Step 1. 최신 코드 가져오기

새로운 기능을 개발하기 전, 항상 `develop` 브랜치를 최신화합니다.

```bash
git checkout develop
git pull origin develop
```

### Step 2. 기능 브랜치 생성

작업할 기능의 이름을 담은 브랜치를 생성합니다.

```bash
# 예시: feat/login
git checkout -b feat/기능이름
```

### Step 3. 작업 및 커밋

기능 개발 후 커밋 메시지 컨벤션에 맞춰 커밋을 진행합니다.

```bash
git add .
git commit -m "feat: 구현한 기능 요약"
```

### Step 4. 원격 저장소 Push 및 PR 생성

작업이 완료되면 원격에 올리고, GitHub에서 **Pull Request**를 생성합니다.

- **Target:** `develop` ← **Source:** `feat/기능이름`

```bash
git push origin feat/기능이름
```

### Step 5. 코드 리뷰 및 머지 (Merge to Develop)

- 팀원들의 리뷰를 거친 후, 승인이 완료되면 `develop` 브랜치로 머지합니다.
- 머지된 기능 브랜치는 삭제합니다.

### Step 6. 배포 준비 (Merge to Main)

- 다음 배포 단위의 기능이 `develop`에 모두 모이면, 최종적으로 `main`으로 합칩니다.
- **Target:** `main` ← **Source:** `develop` (GitHub UI에서 PR 생성)

---

## 3. 커밋 메시지 규칙 (Commit Convention)

팀원 간 가독성을 위해 아래 접두어를 사용합니다.

- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `docs:` 문서 수정 (README 등)
- `style:` 코드 의미에 영향 주지 않는 변경 (포맷팅 등)
- `refactor:` 코드 리팩토링
- `test:` 테스트 코드 추가

---

## 4. 우리 팀 필수 수칙 (Policy)

1. **No Direct Push:** `main`과 `develop` 브랜치에 직접 `git push` 하지 않습니다.
2. **PR Rule:** PR 생성 시 작업 내용에 대한 설명과 스크린샷(필요시)을 첨부합니다.
3. **Branch Cleanup:** 머지가 완료된 `feature` 브랜치는 바로 삭제하여 브랜치 목록을 관리합니다.