<script setup lang="ts">
import type {
  PortfolioCareerCompany,
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
  ChevronDown,
  ChevronLeft,
  CodeXml,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Plus,
  RefreshCw,
  Save,
  Trash,
  Upload,
} from 'lucide-vue-next'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from 'reka-ui'
import { handleUnauthorizedError, useAuthHeaders } from '~/composables/useAuthenticatedApi'
import { useToast } from '~/composables/useToast'
import { normalizePortfolioDocument } from '~/types/portfolio.types'

const authHeaders = useAuthHeaders()
const { push: pushToast } = useToast()

const isSaving = ref(false)
const savingSection = ref<PortfolioSectionKey | null>(null)
const isDeleting = ref(false)
const submitError = ref('')
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

// Featured Projects/Career를 Accordion으로 접었다 펼 수 있게 되면서, 예전
// `<details open>`(=항상 강제로 펼쳐짐)이 하던 "기본은 펼친 상태" 역할을 이 배열들이
// 대신한다. 항목이 추가/삭제될 때마다(목록이 재구성될 때) 전부 펼친 상태로 되돌리는
// 식으로 단순하게 관리한다 — 인덱스 기반 key라 항목 순서가 바뀌면 완벽하게 들어맞진
// 않지만, 어차피 이 컴포넌트 전체가 인덱스를 key로 쓰고 있어서 그 이상의 정교함은
// 이 화면에 과한 설계다.
const openCompanyKeys = ref<string[]>([])

function companyAccordionKey(index: number) {
  return `company-${index}`
}

function resetOpenAccordionKeys() {
  const p = portfolio.value
  openCompanyKeys.value = (p?.career?.companies ?? []).map((_, index) => companyAccordionKey(index))
}

// ── Featured Projects: 파일 탐색기(Finder) UI ──
// featured_projects는 평평한 배열이고 각 프로젝트의 folder 문자열이 그룹을 만든다.
// currentFolder=null → 루트(폴더 타일 + folder 없는 프로젝트), 값이 있으면 그 폴더 안.
// selectedIndex → 편집 폼을 연 프로젝트의 featured_projects 인덱스.
const currentFolder = ref<string | null>(null)
const selectedIndex = ref<number | null>(null)
// 프로젝트가 아직 없는 새 폴더 — folder는 프로젝트에만 붙으므로 저장 전까지만 목록에 유지된다.
const draftFolders = ref<string[]>([])
const draggingIndex = ref<number | null>(null)

const featuredProjects = computed(() => portfolio.value?.featured_projects ?? [])

const folderNames = computed(() => {
  const names: string[] = []
  for (const p of featuredProjects.value) {
    const f = p.folder?.trim()
    if (f && !names.includes(f)) names.push(f)
  }
  for (const f of draftFolders.value) if (f && !names.includes(f)) names.push(f)
  return names
})

function folderCount(name: string) {
  return featuredProjects.value.filter((p) => p.folder?.trim() === name).length
}

// { project, index } 목록 — 현재 위치(루트 또는 폴더 안).
const currentEntries = computed(() =>
  featuredProjects.value
    .map((project, index) => ({ project, index }))
    .filter(({ project }) =>
      currentFolder.value === null
        ? !project.folder?.trim()
        : project.folder?.trim() === currentFolder.value,
    ),
)

const selectedProject = computed(() =>
  selectedIndex.value === null ? null : (featuredProjects.value[selectedIndex.value] ?? null),
)

function resetFinderState() {
  currentFolder.value = null
  selectedIndex.value = null
  draftFolders.value = []
  draggingIndex.value = null
}

function openFolder(name: string) {
  currentFolder.value = name
  selectedIndex.value = null
}
function goToRoot() {
  currentFolder.value = null
  selectedIndex.value = null
}
function selectProject(index: number) {
  selectedIndex.value = index
}
function closeForm() {
  selectedIndex.value = null
}

function uniqueFolderName(base: string) {
  if (!folderNames.value.includes(base)) return base
  let n = 2
  while (folderNames.value.includes(`${base} ${n}`)) n += 1
  return `${base} ${n}`
}
function addFolder() {
  const name = uniqueFolderName('새 폴더')
  draftFolders.value.push(name)
  openFolder(name)
}
function renameFolder(oldName: string, rawNew: string) {
  const newName = rawNew.trim()
  if (!newName || newName === oldName) return
  for (const p of featuredProjects.value) {
    if (p.folder?.trim() === oldName) p.folder = newName
  }
  draftFolders.value = draftFolders.value.map((f) => (f === oldName ? newName : f))
  if (currentFolder.value === oldName) currentFolder.value = newName
}

