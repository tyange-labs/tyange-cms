<script setup lang="ts">
import type { PostListItem, Tag, TagWithCategory } from '~/types/editor.types'
import type { CMSResponse } from '~/types/response.types'
import { CalendarDate } from '@internationalized/date'
import KO_KR from '@vavt/cm-extension/dist/locale/ko-KR'
import imageCompression from 'browser-image-compression'
import { getDate, getMonth, getYear } from 'date-fns'
import { MdEditor, config as MdEditorConfig } from 'md-editor-v3'
import { POST_STATUS } from '~/constants/post-status.constant'
import 'md-editor-v3/lib/style.css'

const props = defineProps<{ data?: PostListItem }>()

MdEditorConfig({
  editorConfig: {
    languageUserDefined: { 'ko-KR': KO_KR },
  },
})

const config = useRuntimeConfig()
const authStore = useAuthStore()

const publishedAtProps = computed(() => props.data?.published_at.split('-'))
const currentDate = new Date()

const postId = ref<string | null>(props.data?.post_id ?? null)
const enteredTitle = ref(props.data?.title ?? '')
const enteredDescription = ref(props.data?.description ?? '')
const submitError = ref('')
const isSaving = ref(false)
const isAutoSaving = ref(false)
const hasUnsavedChanges = ref(false)
const lastSavedAt = ref<Date | null>(props.data ? new Date() : null)
const autoSaveDelay = 1500
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
let queuedAutoSave = false
let queuedNavigateAfterSave = false

const initialDate = publishedAtProps.value
  ? new CalendarDate(
      Number(publishedAtProps.value[0]),
      Number(publishedAtProps.value[1]),
      Number(publishedAtProps.value[2]),
    )
  : new CalendarDate(getYear(currentDate), getMonth(currentDate) + 1, getDate(currentDate))

const enteredPublishedAt = shallowRef(initialDate)
const enteredTags = ref<Tag[]>(props.data?.tags ?? [])
const enteredContent = ref(props.data?.content ?? '')
const status = ref<POST_STATUS>(props.data?.status ?? POST_STATUS.DRAFT)
const lastSavedSnapshot = ref('')

