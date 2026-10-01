import type { PortfolioPdfDocument } from '~/types/portfolio-pdf.types'
import { DEFAULT_PORTFOLIO_PDF_THEME } from '~/types/portfolio-pdf.types'

// 서버에 저장된 포트폴리오 PDF가 아직 없을 때(404) 편집기가 불러오는 시작 문서.
// 이미지는 public/portfolio-pdf/ 에 들어 있다.
export function createDefaultPortfolioPdf(): PortfolioPdfDocument {
  return {
    theme: { ...DEFAULT_PORTFOLIO_PDF_THEME },
    pages: [
      {
        id: 'cover',
        template: 'cover',
        dark: true,
        data: {
          label: 'FRONTEND DEVELOPER · PORTFOLIO 2026',
          name: '유태양',
          role: 'Frontend Developer',
          intro:
            '화면 구현을 넘어 데이터 계약, 배포 흐름, 운영 동선까지 함께 설계하는 4년 차 프론트엔드 개발자입니다. 레거시를 현대 스택으로 옮기고, 맡은 서비스를 끝까지 책임져 왔습니다.',
        },
      },
      {
        id: 'career',
        template: 'timeline',
        dark: false,
        data: {
          label: 'CAREER',
          title: '경력 요약 · 총 4년+',
          rows: [
            {
              company: '오토위니',
              role: '프론트엔드 · 주임',
              start: '2022-08',
              end: '2025-12',
              desc: '차량 검색·경매 서비스 현대화와 운영',
            },
            {
              company: '미트박스글로벌',
              role: '프론트엔드',
              start: '2026-01',
              end: '2026-04',
              desc: '화면·스타일 구조 정리, AI 개발 흐름 구축',
            },
            {
              company: '바이온사이트',
              role: '프론트엔드 엔지니어',
              start: '2026-08',
              end: '',
              desc: '질량분석 데스크톱 앱의 화면 담당',
            },
          ],
        },
      },
      {
        id: 'strength-legacy',
        template: 'compare',
        dark: false,
        data: {
          label: 'STRENGTH 01 · LEGACY MODERNIZATION',
          title: '레거시를 더 모던하고 많이 쓰이는 기술 스택으로',
          subtitle: '운영 중인 서비스를 멈추지 않는 점진적 마이그레이션을 추구합니다.',
          rows: [
            { tag: 'AUTOWINI', from: 'Spring + JSP', to: 'Vue 3 · Nuxt', note: '차량 검색 · 경매' },
            { tag: 'AUTOWINI', from: 'CRA + JavaScript', to: 'Vite + TypeScript', note: '' },
            { tag: 'AUTOWINI', from: 'jQuery DOM 조작', to: 'Vanilla JS', note: '' },
            {
              tag: 'MEATBOX',
              from: '런타임 JS · CSS 주입',
              to: 'Vue 컴포넌트 · scoped style',
              note: '',
            },
            { tag: 'MEATBOX', from: '레거시 JavaScript', to: 'TypeScript', note: '' },
          ],
        },
      },
      {
        id: 'strength-ownership',
        template: 'cards',
        dark: false,
        data: {
          label: 'STRENGTH 02 · OWNERSHIP',
          title: '끝까지 책임지는 운영',
          subtitle: '',
          cards: [
            {
              tag: 'AUTOWINI',
              body: '운영 서비스의 유지보수, 신규 기능, 배포, 장애 대응까지 프론트엔드 전반을 책임졌습니다.',
              sub: '',
            },
            {
              tag: 'MEATBOX GLOBAL',
              body: 'Claude Code에 MCP를 연결해 디자인 확인부터 구현, 브라우저 검증, Jira 기록까지 한 흐름으로 처리했습니다.',
              sub: 'Figma → Claude Code → Playwright → Jira',
            },
            {
              tag: 'BIONSIGHT',
              body: '단백체학·질량분석이라는 새 도메인을 직접 익혀, 분석 앱 UI와 사내 QA 도구를 맡고 있습니다.',
              sub: '',
            },
          ],
        },
      },
      {
        id: 'strength-design',
        template: 'layers',
        dark: false,
        data: {
          label: 'STRENGTH 03 · END-TO-END DESIGN',
          title: 'API부터 배포까지 직접 설계',
          subtitle: '',
          rows: [
            {
              key: 'API · 데이터',
              text: 'API 응답 처리와 렌더링을 분리하고, 응답 구조 기준으로 화면을 개편',
              tag: 'MEATBOX',
            },
            {
              key: '화면 구조',
              text: '공용 컴포넌트를 분리하고 스타일 구조를 재정비',
              tag: 'MEATBOX',
            },
            {
              key: '앱 구조',
              text: '분석 데스크톱 앱의 UI를 재설계하고 컨트롤러 구조를 개선',
              tag: 'BIONSIGHT',
            },
            {
              key: '빌드 · 배포',
              text: 'Vite로 빌드 환경을 바꾸고 Jenkins CI/CD로 배포를 자동화',
              tag: 'AUTOWINI',
            },
          ],
        },
      },
      {
        id: 'cms-structure',
        template: 'hub',
        dark: false,
        data: {
          label: 'PROJECT · TYANGE CMS · PERSONAL · LIVE',
          title: '직접 설계하고 만든 Content Management System(CMS)',
          subtitle: '자체 생산 콘텐츠를 한 곳에서 발행하고 관리하기 위해 만들었습니다.',
          source: { tag: 'NUXT 4', title: 'tyange-cms', desc: '작성 · 관리 화면' },
          hub: {
            tag: 'RUST · POEM · SQLITE',
            title: 'tyange-cms-api',
            lines: ['인증 · 업로드 · 포트폴리오', '단일 바이너리 + systemd'],
          },
          targets: [
            { tag: 'NUXT 4', title: 'tyange-blog', desc: 'blog.tyange.com' },
            { tag: 'SOLIDSTART 2', title: 'tyange-dev', desc: 'dev.tyange.com' },
            { tag: 'REACT 19', title: 'lovelog', desc: '모바일 청첩장' },
          ],
          footer: 'GitHub Actions · 빌드 · 테스트 · 배포',
        },
      },
      {
        id: 'cms-screens',
        template: 'showcase',
        dark: false,
        data: {
          label: 'PROJECT · TYANGE CMS · FRONT-ENDS',
          title: '같은 API를 쓰는 네 개의 화면',
          screens: [
            {
              tag: 'NUXT 4 · VUE 3',
              title: 'tyange-cms',
              desc: '글과 포트폴리오를 쓰는 관리 도구',
              image: '/portfolio-pdf/cms-editor.jpg',
            },
            {
              tag: 'NUXT 4 · SSG',
              title: 'tyange-blog',
              desc: 'CMS 글로 정적 페이지를 생성',
              image: '/portfolio-pdf/blog-list.jpg',
            },
            {
              tag: 'SOLIDSTART 2',
              title: 'tyange-dev',
              desc: '빌드 시 정적 사이트로 생성해 서버 없이 동작',
              image: '/portfolio-pdf/dev-home.jpg',
            },
          ],
          feature: {
            tag: 'REACT 19 · TANSTACK ROUTER · MOTION',
            title: 'lovelog — 직접 만든 모바일 청첩장',
            desc: '결혼식을 전시회 형식으로 열고, 스크롤로 넘기는 화보와 방문 시간대 RSVP를 CMS API로 받았습니다.',
            images: [
              '/portfolio-pdf/wedding-cover.jpg',
              '/portfolio-pdf/wedding-poster.jpg',
              '/portfolio-pdf/wedding-rsvp.jpg',
            ],
          },
          note: 'tyange-cms · tyange-blog 화면은 샘플 데이터로 촬영했습니다.',
        },
      },
      {
        id: 'palim',
        template: 'project',
        dark: false,
        data: {
          label: 'PROJECT · PALIM · VUE 3 · TS · VITE · PINIA',
          title: '한 글자도 틀리지 않는 시 전사 에디터',
          intro:
            '한국 시는 배치 자체가 시인 작품과, 자연스럽게 흐르는 산문시로 나뉩니다. 둘 다 원문 그대로 옮길 수 있게 쓰기 모드를 둘로 나눴습니다.',
          modes: [
            { tag: 'GRID', desc: '글 조각을 좌표 위에 자유롭게 배치' },
            { tag: 'FLOW', desc: '산문 · 일반 시 비례폭 조판' },
          ],
          note_title: '한글 IME 트러블슈팅',
          note: '칸을 옮길 때마다 입력창이 새로 마운트돼 macOS IME가 다음 음절의 초성을 잃었습니다(‘안녕’ → ‘안ㅕㅇ’). 입력창 하나로 모든 칸을 처리하도록 구조를 바꿔 해결했습니다.',
          image: '/portfolio-pdf/palim-grid.jpg',
          steps_label: '격자 모드 구조 변천',
          steps: [
            { tag: 'GEN 1', text: '자소 1개 = 1칸' },
            { tag: 'GEN 2', text: '표준 textarea' },
            { tag: 'GEN 3', text: '자유 배치 캔버스' },
          ],
        },
      },
      {
        id: 'skills',
        template: 'skills',
        dark: false,
        data: {
          label: 'SKILLS',
          title: '기술 스택과 사용 경험',
          columns: [
            {
              tag: 'FRONTEND',
              chips: ['TypeScript', 'Vue 3', 'Nuxt', 'React', 'SolidJS', 'Tailwind'],
              desc: 'Vue 3 · Nuxt로 레거시 전환과 실서비스 운영을, Solid로 개인 서비스를 만들었습니다.',
            },
            {
              tag: 'BACKEND · INFRA',
              chips: [
                'Rust',
                'Poem',
                'SQLite',
                'Python',
                'AWS Lightsail',
                'GitHub Actions',
                'Jenkins',
              ],
              desc: 'AWS Lightsail 서버 한 대에 Rust API와 사이트를 올려 nginx·systemd로 운영하고, CI로 빌드·테스트·배포를 자동화했습니다.',
            },
            {
              tag: 'TOOLING · AI',
              chips: ['Vite', 'Bun', 'Vitest', 'Playwright', 'Claude Code', 'MCP'],
              desc: 'CRA에서 Vite로 옮겨 봤고, MCP를 연결한 Claude Code로 디자인 확인부터 검증까지 처리합니다.',
            },
          ],
          notes: [
            {
              title: '왜 Rust',
              text: '백엔드 언어 중 가장 가볍고, 단일 바이너리로 런타임 없이 배포할 수 있습니다.',
            },
            {
              title: '왜 SolidJS · Vue',
              text: '렌더링 비용을 직접 관리하지 않아도 되는 반응성 모델과, Vite 생태계와의 긴밀함을 선호합니다.',
            },
          ],
        },
      },
      {
        id: 'closing',
        template: 'closing',
        dark: false,
        data: {
          label: 'CONTACT',
          title: '감사합니다.',
          contacts: [
            { k: 'EMAIL', v: 'usun16@gmail.com' },
            { k: 'GITHUB', v: 'github.com/tyange' },
            { k: 'PORTFOLIO', v: 'dev.tyange.com' },
            { k: 'BLOG', v: 'blog.tyange.com' },
          ],
        },
      },
    ],
  }
}