function moveProjectToFolder(index: number, folder: string) {
  const p = featuredProjects.value[index]
  if (p) p.folder = folder
}
function onTileDrop(folder: string) {
  if (draggingIndex.value !== null) moveProjectToFolder(draggingIndex.value, folder)
  draggingIndex.value = null
}

function onRenameCurrentFolder(rawNew: string) {
  if (currentFolder.value !== null) renameFolder(currentFolder.value, rawNew)
}
function removeSelectedProject() {
  if (selectedIndex.value !== null) removeProject(selectedIndex.value)
}
function addSelectedProjectLink() {
  if (selectedIndex.value !== null) addProjectLink(selectedIndex.value)
}
function removeSelectedProjectLink(linkIndex: number) {
  if (selectedIndex.value !== null) removeProjectLink(selectedIndex.value, linkIndex)
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
  resetOpenAccordionKeys()
  resetFinderState()
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
    body_markdown: '',
    links: [createLink()],
    folder: '',
  }
}

function createCareerCompany(): PortfolioCareerCompany {
  return {
    company: '',
    period: '',
    employment_type: '',
    role: '',
    position: '',
    career_items_markdown: '',
  }
}

function addProject() {
  const p = portfolio.value
  if (!p) return
  const project = createProject()
  project.folder = currentFolder.value ?? ''
  p.featured_projects.push(project)
  selectedIndex.value = p.featured_projects.length - 1
}

function removeProject(index: number) {
  const p = portfolio.value
  if (!p) return
  p.featured_projects.splice(index, 1)
  if (selectedIndex.value === index) selectedIndex.value = null
  else if (selectedIndex.value !== null && selectedIndex.value > index) selectedIndex.value -= 1
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
  resetOpenAccordionKeys()
}

function removeCareerCompany(index: number) {
  const p = portfolio.value
  if (!p) return
  const career = p.career ?? { summary_label: '', summary_value: '', companies: [] }
  career.companies.splice(index, 1)
  p.career = career
  resetOpenAccordionKeys()
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
  await refresh()
}

