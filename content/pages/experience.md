---
title: "프로젝트로 쌓아온 경험"
collection: "Portfolio"
type: "page"
slug: "experience"
summary: "공항 설비 연동, 게임 운영툴, 반도체 품질 시스템, 건설 프로젝트 관리 시스템까지. 회사별로 맡았던 일과 연결된 프로젝트 문서를 모았습니다."
category: "Experience"
publishedAt: "2026-07-15T14:12:57.715Z"
updatedAt: "2026-10-13T00:00:00.000Z"
tags:
  - backend
  - career
  - operations
---

# Experience

Java와 Spring 기반 백엔드 개발을 중심으로 일해 왔습니다. 아래는 최근 경력부터 회사별로 맡았던 일이고, 프로젝트 문서가 있는 것은 링크로 이어 두었습니다.

## 채움솔루션 · 2025.10 — 2026.02

프로젝트 단위 계약으로 GS건설 프로젝트 관리 시스템(PMX) 신규 구축에 참여했습니다. Java와 Spring 기반 백엔드 API 개발과 기존 시스템 분석, Oracle DB 기반의 조회·처리 로직 개발, 현업 요구사항 반영을 맡았습니다.

- [GS건설 프로젝트 관리 시스템 구축](/projects/gs-engineering-pmx): 프로시저 중심의 MSSQL 솔루션을 Oracle PL/SQL로 전환하고 iFrame 통합 구조에 연동

## 시그네틱스 · 2023.01 — 2025.04

반도체 제조사 IT팀에서 Java 기반 웹 시스템을 개발하고 유지보수했습니다. Oracle 기반의 대규모 데이터 처리와 분석 시스템 구축이 주된 업무였고, 고객사의 요청을 분석해 개발 방향을 제시했습니다.

- [MRB(자재) 품질이슈 관리 시스템](/projects/mrb-issue-system): 자재 이슈와 회의록을 케이스 단위로 추적, 코드별 시각화 (2023.05 — 2023.10)
- [OCAP 품질 이상 대응 시스템](/projects/ocap-system): 공정 이상 데이터의 대시보드와 일일 자동 메일 리포트 (2023.11 — 2024.04)
- [손상차손 시스템](/projects/asset-impairment-system): 손상차손 반영과 감가 재계산 자동화 (2024.02 — 2025.04)
- [CoA 데이터 수집·검증 시스템](/projects/coa-quality-system): 공급업체 품질 데이터의 SFTP 수집과 검증, 승인 (2024.05 — 2024.12)
- [RFQ 전산화](/projects/rfq-foundation): 레거시 대신 Java 17과 Spring Boot로 새로 세운 기반 (2024.12 — 2025.04)

## 로그웨이브 · 2021.11 — 2022.11

AWS 3계층 아키텍처 위에서 전자정부프레임워크 기반의 웹 운영툴을 구축했습니다. AWS Java SDK로 AWS 서비스 기능을 구현했고, 게임 출시 후에는 유지보수와 신규 기능 개발, 시스템 모니터링, 장애 대응을 맡았습니다.

- [열혈강호 W 운영툴](/projects/yeolhyeolgangho-admin-tool): 게임 운영 데이터 관리와 아이템 지급 등 운영 기능
- [운영툴에서 게임 서버로 텍스트를 안전하게 전달하기](/writing/encrypted-text-delivery-s3): S3와 암호화로 전달한 작은 기능의 기록

## 이노트리 · 2019.12 — 2021.10

과제사업 위주의 기획과 운영 업무를 했습니다. 고객의 Needs를 분석하고 제안해 결과를 도출한 뒤 기획 업무를 진행했습니다.

- 경찰청 디지털 포렌식 블록체인 시스템 구축 (2020.04 — 2020.07): 과제사업 앱 기획, 고객사 Needs 파악과 설계
- S전자 앱스 운영 (2021.02 — 2021.10): 애플리케이션 관리, 시스템 모니터링과 오류 대응, 고객사 시스템의 버전 관리 등 문제점 대응 (SQL, Jenkins)

## 바즐시스템 · 2018.11 — 2019.10

한국공항공사 프로젝트를 중심으로 항공사 시스템 연동 관리와 구축된 설비의 운영 업무를 했고, 외국 협력업체와의 커뮤니케이션에서 동시통역을 맡았습니다.

- [김포공항 국제선 SBD 구축](/projects/gimpo-sbd): 항공사 DCS 연동 조율, 해외 제조사 기술 통역, 구축 후 장비 운영

## 개인 프로젝트

- [Umpire — 심판 배정·정산 플랫폼](/projects/umpire-platform): 기획부터 앱, 서버, 인증, 배포, 운영까지 혼자 만든 서비스. 앱은 [Umpire Mobile](/projects/umpire-mobile), 공통 백엔드는 [Empire Core Platform](/projects/empire-core-platform)에 따로 정리했습니다.
- [야구 매니지먼트 게임](/projects/baseball-management-game): 확률 시뮬레이션 엔진부터 멀티플레이 월드까지 만들고 있는 개인 프로젝트
- [Neverland](/projects/neverland): 지금 보고 있는 이 사이트
- [RealMan Tailor](/projects/realman-tailor): 테일러샵 예약 서비스 팀 프로젝트

## 일할 때 지키는 원칙

- 실제 코드, 데이터, 로그와 실행 결과를 기준으로 판단한다.
- 서비스 경계와 변경의 영향을 먼저 확인한다.
- 실패를 관찰할 수 있도록 로그와 진단 정보를 남긴다.
- 배포 성공이 아니라 실제 사용 가능한 상태까지 검증한다.
