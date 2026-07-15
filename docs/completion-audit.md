# Neverland 정적 전환 감사

감사일: 2026-07-15

## 목표 대비 증거

| 요구사항 | 구현 | 검증 증거 | 결과 |
|---|---|---|---|
| 포트폴리오형 블로그 홈 | `config/site/index.html`, `styles.css` | 정적 홈 생성과 내부 링크 검사 | 완료 |
| 글 목록·상세 | `/writing`, `/writing/:slug` | Markdown 1개 글의 목록·상세 HTTP 200 | 완료 |
| 프로젝트 포트폴리오 | `/projects`, `/projects/:slug` | 4개 case study 정적 생성 | 완료 |
| 경력·소개 | `/experience`, `/about` | Markdown page 2개 정적 생성 | 완료 |
| 카테고리·태그·연도 | 빌드 시 각 경로 생성 | 모든 생성 HTML 내부 링크 검사 | 완료 |
| 통합 검색 | `/search`, `search.js`, 정적 JSON | 쿼리 URL과 검색 데이터 HTTP 200 | 완료 |
| RSS·SEO | RSS, sitemap, robots, canonical, OG | 운영 URL 기준 파일 생성 확인 | 완료 |
| GitHub 활동 | 빌드 시 공개 API snapshot | `scourge1100`과 공개 저장소 3개 포함 | 완료 |
| 정적 호스팅 설정 | `staticwebapp.config.json` | 404, MIME, 보안 헤더 설정 포함 | 완료 |
| GitHub 자동 배포 | `.github/workflows/azure-static-web-apps.yml` | build → test → deploy 순서 구성 | 완료 |
| 서버 의존성 제거 | Markdown → `dist/` 빌드 | 공개 결과물에 OIDC·Outline API 참조 없음 | 완료 |

## 생성 콘텐츠

`content/`의 Markdown 7개를 원본으로 사용한다.

- Writing: 1개
- Projects: 4개
- Pages: 2개

빌드는 글·프로젝트·페이지 외에도 카테고리, 태그, 연도, 검색 데이터, RSS, sitemap, robots와 404를 생성한다.

## 검증 결과

- 정적 빌드: 통과
- 필수 결과물 13개 검사: 통과
- 전체 HTML 내부 링크 검사: 통과
- 홈, 글, 프로젝트, 카테고리, 검색, RSS, sitemap: HTTP 200
- 존재하지 않는 경로: HTTP 404
- 프로덕션 빌드의 canonical·RSS·sitemap URL: `SITE_URL` 반영 확인

## 운영 비용 구조

공개 사이트에는 Outline, PostgreSQL, Redis, Dex, Caddy, VM과 고정 IP가 필요하지 않다. Azure Static Web Apps Free 플랜과 기본 `azurestaticapps.net` 주소를 사용하면 월 고정비 없이 운영할 수 있다.

실제 Azure 배포에는 다음 외부 설정만 남아 있다.

1. GitHub 저장소 생성과 `main` push
2. Azure Static Web Apps Free 리소스 생성
3. 배포 토큰 Secret과 `SITE_URL` Variable 등록

기존 Docker Compose 환경은 정적 전환 이전 기능의 로컬 참고용이며 공개 운영 경로에는 포함되지 않는다.