async function handleSave() {
  submitError.value = ''
  isSaving.value = true

  try {
    const response = await authenticatedFetch<CMSResponse<PortfolioResponse>>(
      '/api/portfolio/update',
      {
        method: 'PUT',
        body: buildPayload(),
      },
    )

    const wasExisting = hasPortfolio.value
    assignPortfolio(response.data)
    pushToast(wasExisting ? '포트폴리오를 저장했습니다.' : '포트폴리오를 생성했습니다.')
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
// dev.tyange.com에 표시되는 순서: (헤더) identity → intro → career → 개인 프로젝트.
// meta(Basic = slug/version 등 문서 메타)는 사이트에 안 나오므로 맨 뒤.
const sectionTabOrder: PortfolioSectionKey[] = [
  'identity',
  'intro',
  'career',
  'featured_projects',
  'meta',
]
const activeTab = ref<PortfolioSectionKey>('identity')

// 탭을 바꾸면 Featured Projects 탐색기는 항상 루트/폼 닫힘 상태로 되돌린다 —
// 다른 탭 갔다 돌아왔을 때 이전 폴더 안에 갇혀 있지 않게.
watch(activeTab, () => resetFinderState())

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
      pushToast(`${sectionLabels[sectionKey]} 섹션을 저장했습니다.`)
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

watch(
  () => portfolio.value?.identity,
  () => scheduleSectionAutoSave('identity'),
  { deep: true },
)
watch(
  () => portfolio.value?.intro,
  () => scheduleSectionAutoSave('intro'),
  { deep: true },
)
watch(
  () => portfolio.value?.featured_projects,
  () => scheduleSectionAutoSave('featured_projects'),
  { deep: true },
)
watch(
  () => portfolio.value?.career,
  () => scheduleSectionAutoSave('career'),
  { deep: true },
)
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
  isDeleting.value = true

  try {
    await authenticatedFetch('/api/portfolio/delete', {
      method: 'DELETE',
    })

    assignPortfolio(null)
    pushToast('포트폴리오를 삭제했습니다.')
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

      <TabsRoot v-model="activeTab" class="space-y-4">
        <TabsList class="flex gap-4 overflow-x-auto border-b border-default">
          <TabsTrigger
            v-for="key in sectionTabOrder"
            :key="key"
            :value="key"
            class="shrink-0 border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-muted transition-colors hover:text-default data-[state=active]:border-primary data-[state=active]:text-primary"
            @click="resetFinderState()"
          >
            {{ sectionLabels[key] }}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meta">
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
        </TabsContent>

        <TabsContent value="identity">
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
        </TabsContent>

        <TabsContent value="intro">
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
              <!-- UiFormField(<label>)로 감싸면 md-editor-v3 내부의 숨은 <input type="file">이
                   라벨 클릭 대상이 돼서 에디터를 누를 때마다 파일 선택창이 뜬다. div로 감싼다. -->
              <div class="space-y-1">
                <span class="block text-sm font-medium">Content (Markdown)</span>
                <PortfolioMarkdownField
                  v-model="portfolio.intro.content"
                  placeholder="마크다운으로 인트로 텍스트를 작성하세요."
                />
              </div>

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
        </TabsContent>

        <TabsContent value="featured_projects">
          <UiCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <!-- 브레드크럼 (Finder 경로 표시줄) -->
                <div class="flex min-w-0 items-center gap-1.5">
                  <button
                    class="flex shrink-0 items-center gap-1.5 text-sm hover:text-slate-900"
                    :class="currentFolder === null ? 'font-semibold text-default' : 'text-muted'"
                    @click="goToRoot"
                  >
                    <FolderOpen class="size-4" />
                    Featured Projects
                  </button>
                  <template v-if="currentFolder !== null">
                    <span class="text-slate-300">/</span>
                    <input
                      :value="currentFolder"
                      class="w-40 rounded-md border border-default px-2 py-1 text-sm font-semibold text-default focus:outline-none focus:ring-1 focus:ring-green-500"
                      @change="(e) => onRenameCurrentFolder((e.target as HTMLInputElement).value)"
                    />
                  </template>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <span
                    v-if="lastAutoSavedAt.featured_projects"
                    class="hidden text-xs text-muted sm:inline"
                  >
                    자동 저장 {{ formatAutoSavedAt(lastAutoSavedAt.featured_projects) }}
                  </span>
                  <UiButton size="sm" variant="subtle" :icon="FolderPlus" @click="addFolder">
                    폴더
                  </UiButton>
                  <UiButton size="sm" variant="subtle" :icon="Plus" @click="addProject">
                    프로젝트
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

            <!-- 프로젝트('파일') 선택됨: 왼쪽 목록 + 오른쪽 편집 폼 -->
            <div v-if="selectedProject" class="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
              <div class="rounded-lg border border-default p-1.5">
                <button
                  v-for="{ project, index } in currentEntries"
                  :key="index"
                  class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm"
                  :class="
                    index === selectedIndex ? 'bg-green-50 text-green-800' : 'hover:bg-elevated'
                  "
                  @click="selectProject(index)"
                >
                  <FileText class="size-4 shrink-0 text-muted" />
                  <span class="truncate">
                    {{ project.title || project.slug || `Project ${index + 1}` }}
                  </span>
                </button>
                <p v-if="!currentEntries.length" class="px-2.5 py-2 text-xs text-muted">
                  이 위치에 프로젝트가 없습니다.
                </p>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="truncate font-semibold">
                    {{ selectedProject.title || selectedProject.slug || '새 프로젝트' }}
                  </h3>
                  <div class="flex shrink-0 items-center gap-1">
                    <UiButton size="sm" variant="ghost" @click="closeForm">닫기</UiButton>
                    <UiTooltip text="삭제">
                      <UiButton
                        color="error"
                        variant="ghost"
                        :icon="Trash"
                        @click="removeSelectedProject"
                      />
                    </UiTooltip>
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <UiFormField label="Slug">
                    <UiInput v-model="selectedProject.slug" />
                  </UiFormField>
                  <UiFormField label="Title">
                    <UiInput v-model="selectedProject.title" />
                  </UiFormField>
                  <UiFormField label="Period">
                    <UiInput v-model="selectedProject.period" />
                  </UiFormField>
                  <UiFormField label="Folder">
                    <UiInput v-model="selectedProject.folder" placeholder="예: CMS 시스템" />
                    <p class="text-xs text-muted">
                      비우면 폴더 밖(단독 카드). 그리드에서 폴더 위로 끌어다 놔도 이동됩니다.
                    </p>
                  </UiFormField>
                  <div class="space-y-1 sm:col-span-2">
                    <span class="block text-sm font-medium">Description (Markdown)</span>
                    <PortfolioMarkdownField v-model="selectedProject.body_markdown" />
                  </div>
                </div>

                <div class="rounded-lg border border-default p-4">
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <h4 class="font-medium">Links</h4>
                    <UiButton
                      size="sm"
                      variant="subtle"
                      :icon="Plus"
                      @click="addSelectedProjectLink"
                    >
                      링크 추가
                    </UiButton>
                  </div>
                  <div class="space-y-3">
                    <div
                      v-for="(link, linkIndex) in selectedProject.links"
                      :key="linkIndex"
                      class="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                    >
                      <UiInput v-model="link.label" placeholder="Label" />
                      <UiInput v-model="link.url" placeholder="URL" />
                      <UiButton
                        color="error"
                        variant="ghost"
                        :icon="Trash"
                        @click="removeSelectedProjectLink(linkIndex)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 선택 없음: 아이콘 그리드 -->
            <div v-else>
              <div
                v-if="(currentFolder === null && folderNames.length) || currentEntries.length"
                class="grid grid-cols-3 gap-2 sm:grid-cols-4"
              >
                <button
                  v-for="name in currentFolder === null ? folderNames : []"
                  :key="'folder-' + name"
                  class="flex flex-col items-center gap-1.5 rounded-xl border border-default p-4 text-center hover:bg-elevated"
                  @click="openFolder(name)"
                  @dragover.prevent
                  @drop="onTileDrop(name)"
                >
                  <Folder class="size-11 text-green-500" :stroke-width="1.25" />
                  <span class="w-full truncate text-sm font-semibold text-default">{{ name }}</span>
                  <span class="text-xs text-muted">{{ folderCount(name) }}개</span>
                </button>

                <button
                  v-for="{ project, index } in currentEntries"
                  :key="'file-' + index"
                  class="flex flex-col items-center gap-1.5 rounded-xl border border-transparent p-4 text-center hover:bg-elevated"
                  draggable="true"
                  @dragstart="draggingIndex = index"
                  @dragend="draggingIndex = null"
                  @click="selectProject(index)"
                >
                  <FileText class="size-10 text-slate-400" :stroke-width="1.25" />
                  <span class="w-full truncate text-sm font-medium text-default">
                    {{ project.title || project.slug || `Project ${index + 1}` }}
                  </span>
                  <span class="w-full truncate text-xs text-muted">{{ project.slug || '—' }}</span>
                </button>
              </div>

              <UiEmptyState v-else :icon="FolderOpen" label="비어 있습니다" />

              <div
                v-if="currentFolder !== null"
                class="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted"
              >
                <button class="flex items-center gap-1 hover:text-default" @click="goToRoot">
                  <ChevronLeft class="size-4" /> Featured Projects
                </button>
                <span
                  class="rounded-md border border-dashed border-default px-2 py-1 text-xs"
                  @dragover.prevent
                  @drop="onTileDrop('')"
                >
                  여기로 끌어다 놓으면 폴더에서 빼기
                </span>
              </div>
            </div>
          </UiCard>
        </TabsContent>

        <TabsContent value="career">
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

              <AccordionRoot
                v-if="portfolio.career.companies.length"
                v-model="openCompanyKeys"
                type="multiple"
                class="space-y-4"
              >
                <AccordionItem
                  v-for="(company, companyIndex) in portfolio.career.companies"
                  :key="companyIndex"
                  :value="companyAccordionKey(companyIndex)"
                  class="rounded-xl border border-default p-4"
                >
                  <AccordionHeader as="div" class="flex items-center justify-between gap-3">
                    <AccordionTrigger
                      class="group flex flex-1 cursor-pointer items-center justify-between gap-3 text-left"
                    >
                      <h3 class="font-medium">
                        {{ company.company || `Company ${companyIndex + 1}` }}
                      </h3>
                      <ChevronDown
                        class="size-4 shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180"
                      />
                    </AccordionTrigger>
                    <UiTooltip text="삭제">
                      <UiButton
                        color="error"
                        variant="ghost"
                        :icon="Trash"
                        @click="removeCareerCompany(companyIndex)"
                      />
                    </UiTooltip>
                  </AccordionHeader>

                  <AccordionContent class="pt-4">
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

                    <div class="mt-4 space-y-1">
                      <span class="block text-sm font-medium">Career Items (Markdown)</span>
                      <PortfolioMarkdownField v-model="company.career_items_markdown" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </AccordionRoot>

              <UiEmptyState v-else :icon="Briefcase" label="No career companies" />
            </div>
          </UiCard>
        </TabsContent>
      </TabsRoot>
    </template>
  </div>
</template>
