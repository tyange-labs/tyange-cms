<script setup lang="ts">
import { ArrowDown, ArrowUp, Download, Plus, RotateCcw, Save, Trash } from 'lucide-vue-next'
import type {
  PortfolioPdfDocument,
  PortfolioPdfPage,
  PortfolioPdfTemplate,
} from '~/types/portfolio-pdf.types'
import { newPortfolioPdfPageId, PORTFOLIO_PDF_MAX_PAGES } from '~/types/portfolio-pdf.types'
import { PORTFOLIO_PDF_TEMPLATES, PORTFOLIO_PDF_TEMPLATE_KEYS } from '~/utils/portfolio-pdf-schema'
import { createDefaultPortfolioPdf } from '~/utils/portfolio-pdf-default'
import { fetchPortfolioPdf, savePortfolioPdf } from '~/composables/usePortfolioPdf'
import { useToast } from '~/composables/useToast'

// PDF 포트폴리오 편집기. 페이지 목록(추가·삭제·순서) / 선택한 페이지 폼 / 실시간 미리보기.
// 저장은 cms-api의 `portfolio_pdf` 포트폴리오 섹션이고, PDF는 /portfolio-pdf/print에서 브라우저 인쇄로 만든다.
definePageMeta({ layout: false, middleware: ['auth'] })

const { push: pushToast } = useToast()

const doc = ref<PortfolioPdfDocument | null>(null)
const selectedId = ref('')
const loadError = ref('')
const saveError = ref('')
const isSaving = ref(false)
const dirty = ref(false)
const newTemplate = ref<PortfolioPdfTemplate>('cards')
// 셀렉트는 문자열 목록만 받으므로 사람이 읽는 라벨로 보여 주고 키로 되돌린다.
const templateLabels = PORTFOLIO_PDF_TEMPLATE_KEYS.map((key) => PORTFOLIO_PDF_TEMPLATES[key].label)
const newTemplateLabel = computed({
  get: () => PORTFOLIO_PDF_TEMPLATES[newTemplate.value].label,
  set: (label: string) => {
    newTemplate.value =
      PORTFOLIO_PDF_TEMPLATE_KEYS.find((key) => PORTFOLIO_PDF_TEMPLATES[key].label === label) ??
      newTemplate.value
  },
})

const selected = computed(() => doc.value?.pages.find((p) => p.id === selectedId.value) ?? null)
const selectedIndex = computed(
  () => doc.value?.pages.findIndex((p) => p.id === selectedId.value) ?? -1,
)

onMounted(async () => {
  try {
    const { doc: loaded } = await fetchPortfolioPdf()
    doc.value = loaded
    selectedId.value = loaded.pages[0]?.id ?? ''
    // 로드 직후의 변경(normalize)은 사용자 편집이 아니므로 dirty를 켜지 않는다.
    await nextTick()
    dirty.value = false
  } catch {
    loadError.value = '포트폴리오 PDF를 불러오지 못했습니다. 로그인 상태와 서버를 확인해 주세요.'
  }
})

watch(
  doc,
  () => {
    dirty.value = true
  },
  { deep: true },
)

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) event.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

function addPage() {
  if (!doc.value || doc.value.pages.length >= PORTFOLIO_PDF_MAX_PAGES) return
  const page: PortfolioPdfPage = {
    id: newPortfolioPdfPageId(),
    template: newTemplate.value,
    dark: false,
    data: PORTFOLIO_PDF_TEMPLATES[newTemplate.value].defaults(),
  }
  const at = selectedIndex.value >= 0 ? selectedIndex.value + 1 : doc.value.pages.length
  doc.value.pages.splice(at, 0, page)
  selectedId.value = page.id
}

function removePage(id: string) {
  if (!doc.value) return
  const index = doc.value.pages.findIndex((p) => p.id === id)
  if (index < 0 || !window.confirm('이 페이지를 삭제할까요?')) return
  doc.value.pages.splice(index, 1)
  if (selectedId.value === id) {
    selectedId.value = doc.value.pages[Math.min(index, doc.value.pages.length - 1)]?.id ?? ''
  }
}

