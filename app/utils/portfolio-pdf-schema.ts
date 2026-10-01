import type { PortfolioPdfTemplate } from '~/types/portfolio-pdf.types'

// 편집 폼은 이 스키마만 보고 그려진다(PortfolioPdfFieldEditor). 템플릿을 추가하려면 여기에
// 스키마와 기본값을 더하고, PortfolioPdfPageView.vue에 렌더링 분기를 추가한다.
export type PortfolioPdfField =
  | { key: string; label: string; type: 'text' | 'textarea' | 'image' | 'strings' }
  | { key: string; label: string; type: 'list'; itemLabel: string; item: PortfolioPdfField[] }
  | { key: string; label: string; type: 'object'; fields: PortfolioPdfField[] }

export interface PortfolioPdfTemplateMeta {
  label: string
  description: string
  fields: PortfolioPdfField[]
  defaults: () => Record<string, any>
}

const label: PortfolioPdfField = { key: 'label', label: '상단 라벨 (영문 대문자)', type: 'text' }
const title: PortfolioPdfField = { key: 'title', label: '제목', type: 'text' }
const subtitle: PortfolioPdfField = { key: 'subtitle', label: '부제', type: 'text' }

export const PORTFOLIO_PDF_TEMPLATES: Record<PortfolioPdfTemplate, PortfolioPdfTemplateMeta> = {
  cover: {
    label: '표지',
    description: '이름, 직무, 소개 문단',
    fields: [
      label,
      { key: 'name', label: '이름', type: 'text' },
      { key: 'role', label: '직무', type: 'text' },
      { key: 'intro', label: '소개', type: 'textarea' },
    ],
    defaults: () => ({
      label: 'FRONTEND DEVELOPER · PORTFOLIO',
      name: '이름',
      role: 'Frontend Developer',
      intro: '',
    }),
  },
  timeline: {
    label: '경력 타임라인',
    description: '회사별 기간을 막대로 보여 주는 요약',
    fields: [
      label,
      title,
      {
        key: 'rows',
        label: '경력',
        type: 'list',
        itemLabel: '경력',
        item: [
          { key: 'company', label: '회사', type: 'text' },
          { key: 'role', label: '직무', type: 'text' },
          { key: 'start', label: '시작 (YYYY-MM)', type: 'text' },
          { key: 'end', label: '종료 (YYYY-MM, 재직 중이면 비움)', type: 'text' },
          { key: 'desc', label: '한 줄 설명', type: 'text' },
        ],
      },
    ],
    defaults: () => ({ label: 'CAREER', title: '경력 요약', rows: [] }),
  },
  compare: {
    label: '전후 비교',
    description: '이전 → 이후 도식이 줄지어 나오는 페이지',
    fields: [
      label,
      title,
      subtitle,
      {
        key: 'rows',
        label: '비교 행',
        type: 'list',
        itemLabel: '행',
        item: [
          { key: 'tag', label: '회사/태그', type: 'text' },
          { key: 'from', label: '이전', type: 'text' },
          { key: 'to', label: '이후', type: 'text' },
          { key: 'note', label: '이후 보조 설명', type: 'text' },
        ],
      },
    ],
    defaults: () => ({ label: 'STRENGTH', title: '제목', subtitle: '', rows: [] }),
  },
  cards: {
    label: '카드 3열',
    description: '태그와 본문이 있는 카드를 나란히',
    fields: [
      label,
      title,
      subtitle,
      {
        key: 'cards',
        label: '카드',
        type: 'list',
        itemLabel: '카드',
        item: [
          { key: 'tag', label: '태그', type: 'text' },
          { key: 'body', label: '본문', type: 'textarea' },
          { key: 'sub', label: '보조 한 줄 (선택)', type: 'text' },
        ],
      },
    ],
    defaults: () => ({ label: 'STRENGTH', title: '제목', subtitle: '', cards: [] }),
  },
  layers: {
    label: '층별 목록',
    description: '항목 이름 · 설명 · 회사 태그를 한 줄씩',
    fields: [
      label,
      title,
      subtitle,
      {
        key: 'rows',
        label: '행',
        type: 'list',
        itemLabel: '행',
        item: [
          { key: 'key', label: '구분', type: 'text' },
          { key: 'text', label: '설명', type: 'text' },
          { key: 'tag', label: '회사/태그', type: 'text' },
        ],
      },
    ],
    defaults: () => ({ label: 'STRENGTH', title: '제목', subtitle: '', rows: [] }),
  },
  hub: {
    label: '구조도',
    description: '입력 → 중심 서버 → 여러 소비처 구조',
    fields: [
      label,
      title,
      subtitle,
      {
        key: 'source',
        label: '왼쪽 노드',
        type: 'object',
        fields: [
          { key: 'tag', label: '태그', type: 'text' },
          { key: 'title', label: '이름', type: 'text' },
          { key: 'desc', label: '설명', type: 'text' },
        ],
      },
      {
        key: 'hub',
        label: '가운데 노드',
        type: 'object',
        fields: [
          { key: 'tag', label: '태그', type: 'text' },
          { key: 'title', label: '이름', type: 'text' },
          { key: 'lines', label: '설명 줄', type: 'strings' },
        ],
      },
      {
        key: 'targets',
        label: '오른쪽 노드',
        type: 'list',
        itemLabel: '노드',
        item: [
          { key: 'tag', label: '태그', type: 'text' },
          { key: 'title', label: '이름', type: 'text' },
          { key: 'desc', label: '설명', type: 'text' },
        ],
      },
      { key: 'footer', label: '아래 상자 (선택)', type: 'text' },
    ],
    defaults: () => ({
      label: 'PROJECT',
      title: '제목',
      subtitle: '',
      source: { tag: '', title: '', desc: '' },
      hub: { tag: '', title: '', lines: [] },
      targets: [],
      footer: '',
    }),
  },
  showcase: {
    label: '화면 모음',
    description: '화면 캡처 목록 + 강조 카드',
    fields: [
      label,
      title,
      {
        key: 'screens',
        label: '화면',
        type: 'list',
        itemLabel: '화면',
        item: [
          { key: 'tag', label: '태그', type: 'text' },
          { key: 'title', label: '이름', type: 'text' },
          { key: 'desc', label: '설명', type: 'text' },
          { key: 'image', label: '이미지', type: 'image' },
        ],
      },
      {
        key: 'feature',
        label: '강조 카드',
        type: 'object',
        fields: [
          { key: 'tag', label: '태그', type: 'text' },
          { key: 'title', label: '제목', type: 'text' },
          { key: 'desc', label: '설명', type: 'textarea' },
          { key: 'images', label: '이미지 URL 목록', type: 'strings' },
        ],
      },
      { key: 'note', label: '하단 주석 (선택)', type: 'text' },
    ],
    defaults: () => ({
      label: 'PROJECT',
      title: '제목',
      screens: [],
      feature: { tag: '', title: '', desc: '', images: [] },
      note: '',
    }),
  },
  project: {
    label: '프로젝트 소개',
    description: '설명 + 모드 카드 + 스크린샷 + 변천 단계',
    fields: [
      label,
      title,
      { key: 'intro', label: '소개', type: 'textarea' },
      {
        key: 'modes',
        label: '모드/기능 카드',
        type: 'list',
        itemLabel: '카드',
        item: [
          { key: 'tag', label: '태그', type: 'text' },
          { key: 'desc', label: '설명', type: 'text' },
        ],
      },
      { key: 'note_title', label: '강조 단락 제목 (선택)', type: 'text' },
      { key: 'note', label: '강조 단락 (선택)', type: 'textarea' },
      { key: 'image', label: '스크린샷', type: 'image' },
      { key: 'steps_label', label: '단계 라벨 (선택)', type: 'text' },
      {
        key: 'steps',
        label: '단계',
        type: 'list',
        itemLabel: '단계',
        item: [
          { key: 'tag', label: '태그', type: 'text' },
          { key: 'text', label: '내용', type: 'text' },
        ],
      },
    ],
    defaults: () => ({
      label: 'PROJECT',
      title: '제목',
      intro: '',
      modes: [],
      note_title: '',
      note: '',
      image: '',
      steps_label: '',
      steps: [],
    }),
  },
  skills: {
    label: '기술 스택',
    description: '칩 목록과 설명이 있는 열, 아래 강조 문장',
    fields: [
      label,
      title,
      {
        key: 'columns',
        label: '열',
        type: 'list',
        itemLabel: '열',
        item: [
          { key: 'tag', label: '이름', type: 'text' },
          { key: 'chips', label: '칩', type: 'strings' },
          { key: 'desc', label: '설명', type: 'textarea' },
        ],
      },
      {
        key: 'notes',
        label: '하단 강조',
        type: 'list',
        itemLabel: '강조',
        item: [
          { key: 'title', label: '제목', type: 'text' },
          { key: 'text', label: '내용', type: 'textarea' },
        ],
      },
    ],
    defaults: () => ({ label: 'SKILLS', title: '기술 스택', columns: [], notes: [] }),
  },
  closing: {
    label: '마무리 · 연락처',
    description: '인사말과 연락처',
    fields: [
      label,
      title,
      {
        key: 'contacts',
        label: '연락처',
        type: 'list',
        itemLabel: '연락처',
        item: [
          { key: 'k', label: '구분', type: 'text' },
          { key: 'v', label: '값', type: 'text' },
        ],
      },
    ],
    defaults: () => ({ label: 'CONTACT', title: '감사합니다.', contacts: [] }),
  },
}

export const PORTFOLIO_PDF_TEMPLATE_KEYS = Object.keys(
  PORTFOLIO_PDF_TEMPLATES,
) as PortfolioPdfTemplate[]

/** 리스트 항목 하나의 빈 값. 스키마의 모든 키를 빈 문자열/배열/객체로 채운다. */
export function emptyItem(fields: PortfolioPdfField[]): Record<string, any> {
  const out: Record<string, any> = {}
  for (const field of fields) {
    if (field.type === 'strings') out[field.key] = []
    else if (field.type === 'list') out[field.key] = []
    else if (field.type === 'object') out[field.key] = emptyItem(field.fields)
    else out[field.key] = ''
  }
  return out
}