const formattedLastSavedAt = computed(() => {
  if (!lastSavedAt.value) {
    return ''
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(lastSavedAt.value)
})

const saveStatusMessage = computed(() => {
  if (submitError.value) {
    return '저장에 실패했습니다. 내용을 확인한 뒤 다시 시도해 주세요.'
  }

  if (isAutoSaving.value) {
    return '자동 저장 중입니다...'
  }

  if (isSaving.value) {
    return '저장 중입니다...'
  }

  if (hasUnsavedChanges.value) {
    return '저장되지 않은 변경사항이 있습니다.'
  }

  if (formattedLastSavedAt.value) {
    return `마지막 저장 ${formattedLastSavedAt.value}`
  }

  return '변경사항이 생기면 자동으로 저장됩니다.'
})

const tagsByCategory = computed(() => {
  const map = new Map<string, string[]>()
  for (const t of enteredTags.value) {
    const arr = map.get(t.category) || []
    arr.push(t.tag)
    map.set(t.category, arr)
  }
  return map
})

function setTagsForCategory(category: string, selected: string[]) {
  const otherTags = enteredTags.value.filter((t) => t.category !== category)
  const newTags = selected.map((tag) => ({ tag, category }))
  enteredTags.value = [...otherTags, ...newTags]
}
const { data: tagCategories } =
  await useFetch<CMSResponse<TagWithCategory[]>>('/api/tags-with-category')

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
    return '관리자만 포스트를 수정할 수 있습니다.'
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

function buildPostPayload() {
  return {
    title: enteredTitle.value,
    description: enteredDescription.value,
    published_at: enteredPublishedAt.value.toString(),
    tags: enteredTags.value,
    content: enteredContent.value,
    status: status.value,
  }
}

function buildSnapshot() {
  return JSON.stringify(buildPostPayload())
}

function hasMeaningfulContent() {
  return Boolean(
    enteredTitle.value.trim() ||
    enteredDescription.value.trim() ||
    enteredContent.value.trim() ||
    enteredTags.value.length,
  )
}

function clearAutoSaveTimer() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

async function savePost(options?: { navigateOnSuccess?: boolean; isAutoSave?: boolean }) {
  const navigateOnSuccess = options?.navigateOnSuccess ?? false
  const isAutoSaveRequest = options?.isAutoSave ?? false

  if (!authStore.accessToken) {
    submitError.value = '로그인 정보가 없습니다.'
    return false
  }

  if (!postId.value && isAutoSaveRequest && !hasMeaningfulContent()) {
    return false
  }

  if (isSaving.value) {
    queuedAutoSave = queuedAutoSave || isAutoSaveRequest
    queuedNavigateAfterSave = queuedNavigateAfterSave || navigateOnSuccess
    return false
  }

  clearAutoSaveTimer()
  submitError.value = ''
  isSaving.value = true
  isAutoSaving.value = isAutoSaveRequest

  try {
    const payload = buildPostPayload()
    const requestUrl = postId.value ? `/api/post/update?id=${postId.value}` : '/api/post/upload'
    const requestMethod = postId.value ? 'PUT' : 'POST'
    const requestBody = postId.value ? { post_id: postId.value, ...payload } : payload

    const res = await authenticatedFetch<CMSResponse<PostListItem>>(requestUrl, {
      method: requestMethod,
      body: requestBody,
    })

    postId.value = res.data?.post_id ?? postId.value
    lastSavedSnapshot.value = buildSnapshot()
    lastSavedAt.value = new Date()
    hasUnsavedChanges.value = false

    if (res.status && navigateOnSuccess) await navigateTo('/managing-blog')

    return true
  } catch (err: unknown) {
    submitError.value = getErrorMessage(
      err,
      postId.value ? '포스트 수정에 실패했습니다.' : '포스트 생성에 실패했습니다.',
    )
    return false
  } finally {
    isSaving.value = false
    isAutoSaving.value = false

    if (queuedAutoSave || queuedNavigateAfterSave) {
      const nextShouldNavigate = queuedNavigateAfterSave
      queuedAutoSave = false
      queuedNavigateAfterSave = false

      if (hasUnsavedChanges.value) {
        await savePost({
          navigateOnSuccess: nextShouldNavigate,
          isAutoSave: !nextShouldNavigate,
        })
      } else if (nextShouldNavigate) {
        await navigateTo('/managing-blog')
      }
    }
  }
}

async function handleSubmitPost() {
  await savePost({ navigateOnSuccess: true })
}

async function ensurePostExists() {
  if (postId.value) {
    return true
  }

  const saved = await savePost({ isAutoSave: true })

  if (!saved || !postId.value) {
    submitError.value = '이미지 업로드 전에 포스트를 자동 저장하지 못했습니다.'
    return false
  }

  return true
}

async function handleUploadImage(files: Array<File>, callback: (urls: string[]) => void) {
  if (!authStore.accessToken) {
    submitError.value = '로그인 정보가 없습니다.'
    return
  }

  const hasPost = await ensurePostExists()
  if (!hasPost || !postId.value) {
    return
  }

  try {
    const results = []
    for (const file of files) {
      const compressedFile = await imageCompression(file, { maxSizeMB: 2, useWebWorker: true })
      const formData = new FormData()
      formData.append('file', compressedFile)
      const res = await authenticatedFetch<CMSResponse<{ image_path: string }>>(
        `/api/post/upload-image?id=${postId.value}`,
        {
          method: 'POST',
          body: formData,
        },
      )
      if (!res.data?.image_path) {
        throw new Error('이미지 업로드 응답이 비어 있습니다.')
      }
      results.push(`${config.public.tyangeCmsApiBaseProd}${res.data.image_path}`)
    }
    callback(results)
  } catch (error: unknown) {
    submitError.value = getErrorMessage(error, '이미지 업로드에 실패했습니다.')
  }
}

function scheduleAutoSave() {
  clearAutoSaveTimer()

  autoSaveTimer = setTimeout(() => {
    if (!hasUnsavedChanges.value) {
      return
    }

    void savePost({ isAutoSave: true })
  }, autoSaveDelay)
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges.value && !isSaving.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

watch(
  [enteredTitle, enteredDescription, enteredPublishedAt, enteredTags, enteredContent, status],
  () => {
    const nextSnapshot = buildSnapshot()
    hasUnsavedChanges.value = nextSnapshot !== lastSavedSnapshot.value

    if (!hasUnsavedChanges.value) {
      clearAutoSaveTimer()
      return
    }

    scheduleAutoSave()
  },
  { deep: true },
)

onMounted(() => {
  lastSavedSnapshot.value = buildSnapshot()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  clearAutoSaveTimer()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="space-y-6">
    <UiAlert
      v-if="submitError"
      color="error"
      variant="subtle"
      title="요청을 처리하지 못했습니다."
      :description="submitError"
    />

    <UiAlert color="neutral" variant="soft" title="자동 저장" :description="saveStatusMessage" />

    <div class="space-y-4">
      <UiFormField label="TITLE">
        <UiInput v-model="enteredTitle" />
      </UiFormField>

      <UiFormField label="DESCRIPTION">
        <UiInput v-model="enteredDescription" />
      </UiFormField>

      <UiFormField v-if="tagCategories && tagCategories.data" label="TAGS">
        <div v-for="category in tagCategories.data" :key="category.category">
          <p>{{ category.category }}</p>
          <UiTagsCombobox
            :model-value="tagsByCategory.get(category.category) ?? []"
            :items="category.tags"
            placeholder="태그 검색..."
            @update:model-value="(val: string[]) => setTagsForCategory(category.category, val)"
          />
        </div>
      </UiFormField>
    </div>

    <div class="flex flex-wrap items-end gap-4">
      <UiFormField label="PUBLISHED AT">
        <UiDateInput v-model="enteredPublishedAt" />
      </UiFormField>

      <UiFormField label="STATUS">
        <UiSelect v-model="status" :items="Object.values(POST_STATUS)" class="w-36" />
      </UiFormField>

      <div>
        <UiButton color="primary" :loading="isSaving" @click="handleSubmitPost">
          {{ postId ? 'SAVE & EXIT' : 'CREATE & EXIT' }}
        </UiButton>
      </div>
    </div>

    <MdEditor v-model="enteredContent" language="ko-KR" @on-upload-img="handleUploadImage" />
  </div>
</template>