function movePage(index: number, delta: number) {
  if (!doc.value) return
  const target = index + delta
  if (target < 0 || target >= doc.value.pages.length) return
  const [page] = doc.value.pages.splice(index, 1)
  doc.value.pages.splice(target, 0, page!)
}

// 드래그로 순서 바꾸기(버튼과 같은 동작을 마우스로도)
const dragIndex = ref<number | null>(null)
function onDrop(target: number) {
  if (!doc.value || dragIndex.value === null || dragIndex.value === target) return
  const [page] = doc.value.pages.splice(dragIndex.value, 1)
  doc.value.pages.splice(target, 0, page!)
  dragIndex.value = null
}

function resetToDefault() {
  if (
    !window.confirm(
      '편집 중인 내용을 버리고 기본 문서로 되돌릴까요? (저장 전까지 서버 내용은 그대로입니다)',
    )
  )
    return
  doc.value = createDefaultPortfolioPdf()
  selectedId.value = doc.value.pages[0]?.id ?? ''
}

async function save(options: { silent?: boolean } = {}) {
  if (!doc.value) return false
  isSaving.value = true
  saveError.value = ''
  try {
    await savePortfolioPdf(doc.value)
    dirty.value = false
    if (!options.silent) pushToast('포트폴리오 PDF를 저장했습니다.')
    return true
  } catch (error) {
    const data = (error as { data?: { message?: string } | string })?.data
    saveError.value = (typeof data === 'string' ? data : data?.message) || '저장하지 못했습니다.'
    return false
  } finally {
    isSaving.value = false
  }
}

async function download() {
  if (dirty.value && !(await save({ silent: true }))) return
  window.open('/portfolio-pdf/print', '_blank')
}

