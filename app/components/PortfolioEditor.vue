<script setup lang="ts">
import type {
  PortfolioCareerCompany,
  PortfolioCareerItem,
  PortfolioDocument,
  PortfolioIntroSection,
  PortfolioLink,
  PortfolioProject,
  PortfolioResponse,
  PortfolioSectionKey,
  UpdatePortfolioSectionResponse,
} from '~/types/portfolio.types'
import type { CMSResponse } from '~/types/response.types'
import {
  Briefcase,
  BriefcaseBusiness,
  CodeXml,
  FolderOpen,
  Plus,
  RefreshCw,
  Save,
  Trash,
  Upload,
} from 'lucide-vue-next'
import { handleUnauthorizedError, useAuthHeaders } from '~/composables/useAuthenticatedApi'
import { normalizePortfolioDocument } from '~/types/portfolio.types'

const authHeaders = useAuthHeaders()

const isSaving = ref(false)
const savingSection = ref<PortfolioSectionKey | null>(null)
const isDeleting = ref(false)
const submitError = ref('')
const successMessage = ref('')
const hasPortfolio = ref(false)
const portfolioId = ref<number | null>(null)
const createdAt = ref('')
const updatedAt = ref('')
const portfolio = ref<PortfolioDocument | null>(null)

const { data, error, status, refresh } = await useFetch<CMSResponse<PortfolioResponse>>(
  '/api/portfolio',
  {
    headers: authHeaders,
    credentials: 'include',
    server: false,
    retry: 0,
  },
)

