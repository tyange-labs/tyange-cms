# tyange-cms (CMS 프론트엔드)

Nuxt 4 + Vue 3. bun 사용.
`npm`, `yarn`, `pnpm` 명령어 사용 금지.

## 기술 스택

- Nuxt 4 (4.5.2)
- Vue 3
- bun
- UI: `@nuxt/ui` 없음. `app/components/ui/*`에 직접 만든 컴포넌트(`Ui*` 접두사로 자동 임포트). Select/TagsCombobox/DateInput만 `reka-ui` 프리미티브 사용, 나머지는 순수 Tailwind
- 아이콘: `lucide-vue-next` 컴포넌트를 직접 import해서 씀 (`icon="i-lucide-x"` 같은 문자열 방식 아님)
- Lint/Format: `oxlint` + `oxfmt` (ESLint/Prettier 아님). `bun run lint`, `bun run format`

## 연결 프로젝트

- 백엔드: `tyange-cms-api` (Rust + Poem)
- API 변경 시 반드시 tyange-cms와 동기화 필요

## 하객 명단 (`/wedding-guests`)

lovelog 청첩장 RSVP를 보는 관리자 페이지. `server/api/wedding-guests/index.ts`가
Authorization 헤더를 그대로 실어 cms-api의 `GET /admin/wedding/guests`로 넘긴다.

- `visit_hour`는 한 시간짜리 방문 시간대의 **시작 시각(24시간제)** 이다. 전시가 12시에 열고
  5시에 닫으므로 12~16이 유효 범위다. 페이지 상단의 `VISIT_HOURS`, lovelog의 `lib/rsvp.ts`,
  cms-api의 `create_wedding_guest.rs`가 같은 범위를 각자 들고 있으니
  **전시 시간이 바뀌면 세 곳을 함께 고친다.**
- 시간대를 받기 전에 접수된 하객은 `visit_hour`가 null이고 "시간 미정"으로 보여준다.
- `created_at`은 SQLite `CURRENT_TIMESTAMP`라 **UTC**다. 그대로 찍으면 9시간이 어긋나므로
  `Z`를 붙여 읽은 뒤 `Asia/Seoul`로 옮겨 표시한다.
- 시간대별 집계는 데이터에 없는 칸도 0으로 보여준다. 비어 있는 시간대가 보여야 쓸모가 있다.

## 로그인

**ID / 비밀번호 하나뿐이다.** Google 로그인은 걷어냈다 — 화면, `/api/login/google` 프록시,
`googleClientId` 런타임 설정, 배포 워크플로의 `NUXT_PUBLIC_GOOGLE_CLIENT_ID` 주입까지 전부.
`tyange-cms-api` 쪽 `POST /login/google`은 아직 살아 있지만 CMS는 더 이상 호출하지 않는다.

### 로컬 개발용 로그인 우회

`tyange-cms-api`를 안 띄우고도 로그인 화면을 통과하고 싶으면 ID에 `dev`를 입력한다
(비밀번호는 아무거나). `server/api/login/index.post.ts`가 `import.meta.dev`일 때만
이 값을 가로채서 실제 백엔드를 호출하지 않고 관리자 세션(가짜 토큰)을 즉시 발급한다.
`import.meta.dev`는 빌드 타임 상수라 프로덕션 빌드에는 이 분기 자체가 트리쉐이킹돼서 안 들어간다
(`bun run build` 결과물에서 확인함). 로그인 화면(`LoginForm.vue`)은 전혀 안 건드렸다 — 우회
로직은 서버 라우트 한 곳에만 있다.

주의: 발급되는 토큰이 가짜라서 이후 `authenticatedFetch`로 나가는 실제 API 호출(포스트 목록,
포트폴리오 등)은 백엔드가 없으면 당연히 실패한다. 로그인 화면 너머의 레이아웃/컴포넌트를 빠르게
확인할 때 쓰는 용도고, 데이터까지 필요하면 `tyange-cms-api`를 직접 띄우거나 e2e 테스트처럼
`auth` 쿠키를 직접 주입하는 방식을 쓴다.

## 현재 상태

- 운영 중
- 하객 명단 페이지 추가 (lovelog RSVP 조회)
- Google 로그인 제거, ID/비밀번호 로그인만 사용
- 포트폴리오 편집은 섹션별 저장(`PUT /portfolio/sections/:section_key`, 섹션 키: meta / identity / intro / featured_projects / career) 사용, 최초 생성만 전체 문서 PUT
- API에서 가계부/1:1 매칭/RSS/API Key 인증 제거됨 — CMS는 포스트/포트폴리오/태그/이미지 운영에 집중
- `@nuxt/ui` 제거하고 Reka UI 기반 자체 컴포넌트로 전면 교체, Nuxt 4.5.2로 업그레이드 (2026-09)
- ESLint(`@antfu/eslint-config`) 제거, `oxlint`/`oxfmt`로 전환 (2026-09)
- CI를 GitHub Actions에서 Forgejo Actions로 전환 (2026-09) — `.github/workflows` 삭제,
  `.forgejo/workflows/deploy.yml`로 이전. `uses:`는 전부 `https://github.com/...` 완전한
  URL로 써야 함(`data.forgejo.org` 기본 레지스트리엔 `oven-sh/setup-bun` 같은 서드파티
  액션이 없음). `runs-on: self-hosted`는 `tyange-labs` 조직 스코프 러너 중 Docker 격리
  없는 host 라벨을 가리킴(tyange-dev와 동일 패턴). **Forgejo 쪽 secrets/vars는 자동으로
  안 넘어와서 웹 UI에서 다시 등록해야 하고, 저장소 Settings → Units → Overview에서
  Actions 체크박스도 켜야 워크플로가 인식된다** — 둘 다 아직 확인 안 함

