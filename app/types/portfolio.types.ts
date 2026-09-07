export interface PortfolioLink {
  label: string
  url: string
}

export interface PortfolioIdentity {
  name: string
  email: string
  github_url: string
}

export interface PortfolioProject {
  slug: string
  title: string
  period: string
  /** Markdown. */
  summary: string
  stack: string[]
  /** Markdown 불릿 리스트(`- 항목` 줄바꿈). 예전 highlights: string[]을 대체(2026-09). */
  highlights_markdown: string
  links: PortfolioLink[]
}

export interface PortfolioCareerCompany {
  company: string
  period: string
  employment_type: string
  role: string
  position: string
  /** 회사별 세부 경력을 통째로 담는 Markdown. 예전 items: PortfolioCareerItem[]을 대체(2026-09). */
  career_items_markdown: string
}

export interface PortfolioCareerSection {
  summary_label: string
  summary_value: string
  companies: PortfolioCareerCompany[]
}

export interface PortfolioTechStackItem {
  name: string
  icon_url: string
}

export interface PortfolioIntroSection {
  content: string
  tech_stack: PortfolioTechStackItem[]
}

export interface PortfolioDocument {
  slug: string
  version: number
  identity: PortfolioIdentity
  featured_projects: PortfolioProject[]
  career?: PortfolioCareerSection
  intro?: PortfolioIntroSection
}

export interface PortfolioResponse {
  portfolio_id: number
  slug: string
  content: PortfolioDocument
  created_at: string
  updated_at: string
}

export type PortfolioSectionKey = 'meta' | 'identity' | 'intro' | 'featured_projects' | 'career'

export interface UpdatePortfolioSectionResponse {
  section_key: string
  updated_at: string
}

export function normalizePortfolioDocument(
  document?: PortfolioDocument | null,
): PortfolioDocument | null {
  if (!document) {
    return null
  }

  return {
    slug: document.slug ?? 'dev',
    version: document.version ?? 1,
    identity: {
      name: document.identity?.name ?? '',
      email: document.identity?.email ?? '',
      github_url: document.identity?.github_url ?? '',
    },
    featured_projects: (document.featured_projects ?? []).map((project) => ({
      ...project,
      stack: [...(project.stack ?? [])],
      highlights_markdown: project.highlights_markdown ?? '',
      links: (project.links ?? []).map((link) => ({ ...link })),
    })),
    career: document.career
      ? {
          summary_label: document.career.summary_label ?? '',
          summary_value: document.career.summary_value ?? '',
          companies: (document.career.companies ?? []).map((company) => ({
            ...company,
            career_items_markdown: company.career_items_markdown ?? '',
          })),
        }
      : undefined,
    intro: document.intro
      ? {
          content: document.intro.content ?? '',
          tech_stack: (document.intro.tech_stack ?? []).map((item) => ({ ...item })),
        }
      : undefined,
  }
}