function getErrorMessage(error: unknown, fallback: string) {
  const fetchError = error as {
    data?: { message?: string } | string
    statusCode?: number
    statusMessage?: string
  }

  if (fetchError?.statusCode === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (fetchError?.statusCode === 403) {
    return '관리자만 포트폴리오를 수정할 수 있습니다.'
  }

  if (typeof fetchError?.data === 'string' && fetchError.data) {
    return fetchError.data
  }

  if (
    fetchError?.data &&
    typeof fetchError.data === 'object' &&
    'message' in fetchError.data &&
    typeof fetchError.data.message === 'string'
  ) {
    return fetchError.data.message
  }

  if (fetchError?.statusMessage) {
    return fetchError.statusMessage
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function assignPortfolio(nextPortfolio?: PortfolioResponse | null) {
  hasPortfolio.value = Boolean(nextPortfolio)
  portfolioId.value = nextPortfolio?.portfolio_id ?? null
  createdAt.value = nextPortfolio?.created_at ?? ''
  updatedAt.value = nextPortfolio?.updated_at ?? ''

  const normalized = normalizePortfolioDocument(nextPortfolio?.content)
  // intro/career는 스키마상 optional이라 옛날 문서엔 아예 없을 수 있는데, 그때마다
  // 폼에서 "섹션 없음" 상태를 별도로 다루면 분기만 늘어난다. 로드 시점에 빈 값으로
  // 한 번 채워두면 폼은 항상 두 섹션이 있다고 가정하고 그릴 수 있다 — 저장 시
  // 내용이 비어있으면 백엔드도 사실상 빈 섹션으로 저장하니 의미상 차이는 없다.
  if (normalized) {
    normalized.intro ??= { content: '', tech_stack: [] }
    normalized.career ??= { summary_label: '', summary_value: '', companies: [] }
  }
  portfolio.value = normalized
}

// 서버에서 막 받아온 값을 assignPortfolio()가 채워 넣는 동안에는 아래 섹션별
// deep watcher들이 "사용자가 방금 고쳤다"고 오해해서 자동 저장을 걸면 안 된다 —
// 로드/새로고침 직후에 불필요한 PUT이 나가는 걸 막는 플래그.
const isHydrating = ref(true)

watch(
  data,
  (value) => {
    isHydrating.value = true
    assignPortfolio(value?.data)
    nextTick(() => {
      isHydrating.value = false
    })
  },
  { immediate: true },
)

watch(
  error,
  async (value) => {
    if (!value) {
      return
    }

    const handled = await handleUnauthorizedError(value)
    if (handled) {
      return
    }

    if ((value as { statusCode?: number }).statusCode === 404) {
      assignPortfolio(null)
      submitError.value = ''
      return
    }

    submitError.value = getErrorMessage(value, '포트폴리오를 불러오지 못했습니다.')
  },
  { immediate: true },
)

const isLoading = computed(() => status.value === 'pending')
const loadErrorMessage = computed(() => {
  if (!error.value || (error.value as { statusCode?: number }).statusCode === 404) {
    return ''
  }

  return getErrorMessage(error.value, '포트폴리오를 불러오지 못했습니다.')
})

const metadataItems = computed(() => [
  { label: 'portfolio_id', value: portfolioId.value ?? '-' },
  { label: 'slug', value: portfolio.value?.slug || '-' },
  { label: 'created_at', value: createdAt.value || '-' },
  { label: 'updated_at', value: updatedAt.value || '-' },
])

function createLink(): PortfolioLink {
  return {
    label: '',
    url: '',
  }
}

function createProject(): PortfolioProject {
  return {
    slug: '',
    title: '',
    period: '',
    summary: '',
    stack: [],
    highlights_markdown: '',
    links: [createLink()],
  }
}

function createCareerItem(): PortfolioCareerItem {
  return {
    title: '',
    period: '',
    bullets_markdown: '',
  }
}

function createCareerCompany(): PortfolioCareerCompany {
  return {
    company: '',
    period: '',
    employment_type: '',
    role: '',
    position: '',
    items: [createCareerItem()],
  }
}

function parseMultilineList(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function updateProjectStack(index: number, value: string) {
  const p = portfolio.value
  if (!p) return
  p.featured_projects[index].stack = parseMultilineList(value)
}

function addProject() {
  const p = portfolio.value
  if (!p) return
  p.featured_projects.push(createProject())
}

function removeProject(index: number) {
  const p = portfolio.value
  if (!p) return
  p.featured_projects.splice(index, 1)
}

function addProjectLink(projectIndex: number) {
  const p = portfolio.value
  if (!p) return
  p.featured_projects[projectIndex].links.push(createLink())
}

function removeProjectLink(projectIndex: number, linkIndex: number) {
  const p = portfolio.value
  if (!p) return
  p.featured_projects[projectIndex].links.splice(linkIndex, 1)
}

function addCareerCompany() {
  const p = portfolio.value
  if (!p) return
  const career = p.career ?? { summary_label: '', summary_value: '', companies: [] }
  career.companies.push(createCareerCompany())
  p.career = career
}

function removeCareerCompany(index: number) {
  const p = portfolio.value
  if (!p) return
  const career = p.career ?? { summary_label: '', summary_value: '', companies: [] }
  career.companies.splice(index, 1)
  p.career = career
}

function addCareerItem(companyIndex: number) {
  const p = portfolio.value
  if (!p) return
  const career = p.career ?? { summary_label: '', summary_value: '', companies: [] }
  career.companies[companyIndex].items.push(createCareerItem())
  p.career = career
}

function removeCareerItem(companyIndex: number, itemIndex: number) {
  const p = portfolio.value
  if (!p) return
  const career = p.career ?? { summary_label: '', summary_value: '', companies: [] }
  career.companies[companyIndex].items.splice(itemIndex, 1)
  p.career = career
}

function ensureIntro(): PortfolioIntroSection {
  const p = portfolio.value
  if (!p) throw new Error('portfolio not initialized')
  if (!p.intro) {
    p.intro = { content: '', tech_stack: [] }
  }
  return p.intro
}

function addTechStackItem() {
  const intro = ensureIntro()
  intro.tech_stack.push({ name: '', icon_url: '' })
}

function removeTechStackItem(index: number) {
  const intro = ensureIntro()
  intro.tech_stack.splice(index, 1)
}

const config = useRuntimeConfig()

async function handleIconUpload(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const intro = ensureIntro()

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await authenticatedFetch<CMSResponse<{ image_path: string }>>(
      '/api/portfolio/upload-icon',
      {
        method: 'POST',
        body: formData,
      },
    )

    if (res.data?.image_path) {
      intro.tech_stack[index].icon_url =
        `${config.public.tyangeCmsApiBaseProd}${res.data.image_path}`
    }
  } catch (err) {
    submitError.value = getErrorMessage(err, '아이콘 업로드에 실패했습니다.')
  } finally {
    input.value = ''
  }
}

function initPortfolio() {
  portfolio.value = {
    slug: 'dev',
    version: 1,
    identity: {
      name: '',
      email: '',
      github_url: '',
    },
    featured_projects: [],
    career: {
      summary_label: '',
      summary_value: '',
      companies: [],
    },
    intro: {
      content: '',
      tech_stack: [],
    },
  }
}

function buildPayload() {
  if (!portfolio.value) {
    throw new Error('포트폴리오가 초기화되지 않았습니다.')
  }

  return {
    content: {
      ...portfolio.value,
      slug: portfolio.value.slug.trim() || 'dev',
    },
  }
}

async function handleRefresh() {
  submitError.value = ''
  successMessage.value = ''
  await refresh()
}

async function handleSave() {
  submitError.value = ''
  successMessage.value = ''
  isSaving.value = true

  try {
    const response = await authenticatedFetch<CMSResponse<PortfolioResponse>>(
      '/api/portfolio/update',
      {
        method: 'PUT',
        body: buildPayload(),
      },
    )

    assignPortfolio(response.data)
    successMessage.value = hasPortfolio.value
      ? '포트폴리오를 저장했습니다.'
      : '포트폴리오를 생성했습니다.'
  } catch (error: unknown) {
    submitError.value = getErrorMessage(error, '포트폴리오 저장에 실패했습니다.')
  } finally {
    isSaving.value = false
  }
}

const sectionLabels: Record<PortfolioSectionKey, string> = {
  meta: 'Basic',
  identity: 'Contact',
  intro: 'Intro',
  featured_projects: 'Featured Projects',
  career: 'Career',
}

function buildSectionContent(sectionKey: PortfolioSectionKey) {
  const p = portfolio.value
  if (!p) {
    throw new Error('포트폴리오가 초기화되지 않았습니다.')
  }

  switch (sectionKey) {
    case 'meta':
      return { slug: p.slug.trim() || 'dev', version: p.version ?? 1 }
    case 'identity':
      return p.identity
    case 'intro':
      return p.intro ?? { content: '', tech_stack: [] }
    case 'featured_projects':
      return p.featured_projects
    case 'career':
      return p.career ?? { summary_label: '', summary_value: '', companies: [] }
  }
}

async function handleSaveSection(sectionKey: PortfolioSectionKey, options?: { silent?: boolean }) {
  if (!options?.silent) {
    submitError.value = ''
    successMessage.value = ''
  }
  savingSection.value = sectionKey

  try {
    const response = await authenticatedFetch<CMSResponse<UpdatePortfolioSectionResponse>>(
      `/api/portfolio/sections/${sectionKey}`,
      {
        method: 'PUT',
        body: { content: buildSectionContent(sectionKey) },
      },
    )

    if (response.data?.updated_at) {
      updatedAt.value = response.data.updated_at
    }

    if (options?.silent) {
      lastAutoSavedAt.value[sectionKey] = response.data?.updated_at ?? updatedAt.value
    } else {
      successMessage.value = `${sectionLabels[sectionKey]} 섹션을 저장했습니다.`
    }
  } catch (error: unknown) {
    // 자동 저장이든 수동 저장이든 실패는 항상 눈에 띄게 알린다 — 조용히 실패하면
    // 사용자는 저장됐다고 착각한 채로 계속 편집하게 된다.
    submitError.value = getErrorMessage(
      error,
      `${sectionLabels[sectionKey]} 섹션 저장에 실패했습니다.`,
    )
  } finally {
    savingSection.value = null
  }
}

// 섹션별 디바운스 자동 저장. 5개 섹션 각각 "저장" 버튼을 눌러야 하는 흐름이
// 번거롭다는 피드백을 반영해, 블로그 에디터(Editor.client.vue)와 같은 패턴을
// 붙였다 — 단 포트폴리오는 섹션별 PUT 엔드포인트가 나뉘어 있어서 섹션마다
// 독립된 타이머를 둔다. 최초 생성(hasPortfolio가 false) 전까지는 저장할
// 문서 자체가 없어서 자동 저장을 걸지 않는다("생성" 버튼으로만 최초 저장).
const autoSaveDelay = 1500
const autoSaveTimers: Partial<Record<PortfolioSectionKey, ReturnType<typeof setTimeout>>> = {}
const lastAutoSavedAt = ref<Partial<Record<PortfolioSectionKey, string>>>({})

function scheduleSectionAutoSave(sectionKey: PortfolioSectionKey) {
  if (isHydrating.value || !hasPortfolio.value) return

  const existingTimer = autoSaveTimers[sectionKey]
  if (existingTimer) {
    clearTimeout(existingTimer)
  }
  autoSaveTimers[sectionKey] = setTimeout(() => {
    handleSaveSection(sectionKey, { silent: true })
  }, autoSaveDelay)
}

function formatAutoSavedAt(value?: string) {
  if (!value) return ''
  // 백엔드가 내려주는 SQLite CURRENT_TIMESTAMP 형식("YYYY-MM-DD HH:MM:SS")에서
  // 시:분:초만 뽑아 짧게 보여준다.
  return value.split(' ')[1] ?? value
}

watch(() => portfolio.value?.identity, () => scheduleSectionAutoSave('identity'), { deep: true })
watch(() => portfolio.value?.intro, () => scheduleSectionAutoSave('intro'), { deep: true })
watch(
  () => portfolio.value?.featured_projects,
  () => scheduleSectionAutoSave('featured_projects'),
  { deep: true },
)
watch(() => portfolio.value?.career, () => scheduleSectionAutoSave('career'), { deep: true })
watch(
  () => (portfolio.value ? [portfolio.value.slug, portfolio.value.version] : null),
  () => scheduleSectionAutoSave('meta'),
  { deep: true },
)

async function handleDelete() {
  if (!hasPortfolio.value) {
    return
  }

  const confirmed = window.confirm('포트폴리오 데이터를 삭제할까요?')

  if (!confirmed) {
    return
  }

  submitError.value = ''
  successMessage.value = ''
  isDeleting.value = true

  try {
    await authenticatedFetch('/api/portfolio/delete', {
      method: 'DELETE',
    })

    assignPortfolio(null)
    successMessage.value = '포트폴리오를 삭제했습니다.'
  } catch (error: unknown) {
    submitError.value = getErrorMessage(error, '포트폴리오 삭제에 실패했습니다.')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">Portfolio Editor</h1>
        <p class="text-sm text-muted">
          포트폴리오를 섹션(Basic / Contact / Intro / Featured Projects / Career) 단위로 조회하고
          저장할 수 있습니다.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UiButton
          color="neutral"
          variant="subtle"
          :icon="RefreshCw"
          :loading="isLoading"
          @click="handleRefresh"
        >
          새로고침
        </UiButton>
        <template v-if="portfolio">
          <UiButton
            v-if="!hasPortfolio"
            color="primary"
            :icon="Save"
            :loading="isSaving"
            @click="handleSave"
          >
            생성
          </UiButton>
          <UiButton
            color="error"
            variant="soft"
            :icon="Trash"
            :disabled="!hasPortfolio"
            :loading="isDeleting"
            @click="handleDelete"
          >
            삭제
          </UiButton>
        </template>
      </div>
    </div>

    <UiAlert
      v-if="loadErrorMessage || submitError"
      color="error"
      variant="subtle"
      title="요청을 처리하지 못했습니다."
      :description="loadErrorMessage || submitError"
    />

    <UiAlert
      v-if="successMessage"
      color="success"
      variant="subtle"
      title="완료"
      :description="successMessage"
    />

    <div v-if="!portfolio && !isLoading && !loadErrorMessage" class="space-y-4">
      <UiAlert
        color="warning"
        variant="subtle"
        title="포트폴리오가 아직 없습니다."
        description="새로 만들기 버튼을 눌러 포트폴리오를 작성할 수 있습니다."
      />
      <UiButton color="primary" :icon="Plus" @click="initPortfolio"> 새로 만들기 </UiButton>
    </div>

    <template v-if="isLoading">
      <UiCard v-for="index in 4" :key="index">
        <div class="space-y-3">
          <UiSkeleton class="h-5 w-40" />
          <UiSkeleton class="h-10 w-full" />
          <UiSkeleton class="h-24 w-full" />
        </div>
      </UiCard>
    </template>

    <template v-else-if="portfolio">
      <UiCard>
        <template #header>
          <div>
            <h2 class="font-semibold">Metadata</h2>
            <p class="text-sm text-muted">현재 CMS가 보고 있는 포트폴리오 문서 메타 정보입니다.</p>
          </div>
        </template>

        <div class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="item in metadataItems"
            :key="item.label"
            class="rounded-lg border border-default p-3"
          >
            <p class="text-xs uppercase tracking-wide text-muted">
              {{ item.label }}
            </p>
            <p class="mt-1 break-all text-sm">
              {{ item.value }}
            </p>
          </div>
        </div>
      </UiCard>

      <UiCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold">Basic</h2>
            <div class="flex items-center gap-2">
              <span v-if="lastAutoSavedAt.meta" class="text-xs text-muted">
                자동 저장 {{ formatAutoSavedAt(lastAutoSavedAt.meta) }}
              </span>
              <UiButton
                v-if="hasPortfolio"
                size="sm"
                :icon="Save"
                :loading="savingSection === 'meta'"
                @click="handleSaveSection('meta')"
              >
                저장
              </UiButton>
            </div>
          </div>
        </template>

        <div class="grid gap-4 sm:grid-cols-2">
          <UiFormField label="Slug">
            <UiInput v-model="portfolio.slug" placeholder="dev" />
          </UiFormField>

          <UiFormField label="Version">
            <UiInput v-model.number="portfolio.version" type="number" />
          </UiFormField>
        </div>
      </UiCard>

      <UiCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold">Contact</h2>
            <div class="flex items-center gap-2">
              <span v-if="lastAutoSavedAt.identity" class="text-xs text-muted">
                자동 저장 {{ formatAutoSavedAt(lastAutoSavedAt.identity) }}
              </span>
              <UiButton
                v-if="hasPortfolio"
                size="sm"
                :icon="Save"
                :loading="savingSection === 'identity'"
                @click="handleSaveSection('identity')"
              >
                저장
              </UiButton>
            </div>
          </div>
        </template>

        <div class="grid gap-4 sm:grid-cols-2">
          <UiFormField label="Name">
            <UiInput v-model="portfolio.identity.name" />
          </UiFormField>

          <UiFormField label="Email">
            <UiInput v-model="portfolio.identity.email" />
          </UiFormField>

          <UiFormField label="Github URL">
            <UiInput v-model="portfolio.identity.github_url" />
          </UiFormField>
        </div>
      </UiCard>

      <UiCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold">Intro</h2>
            <div class="flex items-center gap-2">
              <span v-if="lastAutoSavedAt.intro" class="text-xs text-muted">
                자동 저장 {{ formatAutoSavedAt(lastAutoSavedAt.intro) }}
              </span>
              <UiButton
                v-if="hasPortfolio"
                size="sm"
                :icon="Save"
                :loading="savingSection === 'intro'"
                @click="handleSaveSection('intro')"
              >
                저장
              </UiButton>
            </div>
          </div>
        </template>

        <div class="space-y-6">
          <UiFormField label="Content (Markdown)">
            <PortfolioMarkdownField
              v-model="portfolio.intro.content"
              placeholder="마크다운으로 인트로 텍스트를 작성하세요."
            />
          </UiFormField>

          <div>
            <div class="mb-3 flex items-center justify-between gap-3">
              <h3 class="font-medium">Tech Stack</h3>
              <UiButton size="sm" variant="subtle" :icon="Plus" @click="addTechStackItem">
                기술 추가
              </UiButton>
            </div>

            <div v-if="portfolio.intro?.tech_stack?.length" class="space-y-3">
              <div
                v-for="(item, index) in portfolio.intro.tech_stack"
                :key="index"
                class="grid items-center gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"
              >
                <UiInput v-model="item.name" placeholder="이름 (e.g. React)" />

                <div class="flex items-center gap-2">
                  <img
                    v-if="item.icon_url"
                    :src="item.icon_url"
                    :alt="item.name"
                    class="h-6 w-6 shrink-0 object-contain"
                  />
                  <span v-if="item.icon_url" class="truncate text-xs text-muted">
                    {{ item.icon_url.split('/').pop() }}
                  </span>
                  <span v-else class="text-xs text-muted">아이콘 없음</span>
                </div>

                <UiButton
                  size="sm"
                  variant="subtle"
                  :icon="Upload"
                  @click="($refs[`iconInput-${index}`] as HTMLInputElement[])?.[0]?.click()"
                >
                  업로드
                </UiButton>
                <input
                  :ref="`iconInput-${index}`"
                  type="file"
                  accept="image/svg+xml,image/png,image/webp"
                  class="hidden"
                  @change="handleIconUpload(index, $event)"
                />

                <UiButton
                  color="error"
                  variant="ghost"
                  :icon="Trash"
                  @click="removeTechStackItem(index)"
                />
              </div>
            </div>

            <UiEmptyState v-else :icon="CodeXml" label="No tech stack items" />
          </div>
        </div>
      </UiCard>

      <UiCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold">Featured Projects</h2>
            <div class="flex items-center gap-2">
              <span v-if="lastAutoSavedAt.featured_projects" class="text-xs text-muted">
                자동 저장 {{ formatAutoSavedAt(lastAutoSavedAt.featured_projects) }}
              </span>
              <UiButton size="sm" variant="subtle" :icon="Plus" @click="addProject">
                프로젝트 추가
              </UiButton>
              <UiButton
                v-if="hasPortfolio"
                size="sm"
                :icon="Save"
                :loading="savingSection === 'featured_projects'"
                @click="handleSaveSection('featured_projects')"
              >
                저장
              </UiButton>
            </div>
          </div>
        </template>

        <div v-if="portfolio.featured_projects.length" class="space-y-4">
          <details
            v-for="(project, projectIndex) in portfolio.featured_projects"
            :key="projectIndex"
            open
            class="rounded-xl border border-default p-4"
          >
            <summary class="mb-4 flex cursor-pointer items-center justify-between gap-3">
              <h3 class="font-medium">
                {{ project.title || project.slug || `Project ${projectIndex + 1}` }}
              </h3>
              <UiButton
                color="error"
                variant="ghost"
                :icon="Trash"
                @click.prevent="removeProject(projectIndex)"
              />
            </summary>

            <div class="grid gap-4 sm:grid-cols-2">
              <UiFormField label="Slug">
                <UiInput v-model="project.slug" />
              </UiFormField>

              <UiFormField label="Title">
                <UiInput v-model="project.title" />
              </UiFormField>

              <UiFormField label="Period">
                <UiInput v-model="project.period" />
              </UiFormField>

              <UiFormField label="Summary (Markdown)" class="sm:col-span-2">
                <PortfolioMarkdownField v-model="project.summary" />
              </UiFormField>

              <UiFormField label="Stack (one per line)" class="sm:col-span-2">
                <UiTextarea
                  :model-value="project.stack.join('\n')"
                  :rows="4"
                  autoresize
                  @update:model-value="updateProjectStack(projectIndex, $event)"
                />
              </UiFormField>

              <UiFormField label="Highlights (Markdown list)" class="sm:col-span-2">
                <PortfolioMarkdownField v-model="project.highlights_markdown" />
              </UiFormField>
            </div>

            <div class="mt-4 rounded-lg border border-default p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <h4 class="font-medium">Links</h4>
                <UiButton
                  size="sm"
                  variant="subtle"
                  :icon="Plus"
                  @click="addProjectLink(projectIndex)"
                >
                  링크 추가
                </UiButton>
              </div>

              <div class="space-y-3">
                <div
                  v-for="(link, linkIndex) in project.links"
                  :key="linkIndex"
                  class="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <UiInput v-model="link.label" placeholder="Label" />
                  <UiInput v-model="link.url" placeholder="URL" />
                  <UiButton
                    color="error"
                    variant="ghost"
                    :icon="Trash"
                    @click="removeProjectLink(projectIndex, linkIndex)"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>

        <UiEmptyState v-else :icon="FolderOpen" label="No featured projects" />
      </UiCard>

      <UiCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold">Career</h2>
            <div class="flex items-center gap-2">
              <span v-if="lastAutoSavedAt.career" class="text-xs text-muted">
                자동 저장 {{ formatAutoSavedAt(lastAutoSavedAt.career) }}
              </span>
              <UiButton size="sm" variant="subtle" :icon="Plus" @click="addCareerCompany">
                회사 추가
              </UiButton>
              <UiButton
                v-if="hasPortfolio"
                size="sm"
                :icon="Save"
                :loading="savingSection === 'career'"
                @click="handleSaveSection('career')"
              >
                저장
              </UiButton>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <UiFormField label="Summary Label">
              <UiInput v-model="portfolio.career.summary_label" />
            </UiFormField>

            <UiFormField label="Summary Value">
              <UiInput v-model="portfolio.career.summary_value" />
            </UiFormField>
          </div>

          <div v-if="portfolio.career.companies.length" class="space-y-4">
            <details
              v-for="(company, companyIndex) in portfolio.career.companies"
              :key="companyIndex"
              open
              class="rounded-xl border border-default p-4"
            >
              <summary class="mb-4 flex cursor-pointer items-center justify-between gap-3">
                <h3 class="font-medium">
                  {{ company.company || `Company ${companyIndex + 1}` }}
                </h3>
                <UiButton
                  color="error"
                  variant="ghost"
                  :icon="Trash"
                  @click.prevent="removeCareerCompany(companyIndex)"
                />
              </summary>

              <div class="grid gap-4 sm:grid-cols-2">
                <UiFormField label="Company">
                  <UiInput v-model="company.company" />
                </UiFormField>

                <UiFormField label="Period">
                  <UiInput v-model="company.period" />
                </UiFormField>

                <UiFormField label="Employment Type">
                  <UiInput v-model="company.employment_type" />
                </UiFormField>

                <UiFormField label="Role">
                  <UiInput v-model="company.role" />
                </UiFormField>

                <UiFormField label="Position" class="sm:col-span-2">
                  <UiInput v-model="company.position" />
                </UiFormField>
              </div>

              <div class="mt-4 rounded-lg border border-default p-4">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <h4 class="font-medium">Career Items</h4>
                  <UiButton
                    size="sm"
                    variant="subtle"
                    :icon="Plus"
                    @click="addCareerItem(companyIndex)"
                  >
                    항목 추가
                  </UiButton>
                </div>

                <div v-if="company.items.length" class="space-y-4">
                  <details
                    v-for="(item, itemIndex) in company.items"
                    :key="itemIndex"
                    open
                    class="rounded-lg border border-default p-4"
                  >
                    <summary class="mb-4 flex cursor-pointer items-center justify-between gap-3">
                      <h5 class="font-medium">
                        {{ item.title || `Item ${itemIndex + 1}` }}
                      </h5>
                      <UiButton
                        color="error"
                        variant="ghost"
                        :icon="Trash"
                        @click.prevent="removeCareerItem(companyIndex, itemIndex)"
                      />
                    </summary>

                    <div class="space-y-4">
                      <UiFormField label="Title">
                        <UiInput v-model="item.title" />
                      </UiFormField>

                      <UiFormField label="Period">
                        <UiInput v-model="item.period" />
                      </UiFormField>

                      <UiFormField label="Bullets (Markdown list)">
                        <PortfolioMarkdownField v-model="item.bullets_markdown" />
                      </UiFormField>
                    </div>
                  </details>
                </div>

                <UiEmptyState v-else :icon="BriefcaseBusiness" label="No career items" />
              </div>
            </details>
          </div>

          <UiEmptyState v-else :icon="Briefcase" label="No career companies" />
        </div>
      </UiCard>
    </template>
  </div>
</template>
