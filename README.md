# Neverland

만든 것과 배운 것을 함께 기록하는 블로그·포트폴리오입니다. Outline에서 글을 편집하거나 Markdown 파일을 업로드하면 같은 주소의 공개 포트폴리오 화면에 반영됩니다. Mermaid 다이어그램도 Markdown 안에서 바로 렌더링됩니다.

- 주 운영 주소: [https://neverland.40.82.146.87.sslip.io](https://neverland.40.82.146.87.sslip.io)
- 정적 백업 주소: [https://wonderful-cliff-01d049c00.7.azurestaticapps.net](https://wonderful-cliff-01d049c00.7.azurestaticapps.net)

## 현재 운영 구조

- Outline: 외부에서 접속하는 비공개 작성·편집 화면
- 동적 블로그: Outline의 공개 대상 문서를 포트폴리오 UI로 제공
- `content/`: Codex와 Git으로 관리하는 Markdown 원본 및 정적 백업 원본
- `scripts/build-static.mjs`: 목록·상세·검색 데이터·RSS·사이트맵 생성
- `scripts/upload-outline.mjs`: Markdown을 Outline에 생성하거나 같은 제목의 문서를 갱신
- `scripts/blog-server.mjs`: Outline 문서를 공개 블로그 화면으로 변환
- `config/site/`: 홈 화면과 공통 CSS·클라이언트 스크립트
- `docker-compose.remote.yml`: 기존 Azure VM에 격리 배포하는 운영 오버라이드
- `.github/workflows/azure-static-web-apps.yml`: `main` 기반 정적 백업 자동 배포

주 운영 환경은 이미 사용 중인 Azure VM을 재사용하고 `sslip.io`와 Let’s Encrypt를 사용하므로 추가 리소스·도메인·인증서 비용이 없습니다. 정적 백업은 Azure Static Web Apps 무료 플랜에 유지됩니다.

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

작성 후 Outline에 바로 발행하려면 다음 명령을 사용합니다. 운영 API 키는 `.env`에만 보관하며 Git에는 올리지 않습니다.

```bash
OUTLINE_BASE_URL=https://neverland.40.82.146.87.sslip.io \
  npm run outline:upload -- content/worklog/my-document.md
```

같은 제목의 문서가 있으면 갱신하고, 없으면 새 문서를 만듭니다. Outline에서 직접 수정한 내용도 webhook으로 공개 블로그 캐시가 즉시 갱신됩니다. 자세한 운영 방법은 [외부 Outline 운영 가이드](docs/remote-outline.md)를 참고합니다.

GitHub의 `main` 브랜치에 반영하면 빌드 검사 후 정적 백업 주소에도 자동 배포됩니다.

## 공개 기능

- 포트폴리오형 반응형 홈
- 글·프로젝트 목록과 상세
- 카테고리, 태그, 연도 아카이브
- 브라우저 기반 통합 검색
- 빌드 시점 GitHub 공개 저장소 정보
- RSS, sitemap, robots와 문서별 SEO 메타데이터
- Mermaid 다이어그램 렌더링
- 무료 DNS 주소, HTTPS와 인증서 자동 갱신

## Azure 무료 배포

Azure 리소스 생성과 GitHub Secret·Variable 설정은 [docs/azure-deploy.md](docs/azure-deploy.md)를 따릅니다.

## 로컬 Outline 환경

운영 이전 데이터 확인이나 로컬 테스트가 필요할 때 Docker Compose 명령을 사용합니다.

```bash
npm run outline:up
npm run outline:down
```

운영 글은 Outline과 `content/` Markdown 중 편한 쪽에서 작성할 수 있습니다. 장기간 보관하거나 코드 리뷰가 필요한 문서는 Markdown도 함께 커밋하는 방식을 권장합니다.