## UI 컴포넌트 (`app/components/ui/`)

`@nuxt/ui`가 `reka-ui`를 내부적으로 고정 버전 물고 있어서 직접 추가하면 버전이 갈릴 위험이 있었다.
그래서 `@nuxt/ui`를 걷어내고 지금 쓰는 props만 지원하는 얇은 컴포넌트 세트를 직접 만들었다.

- Select / TagsCombobox / DateInput만 `reka-ui` 프리미티브 사용. 나머지(Button/Alert/Badge/Card/
  EmptyState/FormField/Input/Textarea/Skeleton/Main/Header/NavMenu)는 순수 Tailwind — 헤드리스 동작이
  필요 없는 표현용 컴포넌트라서.
- 시맨틱 토큰(`text-muted`, `bg-elevated`, `border-default`, `bg-primary`, `--header-height`)은
  `app/assets/css/main.css`의 `@theme`에서 직접 정의한다. Nuxt UI 기본 팔레트(primary=green,
  neutral=slate)의 라이트 모드 매핑과 동일하게 맞췄다 — 다크모드는 앱 어디서도 안 써서 라이트 하나만 있다.
- 아이콘은 `lucide-vue-next` 컴포넌트를 직접 import해서 `icon` prop에 넘긴다
  (`:icon="Trash"`, 문자열 아님). `Code2`/`Loader2`는 이 패키지에 없다 — 각각 `CodeXml`/`LoaderCircle` 사용.
- `TagsCombobox`(옛 `UInputMenu` 대체)는 Reka의 `resetSearchTermOnSelect`(기본 true) 덕분에 선택/생성 후
  검색어가 자동으로 비워진다. 예전엔 이게 안 돼서 `Editor.client.vue`가 DOM을 직접 만지는 우회 코드를
  갖고 있었는데 제거했다.
- `nuxt.config.ts`의 `nitro.externals.inline: ['vue']`는 이 작업 중 발견한 별개 버그를 우회하기 위한
  설정이다: Bun으로 설치한 상태에서 `@nuxt/ui`를 빼면 `@nuxt/test-utils`의 "test" Nitro 프리셋이
  `vue/index.mjs`를 못 찾고 500을 낸다 (Nuxt 버전과 무관하게 재현됨 — 4.3.1에서도 동일). 프로덕션 빌드
  (`node-server` 프리셋)와 `bun run dev`는 애초에 문제없었다. 이 설정을 지우면 `bun run test:e2e`가
  다시 깨진다.

## Lint / Format (oxlint / oxfmt)

ESLint(`@antfu/eslint-config` + `eslint-plugin-format`) 대신 Rust 기반 `oxlint`/`oxfmt`를 쓴다.

- `.oxlintrc.json`: `correctness` 카테고리만 켠 최소 구성. `typescript`/`unicorn`/`oxc`는 기본,
  `vue` 플러그인을 추가로 켰다. `suspicious` 카테고리는 켜지 않았다 — `no-shadow`(catch의 `error`
  섀도잉)나 `no-underscore-dangle`(`_data` 같은 의도적 미사용 변수명) 같은 이 코드베이스의 기존
  관례를 전부 새 에러로 잡아내서 노이즈가 컸다.
- `.oxfmtrc.json`: `semi: false`, `singleQuote: true`, `trailingComma: "all"` — 기존 antfu 스타일과
  맞춤. `.vue` 파일도 포맷 대상이다. `ignorePatterns`로 `.forgejo/**`(CI 워크플로 옮긴 뒤로
  경로 변경, 예전엔 `.github/**`), `.vscode/**`는 제외했다 —
  oxfmt는 YAML/JSONC도 공식 지원 언어라 버그가 아니라 의도된 동작이지만(실제로 워크플로 yml의
  따옴표 스타일까지 바꿔버림), CI 워크플로나 에디터 설정까지 자동 포맷 대상에 넣는 건 원치 않아서
  명시적으로 뺐다.
- oxfmt는 Prettier 계열이라 `printWidth`(기본 80)에 맞으면 여러 줄로 풀어 쓰던 걸 한 줄로 접는다.
  기존 eslint-plugin-vue 스타일(속성 여러 개면 항상 줄바꿈)보다 훨씬 공격적으로 접히니, 큰 diff가
  한 번 발생하는 걸 감안하고 전체 레포를 한 번에 재포맷했다(2026-09).
- VS Code는 `oxc.oxc-vscode` 확장 하나로 oxlint(린트)+oxfmt(포맷)를 전부 처리한다
  (`.vscode/settings.json`의 `oxc.enable: true`, `editor.defaultFormatter`). 확장은
  `.vscode/extensions.json`에 추천 목록으로 등록해뒀다. `.oxlintrc.json`/`.oxfmtrc.json`은
  프로젝트 루트에 있으면 확장이 알아서 찾는다 — 별도 `oxc.configPath` 설정 불필요.
- Nuxt 자동 임포트(`ref`, `useRoute`, `useAuthStore` 등)는 별도 globals 설정 없이도 oxlint가
  `no-undef` 류로 잡지 않는다 — ESLint와 달리 TS 파일에서 전역 미선언 변수를 별도로 체크하지 않기
  때문. `@nuxt/eslint`가 만들어주던 auto-import globals 목록(`.nuxt/eslint.config.mjs`)은 이제
  필요 없다.
