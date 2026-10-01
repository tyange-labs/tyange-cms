import type {
  PortfolioPdfDocument,
  PortfolioPdfPage,
  SectionContentResponse,
} from '~/types/portfolio-pdf.types'
import { DEFAULT_PORTFOLIO_PDF_THEME, newPortfolioPdfPageId } from '~/types/portfolio-pdf.types'
import { PORTFOLIO_PDF_TEMPLATES } from '~/utils/portfolio-pdf-schema'
import { createDefaultPortfolioPdf } from '~/utils/portfolio-pdf-default'
import type { CMSResponse } from '~/types/response.types'
import { authenticatedFetch } from '~/composables/useAuthenticatedApi'

// 저장된 문서를 믿지 않고 모양을 맞춘다 — 알 수 없는 템플릿 페이지는 걸러 내고,
// 빠진 필드는 템플릿 기본값으로 채워 렌더러/폼이 undefined를 만나지 않게 한다.
export function normalizePortfolioPdf(raw: unknown): PortfolioPdfDocument {
  const doc = (raw ?? {}) as Partial<PortfolioPdfDocument>
  const pages: PortfolioPdfPage[] = (Array.isArray(doc.pages) ? doc.pages : [])
    .filter((page) => page && page.template in PORTFOLIO_PDF_TEMPLATES)
    .map((page) => ({
      id: page.id || newPortfolioPdfPageId(),
      template: page.template,
      dark: !!page.dark,
      data: { ...PORTFOLIO_PDF_TEMPLATES[page.template].defaults(), ...page.data },
    }))
  return {
    theme: { ...DEFAULT_PORTFOLIO_PDF_THEME, ...doc.theme },
    pages,
  }
}

/** 서버의 포트폴리오 PDF를 읽는다. 아직 저장된 적이 없으면(404) 기본 문서를 돌려준다. */
export async function fetchPortfolioPdf(): Promise<{ doc: PortfolioPdfDocument; saved: boolean }> {
  try {
    const res = await authenticatedFetch<CMSResponse<SectionContentResponse<PortfolioPdfDocument>>>(
      '/api/portfolio/sections/portfolio_pdf',
    )
    return { doc: normalizePortfolioPdf(res.data?.content), saved: true }
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode
    if (statusCode === 404) {
      return { doc: createDefaultPortfolioPdf(), saved: false }
    }
    throw error
  }
}

export async function savePortfolioPdf(doc: PortfolioPdfDocument) {
  return await authenticatedFetch('/api/portfolio/sections/portfolio_pdf', {
    method: 'PUT',
    body: { content: doc },
  })
}
