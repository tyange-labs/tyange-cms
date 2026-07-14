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
  summary: string
  stack: string[]
  highlights: string[]
  links: PortfolioLink[]
}

export interface PortfolioCareerItem {
  title: string
  period?: string | null
  bullets: string[]
}

export interface PortfolioCareerCompany {
  company: string
  period: string
  employment_type: string
  role: string
  position: string
  items: PortfolioCareerItem[]
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

export function normalizePortfolioDocument(document?: PortfolioDocument | null): PortfolioDocument | null {
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
    featured_projects: (document.featured_projects ?? []).map(project => ({
      ...project,
      stack: [...(project.stack ?? [])],
      highlights: [...(project.highlights ?? [])],
      links: (project.links ?? []).map(link => ({ ...link })),
    })),
    career: document.career
      ? {
          summary_label: document.career.summary_label ?? '',
          summary_value: document.career.summary_value ?? '',
          companies: (document.career.companies ?? []).map(company => ({
            ...company,
            items: (company.items ?? []).map(item => ({
              ...item,
              bullets: [...(item.bullets ?? [])],
            })),
          })),
        }
      : undefined,
    intro: document.intro
      ? {
          content: document.intro.content ?? '',
          tech_stack: (document.intro.tech_stack ?? []).map(item => ({ ...item })),
        }
      : undefined,
  }
}
