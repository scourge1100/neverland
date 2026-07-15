# Neverland

만든 것과 배운 것을 함께 기록하는 정적 블로그·포트폴리오입니다. Markdown을 원본으로 사용하고 Azure Static Web Apps 무료 플랜에 배포할 수 있도록 구성되어 있습니다.

운영 주소: [https://wonderful-cliff-01d049c00.7.azurestaticapps.net](https://wonderful-cliff-01d049c00.7.azurestaticapps.net)

## 현재 운영 구조

- `content/`: 글, 프로젝트, 소개 페이지의 Markdown 원본
- `scripts/build-static.mjs`: 목록·상세·검색 데이터·RSS·사이트맵 생성
- `config/site/`: 홈 화면과 공통 CSS·클라이언트 스크립트
- `dist/`: 빌드 결과물, 저장소에는 포함하지 않음
- `.github/workflows/azure-static-web-apps.yml`: GitHub 기반 자동 배포
- `staticwebapp.config.json`: Azure 라우팅, 404와 보안 헤더

Outline, PostgreSQL, Redis, Dex와 상시 실행 VM은 공개 사이트 운영에 필요하지 않습니다. 기존 Docker Compose 환경은 콘텐츠 이전 확인이나 로컬 참고 용도로만 남겨 두었습니다.

## 로컬 빌드와 미리보기

```bash
npm run build
npm run test:static
npm run preview
```

브라우저에서 `http://localhost:4173`을 엽니다.

이 Mac처럼 `npm`이 PATH에 없을 때는 번들 Node로 직접 실행할 수 있습니다.

```bash
NODE=/Users/peterlee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
SITE_URL=http://localhost:4173 "$NODE" scripts/build-static.mjs
"$NODE" scripts/check-static.mjs
"$NODE" scripts/serve-static.mjs dist
```

실제 도메인의 canonical, RSS와 sitemap URL까지 확인하려면 다음처럼 빌드합니다.

```bash
SITE_URL=https://your-domain.example npm run build
```

## 글 작성

`content/worklog/`에 Markdown 파일을 추가합니다.

```yaml
---
title: "문서 제목"
type: "writing"
slug: "stable-url"
summary: "목록과 검색 결과에 표시할 설명"
category: "Engineering"
featured: "false"
publishedAt: "2026-07-15T00:00:00.000Z"
tags:
  - azure
  - portfolio
---

# 문서 제목

본문을 작성합니다.
```

지원하는 콘텐츠 유형은 다음과 같습니다.

- `writing`: `/writing/{slug}`
- `project`: `/projects/{slug}`
- `page`: `/{slug}`

GitHub의 `main` 브랜치에 반영하면 빌드 검사 후 Azure Static Web Apps로 자동 배포됩니다.

## 공개 기능

- 포트폴리오형 반응형 홈
- 글·프로젝트 목록과 상세
- 카테고리, 태그, 연도 아카이브
- 브라우저 기반 통합 검색
- 빌드 시점 GitHub 공개 저장소 정보
- RSS, sitemap, robots와 문서별 SEO 메타데이터
- 사용자 도메인과 Azure 자동 SSL

## Azure 무료 배포

Azure 리소스 생성과 GitHub Secret·Variable 설정은 [docs/azure-deploy.md](docs/azure-deploy.md)를 따릅니다.

## 선택적 레거시 Outline 환경

기존 Outline 환경을 로컬에서 참고해야 할 때만 Docker Compose 명령을 사용합니다.

```bash
npm run outline:up
npm run outline:down
```

정적 사이트의 콘텐츠 원본은 Outline DB가 아니라 `content/` 아래 Markdown 파일입니다.
