# Neverland Azure 무료 배포

Neverland는 Azure Static Web Apps의 Free 플랜을 사용한다. VM, PostgreSQL, Redis, 고정 IP가 없으므로 공개 사이트의 월 고정비는 원칙적으로 0원이다. 별도 도메인을 구매하면 도메인 비용만 발생한다.

현재 운영 리소스:

- Resource group: `neverland-rg`
- Static Web App: `neverland-scourge1100`
- Region: `East Asia`
- SKU: `Free`
- URL: `https://wonderful-cliff-01d049c00.7.azurestaticapps.net`

## 1. 로컬 확인

```bash
SITE_URL=https://temporary.example npm run build
npm run test:static
npm run preview
```

`http://localhost:4173`에서 홈, 글, 프로젝트, 검색과 모바일 화면을 확인한다.

## 2. GitHub 저장소 준비

Neverland 디렉터리를 GitHub 저장소로 만들고 기본 브랜치를 `main`으로 사용한다. `.env`, `dist/`, 백업과 로컬 인증서는 커밋하지 않는다.

저장소에는 다음 파일이 포함되어야 한다.

- `content/`
- `config/site/`
- `scripts/build-static.mjs`
- `staticwebapp.config.json`
- `.github/workflows/azure-static-web-apps.yml`

## 3. Azure Static Web App 생성

Azure Portal에서 `Static Web Apps`를 선택하고 새 리소스를 만든다.

- Plan type: `Free`
- Deployment source: `GitHub`
- Repository: Neverland 저장소
- Branch: `main`
- Build preset: `Custom`

Azure가 GitHub 연결 과정에서 별도의 workflow를 자동 생성한다면, 저장소에 준비된 `.github/workflows/azure-static-web-apps.yml` 하나만 사용하도록 중복 workflow를 제거한다.

## 4. 배포 토큰 설정

Azure Portal의 Static Web App에서 배포 토큰을 복사하고 GitHub 저장소의 Actions secret에 등록한다.

```text
AZURE_STATIC_WEB_APPS_API_TOKEN
```

Azure가 만든 기본 주소를 확인한 뒤 GitHub Actions variable도 등록한다.

```text
SITE_URL=https://<generated-name>.azurestaticapps.net
```

workflow는 먼저 `npm run build`와 `npm run test:static`을 실행하고, 성공한 `dist/`만 배포한다.

## 5. 첫 배포 확인

GitHub Actions의 `Azure Static Web Apps` workflow가 성공했는지 확인하고 다음 경로를 점검한다.

- `/`
- `/writing`
- `/projects`
- `/about`
- `/search?q=neverland`
- `/rss.xml`
- `/sitemap.xml`
- 존재하지 않는 경로의 404 페이지

## 6. 사용자 도메인

도메인이 없다면 Azure 기본 `azurestaticapps.net` 주소를 그대로 사용해도 비용이 없다.

사용자 도메인을 연결할 경우 Azure Portal의 `Custom domains`에서 안내하는 DNS 레코드를 등록한다. 인증서는 Azure가 무료로 생성하고 자동 갱신한다. 연결 후 GitHub variable `SITE_URL`을 실제 주소로 변경하고 다시 배포한다.

## 7. 글 발행

`content/` 아래 Markdown을 추가하거나 수정한 뒤 `main`에 반영한다. GitHub Actions가 정적 파일을 다시 만들고 자동 배포한다.

```bash
npm run build
npm run test:static
git add content
git commit -m "새 글 추가"
git push origin main
```

## 8. 비용 가드레일

- Static Web Apps가 반드시 `Free` 플랜인지 확인한다.
- Azure Functions, Front Door, VM, 관리형 DB, Static Web Apps Standard 플랜은 만들지 않는다.
- Azure Cost Management에서 월 예산 알림을 낮은 금액으로 설정한다.
- 도메인을 구매하지 않으면 Azure 기본 주소와 자동 SSL을 그대로 사용한다.