// 미리보기: 1920×1080 페이지를 컨테이너 폭에 맞춰 축소해서 보여 준다.
const previewBox = ref<HTMLElement | null>(null)
const scale = ref(0.4)
let observer: ResizeObserver | null = null
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    if (entry) scale.value = Math.min(entry.contentRect.width / 1920, 0.6)
  })
  watch(previewBox, (el) => el && observer?.observe(el), { immediate: true })
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <DashBoardHeader />
    <div class="mx-auto w-full max-w-[1600px] flex-1 px-5 py-5" data-testid="portfolio-pdf-editor">
      <UiAlert v-if="loadError" color="error" :title="loadError" />

      <div v-else-if="doc" class="space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="mr-2 text-xl font-semibold">PDF 포트폴리오</h1>
          <span class="text-sm text-muted"
            >{{ doc.pages.length }} / {{ PORTFOLIO_PDF_MAX_PAGES }}장</span
          >
          <span v-if="dirty" class="text-sm text-amber-600">저장하지 않은 변경</span>
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <label class="flex items-center gap-1 text-sm">
              포인트
              <input
                v-model="doc.theme.accent"
                type="color"
                class="h-8 w-9 cursor-pointer rounded border border-default"
                aria-label="포인트 색"
              />
            </label>
            <label class="flex items-center gap-1 text-sm">
              어두운 페이지
              <input
                v-model="doc.theme.accent_dark"
                type="color"
                class="h-8 w-9 cursor-pointer rounded border border-default"
                aria-label="어두운 페이지 포인트 색"
              />
            </label>
            <UiButton color="neutral" variant="ghost" :icon="RotateCcw" @click="resetToDefault"
              >기본값</UiButton
            >
            <UiButton
              color="neutral"
              variant="soft"
              :icon="Save"
              :loading="isSaving"
              @click="save()"
              >저장</UiButton
            >
            <UiButton :icon="Download" data-testid="portfolio-pdf-download" @click="download"
              >PDF 다운로드</UiButton
            >
          </div>
        </div>
        <UiAlert v-if="saveError" color="error" :title="saveError" />

        <div class="grid gap-4 lg:grid-cols-[240px_380px_minmax(0,1fr)]">
          <!-- 페이지 목록 -->
          <aside class="space-y-2" data-testid="portfolio-pdf-page-list">
            <ol class="space-y-1">
              <li
                v-for="(page, i) in doc.pages"
                :key="page.id"
                draggable="true"
                class="flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm"
                :class="
                  page.id === selectedId
                    ? 'border-primary bg-green-50'
                    : 'border-default bg-default'
                "
                @dragstart="dragIndex = i"
                @dragover.prevent
                @drop.prevent="onDrop(i)"
              >
                <button
                  type="button"
                  class="min-w-0 flex-1 truncate text-left"
                  @click="selectedId = page.id"
                >
                  <span class="mr-1 font-mono text-xs text-muted">{{
                    String(i + 1).padStart(2, '0')
                  }}</span>
                  {{ PORTFOLIO_PDF_TEMPLATES[page.template].label }}
                  <span class="block truncate text-xs text-muted">{{
                    page.data.title || page.data.name || page.data.label
                  }}</span>
                </button>
                <UiButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :icon="ArrowUp"
                  aria-label="위로"
                  :disabled="i === 0"
                  @click="movePage(i, -1)"
                />
                <UiButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :icon="ArrowDown"
                  aria-label="아래로"
                  :disabled="i === doc.pages.length - 1"
                  @click="movePage(i, 1)"
                />
                <UiButton
                  color="error"
                  variant="ghost"
                  size="sm"
                  :icon="Trash"
                  aria-label="페이지 삭제"
                  @click="removePage(page.id)"
                />
              </li>
            </ol>
            <div class="space-y-1 rounded-md border border-dashed border-default p-2">
              <UiSelect v-model="newTemplateLabel" :items="templateLabels" class="w-full" />
              <p class="text-xs text-muted">
                {{ PORTFOLIO_PDF_TEMPLATES[newTemplate].label }} —
                {{ PORTFOLIO_PDF_TEMPLATES[newTemplate].description }}
              </p>
              <UiButton
                block
                color="neutral"
                variant="soft"
                :icon="Plus"
                :disabled="doc.pages.length >= PORTFOLIO_PDF_MAX_PAGES"
                data-testid="portfolio-pdf-add-page"
                @click="addPage"
              >
                페이지 추가
              </UiButton>
            </div>
          </aside>

          <!-- 선택한 페이지 폼 -->
          <section
            v-if="selected"
            :key="selected.id"
            class="space-y-3"
            data-testid="portfolio-pdf-form"
          >
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">{{ PORTFOLIO_PDF_TEMPLATES[selected.template].label }}</h2>
              <label class="flex items-center gap-2 text-sm">
                <input v-model="selected.dark" type="checkbox" /> 어두운 배경
              </label>
            </div>
            <PortfolioPdfFieldEditor
              v-model="selected.data"
              :fields="PORTFOLIO_PDF_TEMPLATES[selected.template].fields"
            />
          </section>
          <section v-else class="text-sm text-muted">
            왼쪽에서 페이지를 고르거나 추가하세요.
          </section>

          <!-- 미리보기 -->
          <div ref="previewBox" class="min-w-0" data-testid="portfolio-pdf-preview">
            <div
              v-if="selected"
              :style="{ width: `${1920 * scale}px`, height: `${1080 * scale}px` }"
              class="overflow-hidden rounded-md border border-default shadow-sm"
            >
              <div
                :style="{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: '1920px',
                  height: '1080px',
                }"
              >
                <PortfolioPdfPageView
                  :page="selected"
                  :index="selectedIndex"
                  :total="doc.pages.length"
                  :theme="doc.theme"
                />
              </div>
            </div>
            <p class="mt-2 text-xs text-muted">
              미리보기는 실제 PDF와 같은 컴포넌트로 그려집니다. 'PDF 다운로드'는 인쇄 창을 열고,
              대상을 <b>PDF로 저장</b>으로 두면 됩니다.
            </p>
          </div>
        </div>
      </div>
      <UiSkeleton v-else class="h-64 w-full" />
    </div>
    <ClientOnly><UiToaster /></ClientOnly>
  </div>
</template>
