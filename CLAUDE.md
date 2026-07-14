# tyange-cms (CMS 프론트엔드)

Nuxt 4 + Vue 3. bun 사용.
`npm`, `yarn`, `pnpm` 명령어 사용 금지.

## 기술 스택
- Nuxt 4
- Vue 3
- bun

## 연결 프로젝트
- 백엔드: `tyange-cms-api` (Rust + Poem)
- API 변경 시 반드시 tyange-cms와 동기화 필요

## 현재 상태
- 운영 중
- 포트폴리오 편집은 섹션별 저장(`PUT /portfolio/sections/:section_key`, 섹션 키: meta / identity / intro / featured_projects / career) 사용, 최초 생성만 전체 문서 PUT
- API에서 가계부/1:1 매칭/RSS/API Key 인증 제거됨 — CMS는 포스트/포트폴리오/태그/이미지 운영에 집중
