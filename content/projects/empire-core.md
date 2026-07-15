---
title: "Empire Core Platform"
collection: "Portfolio"
type: "project"
slug: "empire-core-platform"
summary: "여러 서비스가 반복해서 필요로 하는 인증, 권한, 메뉴, 설정과 운영 추적 기능을 제공하는 공통 백엔드 플랫폼."
category: "Backend Platform"
featured: "true"
publishedAt: "2026-07-15T14:13:01.148Z"
updatedAt: "2026-07-15T14:13:01.140Z"
role: "백엔드 설계 · 개발 · 운영"
period: "2025 — Present"
tags:
  - spring-boot
  - postgresql
  - security
  - platform
---

# Empire Core Platform

## 배경

여러 서비스가 회원가입, 로그인, 권한, 메뉴, 설정과 감사 로그를 각각 구현하면 정책과 운영 기준이 분산된다. 신규 서비스를 만들 때도 같은 기반 기능을 반복해서 만들어야 한다.

## 목표

개별 서비스가 자신의 업무 도메인에 집중할 수 있도록 공통 인증과 운영 기능을 하나의 플랫폼으로 제공한다. 현재 Umpire가 첫 번째 통합 사례이며 RealMan과 이후 서비스가 같은 계약을 재사용할 수 있도록 설계했다.

## 담당한 일

- Spring Boot 기반 공통 플랫폼 구조와 패키지 책임 경계 정리
- 회원가입, 로그인, 로그아웃과 JWT 토큰 재발급 흐름
- 카카오·네이버 소셜 로그인과 기존 계정 연결
- 서비스 타입과 역할을 고려한 권한·메뉴 노출 제어
- 관리자 사용자, 상태, 권한, 설정과 콘텐츠 관리
- 변경 전후 상태를 추적하는 감사 로그
- PostgreSQL, JPA와 Flyway 기반 스키마 변경 관리
- GitHub Actions 기반 테스트·배포 흐름과 운영 문서

## 주요 의사결정

### 공통 플랫폼과 서비스 도메인의 분리

여러 서비스가 공유하는 개념은 `com.empire.core`에 두고 특정 서비스의 업무 규칙은 `com.empire.service.*` 영역에 둔다. 서비스 규모가 커지면 Umpire를 독립 배포 단위로 분리할 수 있도록 의존 방향을 `서비스 → Core`로 유지한다.

### ServiceType 기반 확장

같은 사용자 플랫폼을 공유하면서도 서비스별 메뉴, 설정과 역할 범위를 분리할 수 있도록 서비스 타입을 공통 모델에 반영했다.

### 운영 추적성

사용자 상태와 권한 변경, 삭제·복구 같은 관리자 작업은 감사 로그에 변경 전후 상태와 대상을 남겨 원인을 다시 확인할 수 있도록 했다.

## 기술

- Java 17 / Spring Boot 3
- Spring Security / JWT
- Spring Data JPA / Flyway
- PostgreSQL
- Thymeleaf
- Testcontainers
- Docker / GitHub Actions

## 결과

서비스마다 반복하던 회원·인증·권한·운영 기능을 공통 계약으로 제공하고, 사용자와 권한 정책을 한곳에서 관리할 수 있는 기반을 만들었다.
