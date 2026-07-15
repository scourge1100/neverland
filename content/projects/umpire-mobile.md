---
title: "Umpire Mobile"
collection: "Portfolio"
type: "project"
slug: "umpire-mobile"
summary: "심판의 가능 일정부터 배정, 공지, 경기 결과 보고와 정산 확인까지 하나의 흐름으로 연결한 React Native 앱."
category: "Mobile Service"
featured: "true"
publishedAt: "2026-07-15T14:13:01.343Z"
updatedAt: "2026-07-15T14:13:01.325Z"
role: "서비스 설계 · 모바일 개발 · API 연동 · 배포"
period: "2025 — Present"
tags:
  - react-native
  - expo
  - typescript
  - push-notification
---

# Umpire Mobile

## 배경

심판 배정 업무에는 가능 일정 수집, 주간 경기 배정, 공지 전달, 읽음 확인, 결과 보고와 월별 정산 확인이 이어진다. 각각을 별도로 처리하면 운영자는 진행 상태를 파악하기 어렵고 심판은 필요한 정보를 여러 곳에서 확인해야 한다.

## 목표

심판과 운영자의 역할에 맞는 업무를 모바일에서 한 흐름으로 제공하고, 공지와 배정 변경을 푸시 알림으로 전달한다.

## 구현 내용

- JWT 로그인과 AsyncStorage 기반 세션 유지
- 카카오 가입과 기존 인증 플랫폼 연동
- 가능 일정 등록과 주간·전체 배정 확인
- 국장·차장·총무 역할별 배정 및 회원 관리
- 공지 목록·상세·작성과 읽음 처리
- 경기 결과 보고 작성과 상태 확인
- 개인 정산 정보, 정산 이력과 월별 취합 확인
- Expo Notifications와 웹 푸시 등록·재등록·진단
- Android APK와 EAS Update production 채널 운영

## 해결한 문제

### 푸시 등록 실패를 추적할 수 없는 문제

알림 권한, Android 채널, EAS project ID, Expo 토큰 발급과 서버 저장 단계를 각각 기록하도록 진단 흐름을 구성했다. 진단 기록 실패가 실제 앱 사용을 막지 않도록 주 흐름과도 분리했다.

### 역할별 업무가 한 화면에 섞이는 문제

일반 심판은 자신의 배정과 정산을 중심으로 보고, 운영 역할은 배정 후보 선택, 공지와 회원 관리로 바로 이동할 수 있도록 역할별 탐색 흐름을 나눴다.

### 앱 업데이트 전달 문제

네이티브 변경은 새 APK로, JavaScript와 asset 변경은 EAS Update production 채널로 전달하도록 배포 경계를 문서화하고 자동화했다.

## 기술

- React Native / Expo
- TypeScript / React Navigation
- Expo Notifications / EAS Update
- AsyncStorage
- Android / Web
- Spring Boot API

## 현재 상태

로그인, 배정, 공지, 결과 보고, 정산, 푸시와 역할별 운영 화면이 연결되어 있으며 Android 배포 흐름을 함께 운영하고 있다.
