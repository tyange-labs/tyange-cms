// PDF 포트폴리오(포트폴리오 슬라이드) 문서. cms-api의 `portfolio_pdf` 포트폴리오 섹션과 같은 모양이다.
// 페이지의 `data`는 템플릿마다 모양이 달라 백엔드는 구조를 검증하지 않는다 — 구조는
// 여기와 `utils/portfolio-pdf-schema.ts`가 정의한다.

export type PortfolioPdfTemplate =
  | 'cover'
  | 'timeline'
  | 'compare'
  | 'cards'
  | 'layers'
  | 'hub'
  | 'showcase'
  | 'project'
  | 'skills'
  | 'closing'

export interface PortfolioPdfTheme {
  accent: string
  accent_dark: string
}

export interface PortfolioPdfPage {
  id: string
  template: PortfolioPdfTemplate
  dark: boolean
  // 템플릿별 필드. 편집기가 스키마대로 채우고, 렌더러는 빠진 값을 빈 값으로 취급한다.
  data: Record<string, any>
}

export interface PortfolioPdfDocument {
  theme: PortfolioPdfTheme
  pages: PortfolioPdfPage[]
}

export interface SectionContentResponse<T> {
  section_key: string
  content: T
  updated_at: string
}

export const PORTFOLIO_PDF_MAX_PAGES = 40

export const DEFAULT_PORTFOLIO_PDF_THEME: PortfolioPdfTheme = {
  accent: '#1f4fd8',
  accent_dark: '#7da2ff',
}

export function newPortfolioPdfPageId() {
  return `p-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
}
