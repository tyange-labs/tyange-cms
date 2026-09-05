# tyange-cms

`tyange-cms`는 `tyange-cms-api`와 함께 동작하는 내부 운영용 CMS 클라이언트 웹 앱입니다.
현재는 범용 CMS 솔루션이 아니라, **tyange 운영 흐름에 맞춘 전용 UI**를 목표로 합니다.

## 프로젝트 목적

- 콘텐츠(포스트) 운영 작업을 웹에서 빠르게 처리
- 포트폴리오 데이터(소개/경력/프로젝트 목록)를 섹션 단위로 편집
- `tyange-cms-api`의 관리자 기능을 브라우저에서 사용 가능하도록 제공

## 현재 제공 기능

- 관리자 로그인 (ID / 비밀번호)
- 블로그 포스트 목록 조회/등록/수정/삭제
- 마크다운 / 리치 텍스트 이중 에디터 (포스트 성격별 선택)
- 포스트 이미지 업로드 (클라이언트 압축 + 서버 업로드)
- 태그/카테고리 데이터 조회 및 필터링
- **포트폴리오 편집 UI** (Basic / Contact / Intro / Featured Projects / Career 섹션별 개별 저장)

## 기술 스택

- Runtime / Package Manager: **Bun**
- Framework: **Nuxt 4** (Vue 3, TypeScript)
- UI: `reka-ui` 위에 직접 만든 `app/components/ui/*` 컴포넌트 (Headless UI 아님 — [Reka UI](https://reka-ui.com)), Tailwind CSS 4
- State: Pinia (+ `pinia-plugin-persistedstate`)
- Editor: `md-editor-v3` (마크다운) + `nuxt-tiptap-editor` (리치 텍스트)
- 이미지 처리: `browser-image-compression`
- 아이콘: `lucide-vue-next`
- Lint / Format: `oxlint` / `oxfmt` (ESLint/Prettier 대체, Rust 기반)
- E2E 테스트: Playwright

## 환경 변수 예시

`.env.local`

```env
NUXT_PUBLIC_TYANGE_CMS_API_BASE=https://api.example.com
```

## 개발

```bash
bun install
bun --bun run dev
```

## Lint / Format

```bash
bun run lint      # oxlint
bun run format    # oxfmt (write)
```

## 테스트

```bash
bun --bun run test:e2e
```

Playwright 기반 E2E 테스트가 `tests/` 디렉터리에 정의되어 있습니다.

## 주요 설계 결정

- **Nuxt 4 + `@nuxt/ui` 4 + Tailwind 4 마이그레이션**: 2026-02 Vue 생태계의 최신 라인업으로 일괄 상향 — 세 가지가 서로 전제로 삼는 변경이라 한 번에 처리했다.
- **`@nuxt/ui` 제거, Reka UI 직접 사용** (2026-09): `@nuxt/ui`가 내부적으로 `reka-ui`를 고정 버전으로 물고 있어 Reka를 직접 쓰려면 사본이 둘로 갈릴 위험이 있었다. 그래서 `@nuxt/ui`를 걷어내고 `app/components/ui/`에 필요한 컴포넌트만 직접 얹었다 — Select/TagsCombobox/DateInput 3개만 Reka UI 프리미티브를 쓰고, 나머지(Button/Alert/Badge/Card 등)는 순수 Tailwind. 겸사겸사 Nuxt도 4.5.2로 올렸다. `nuxt.config.ts`의 `nitro.externals.inline: ['vue']`는 이 작업 중 발견한 별개 이슈(Bun + Nitro의 "test" 프리셋 조합에서 `@nuxt/ui` 제거 후 `vue/index.mjs`를 못 찾는 버그, Nuxt 버전과 무관하게 재현됨)를 우회하기 위한 설정이다.
- **에디터 이중화**: 기술 글은 마크다운 원문이 중요하고(`md-editor-v3`), 포트폴리오·공지성 글은 WYSIWYG이 편해서 리치 텍스트(`nuxt-tiptap-editor`)도 둔다.
- **Bun 런타임**: 설치 속도와 lockfile 일관성 확보 목적. Nuxt 4는 `bun --bun run ...` 으로 실행.
- **인증 저장 구조**: Pinia 스토어 + `pinia-plugin-persistedstate`로 JWT를 localStorage에 영속, 페이지 리로드 시 상태 복원.
- **포트폴리오 섹션별 저장**: 한 번에 전체 문서를 PUT하는 방식에서, 섹션 키(`meta` / `identity` / `intro` / `featured_projects` / `career`)별 개별 업데이트(`PUT /portfolio/sections/:section_key`)로 전환 → 동시 편집 충돌 면적 축소 + 저장 크기 감소. 최초 생성 시에만 전체 문서 PUT을 사용.
- **API 기능 축소 동기화**: `tyange-cms-api`에서 가계부(예산/소비), 1:1 매칭/메시지, RSS, API Key 인증이 제거됨에 따라 CMS도 포스트/포트폴리오/태그/이미지 운영에 집중.
- **ESLint/Prettier → oxlint/oxfmt 전환** (2026-09): `@antfu/eslint-config` + `eslint-plugin-format` 조합을 걷어내고 Rust 기반 oxlint/oxfmt로 교체. `.oxlintrc.json`은 `correctness` 카테고리만 켠 최소 구성(typescript/unicorn/oxc/vue 플러그인), `.oxfmtrc.json`은 기존 스타일(세미콜론 없음, 싱글 쿼트, 항상 trailing comma)을 유지하도록 맞췄다. 전체 레포를 한 번에 재포맷했다 — Prettier 계열이라 `printWidth`에 맞으면 여러 줄이던 걸 한 줄로 접는 등 이전 eslint-plugin-vue 스타일과 diff가 크다.
