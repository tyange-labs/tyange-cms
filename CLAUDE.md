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

## 현재 상태
- 운영 중
- 하객 명단 페이지 추가 (lovelog RSVP 조회)
- Google 로그인 제거, ID/비밀번호 로그인만 사용
- 포트폴리오 편집은 섹션별 저장(`PUT /portfolio/sections/:section_key`, 섹션 키: meta / identity / intro / featured_projects / career) 사용, 최초 생성만 전체 문서 PUT
- API에서 가계부/1:1 매칭/RSS/API Key 인증 제거됨 — CMS는 포스트/포트폴리오/태그/이미지 운영에 집중
