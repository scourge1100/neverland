---
title: "Neverland — 포트폴리오형 개인 블로그"
collection: "Portfolio"
type: "project"
slug: "neverland"
summary: "Markdown의 단순한 기록 방식과 독립적인 블로그·포트폴리오 화면을 결합한 개인 아카이브."
category: "Personal Project"
featured: "true"
publishedAt: "2026-07-15T13:55:13.109Z"
updatedAt: "2026-07-15T14:28:37.896Z"
role: "기획 · 설계 · 구축"
period: "2026 — Present"
tags:
  - markdown
  - nodejs
  - azure-static-web-apps
  - portfolio
---

# Neverland

## 배경

작업 결과만 나열하는 포트폴리오와 시간순으로 흘러가는 블로그를 따로 운영하지 않고, 실제 문제를 해결한 과정과 배운 점이 프로젝트 경험으로 이어지는 공간이 필요했다.

## 해결하려던 문제

- 글쓰기는 편해야 하지만 공개 화면은 개인적인 인상을 가져야 한다.
- 작업 기록과 대표 프로젝트가 서로 분리되지 않아야 한다.
- 글이 쌓여도 태그, 연도, 검색으로 다시 찾을 수 있어야 한다.
- 개인 서버에서도 백업하고 이전할 수 있어야 한다.

## 접근 방식

Markdown 파일을 콘텐츠 원본으로 사용하고, 빌드 시 글·프로젝트·검색 데이터와 SEO 파일을 정적 결과물로 생성한다. GitHub에 변경사항을 올리면 Azure Static Web Apps가 자동 배포하므로 상시 운영 서버가 필요 없다.

## 구현 내용

- Markdown frontmatter 기반 콘텐츠 관리
- Node.js 정적 사이트 생성기와 GitHub 자동 배포
- 포트폴리오형 반응형 블로그 홈
- 글과 프로젝트 목록·상세 정적 생성
- 카테고리, 태그, 연도 아카이브와 통합 검색
- RSS, sitemap, robots와 기본 SEO 메타데이터
- 서버와 데이터베이스가 없는 무료 호스팅 구조

## 기술

- Markdown
- Node.js
- GitHub Actions
- Azure Static Web Apps

## 다음 단계

- 실제 프로필과 대표 프로젝트 확장
- GitHub 활동 연동
- 운영 도메인과 소셜 공유 이미지 개선
- Markdown 작성 템플릿과 미리보기 개선
