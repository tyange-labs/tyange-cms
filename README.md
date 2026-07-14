# tyange-cms

`tyange-cms`는 `tyange-cms-api`와 함께 동작하는 내부 운영용 CMS 클라이언트 웹 앱입니다.
현재는 범용 CMS 솔루션이 아니라, **tyange 운영 흐름에 맞춘 전용 UI**를 목표로 합니다.

## 프로젝트 목적

- 콘텐츠(포스트) 운영 작업을 웹에서 빠르게 처리
- 포트폴리오 데이터(소개/경력/프로젝트 목록)를 섹션 단위로 편집
- `tyange-cms-api`의 관리자 기능을 브라우저에서 사용 가능하도록 제공

## 현재 제공 기능

- 관리자 로그인 (로컬 비밀번호 + Google OAuth)
- 블로그 포스트 목록 조회/등록/수정/삭제
- 마크다운 / 리치 텍스트 이중 에디터 (포스트 성격별 선택)
- 포스트 이미지 업로드 (클라이언트 압축 + 서버 업로드)
- 태그/카테고리 데이터 조회 및 필터링
- **포트폴리오 편집 UI** (Basic / Contact / Intro / Featured Projects / Career 섹션별 개별 저장)

## 기술 스택

- Runtime / Package Manager: **Bun**
- Framework: **Nuxt 4** (Vue 3, TypeScript)
- UI: `@nuxt/ui` 4 (Headless UI 기반), Tailwind CSS 4
- State: Pinia (+ `pinia-plugin-persistedstate`)
- Editor: `md-editor-v3` (마크다운) + `nuxt-tiptap-editor` (리치 텍스트)
- 이미지 처리: `browser-image-compression`
- 아이콘: `lucide-vue-next`
- E2E 테스트: Playwright

## 환경 변수 예시

`.env.local`

```env
NUXT_PUBLIC_TYANGE_CMS_API_BASE=https://api.example.com
NUXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## 개발

```bash
bun install
bun --bun run dev
```

## 테스트

```bash
bun --bun run test:e2e
```

Playwright 기반 E2E 테스트가 `tests/` 디렉터리에 정의되어 있습니다.

## 주요 설계 결정

- **Nuxt 4 + `@nuxt/ui` 4 + Tailwind 4 마이그레이션**: 2026-02 Vue 생태계의 최신 라인업으로 일괄 상향 — 세 가지가 서로 전제로 삼는 변경이라 한 번에 처리했다.
- **에디터 이중화**: 기술 글은 마크다운 원문이 중요하고(`md-editor-v3`), 포트폴리오·공지성 글은 WYSIWYG이 편해서 리치 텍스트(`nuxt-tiptap-editor`)도 둔다.
- **Bun 런타임**: 설치 속도와 lockfile 일관성 확보 목적. Nuxt 4는 `bun --bun run ...` 으로 실행.
- **인증 저장 구조**: Pinia 스토어 + `pinia-plugin-persistedstate`로 JWT/Google 토큰을 localStorage에 영속, 페이지 리로드 시 상태 복원.
- **포트폴리오 섹션별 저장**: 한 번에 전체 문서를 PUT하는 방식에서, 섹션 키(`meta` / `identity` / `intro` / `featured_projects` / `career`)별 개별 업데이트(`PUT /portfolio/sections/:section_key`)로 전환 → 동시 편집 충돌 면적 축소 + 저장 크기 감소. 최초 생성 시에만 전체 문서 PUT을 사용.
- **API 기능 축소 동기화**: `tyange-cms-api`에서 가계부(예산/소비), 1:1 매칭/메시지, RSS, API Key 인증이 제거됨에 따라 CMS도 포스트/포트폴리오/태그/이미지 운영에 집중.
