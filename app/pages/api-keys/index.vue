<script setup lang="ts">
import type {
  ApiKeyItem,
  ApiKeyListResponse,
  ApiKeyRole,
  CreatedApiKey,
} from '~/types/api-keys.types'
import type { CMSResponse } from '~/types/response.types'
import { Copy, KeyRound, Plus } from 'lucide-vue-next'
import {
  authenticatedFetch,
  handleUnauthorizedError,
  useAuthHeaders,
} from '~/composables/useAuthenticatedApi'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const ROLES: ApiKeyRole[] = ['admin', 'user']
const NAME_MAX = 50

const authHeaders = useAuthHeaders()
const toast = useToast()

const { data, refresh, status, error } = await useFetch<CMSResponse<ApiKeyListResponse>>(
  '/api/api-keys',
  {
    headers: authHeaders,
    credentials: 'include',
    server: false,
  },
)

watch(
  error,
  async (value) => {
    if (value) {
      await handleUnauthorizedError(value)
    }
  },
  { immediate: true },
)

function getErrorMessage(err: unknown, fallback: string) {
  const fetchError = err as {
    data?: { message?: string } | string
    statusCode?: number
    statusMessage?: string
  }

  if (fetchError?.statusCode === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (fetchError?.statusCode === 403) {
    return '관리자만 API 키를 다룰 수 있습니다.'
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

  return fetchError?.statusMessage || fallback
}

const keys = computed(() => data.value?.data?.keys ?? [])
const activeKeys = computed(() => keys.value.filter((key) => !key.revoked_at))
const revokedKeys = computed(() => keys.value.filter((key) => key.revoked_at))
const isLoading = computed(() => status.value === 'pending')
const loadErrorMessage = computed(() =>
  error.value ? getErrorMessage(error.value, 'API 키 목록을 불러오지 못했습니다.') : '',
)

const seoulFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatTime(iso: string | null) {
  if (!iso) {
    return null
  }

  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? iso : seoulFormatter.format(parsed)
}

const name = ref('')
const role = ref<ApiKeyRole>('admin')
const isCreating = ref(false)
const actionError = ref('')
const createdKey = ref<CreatedApiKey | null>(null)

const nameTooLong = computed(() => [...name.value.trim()].length > NAME_MAX)
const canCreate = computed(
  () => name.value.trim().length > 0 && !nameTooLong.value && !isCreating.value,
)

async function createKey() {
  if (!canCreate.value) {
    return
  }

  isCreating.value = true
  actionError.value = ''

  try {
    const response = await authenticatedFetch<CMSResponse<CreatedApiKey>>('/api/api-keys', {
      method: 'POST',
      body: { name: name.value.trim(), role: role.value },
    })

    createdKey.value = response.data
    name.value = ''
    await refresh()
  } catch (err) {
    actionError.value = getErrorMessage(err, 'API 키를 만들지 못했습니다.')
  } finally {
    isCreating.value = false
  }
}

async function copyKey() {
  if (!createdKey.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(createdKey.value.key)
    toast.push('키를 복사했습니다')
  } catch {
    toast.push('복사하지 못했습니다. 직접 선택해 복사해 주세요')
  }
}

// 폐기는 되돌릴 수 없어서 같은 버튼을 한 번 더 눌러야 실행한다(브라우저 confirm 창은 쓰지 않는다).
const confirmingId = ref<number | null>(null)
const revokingId = ref<number | null>(null)

async function revokeKey(key: ApiKeyItem) {
  if (confirmingId.value !== key.api_key_id) {
    confirmingId.value = key.api_key_id
    return
  }

  revokingId.value = key.api_key_id
  actionError.value = ''

  try {
    await authenticatedFetch(`/api/api-keys/revoke?id=${key.api_key_id}`, { method: 'DELETE' })
    confirmingId.value = null
    await refresh()
    toast.push('키를 폐기했습니다')
  } catch (err) {
    actionError.value = getErrorMessage(err, '키를 폐기하지 못했습니다.')
  } finally {
    revokingId.value = null
  }
}
</script>

<template>
  <div data-testid="api-keys-page" class="space-y-6">
    <UiAlert
      v-if="loadErrorMessage || actionError"
      color="error"
      variant="subtle"
      title="요청을 처리하지 못했습니다."
      :description="loadErrorMessage || actionError"
    />

    <UiCard>
      <div class="space-y-1">
        <h2 class="font-semibold">API 키</h2>
        <p class="text-sm text-muted">
          <code>tyange</code> CLI처럼 비밀번호 없이 CMS를 쓰는 프로그램을 위한 키입니다. 키는 만든
          직후 한 번만 보여 주고, 서버에는 해시만 저장합니다. 새는 것 같으면 바로 폐기하세요.
        </p>
      </div>

      <form
        class="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        @submit.prevent="createKey"
      >
        <UiFormField label="이름">
          <UiInput
            v-model="name"
            data-testid="api-key-name"
            placeholder="예: tyange CLI (맥북)"
            autocomplete="off"
          />
        </UiFormField>
        <UiFormField label="권한">
          <UiSelect v-model="role" data-testid="api-key-role" :items="ROLES" class="w-28" />
        </UiFormField>
        <UiButton
          type="submit"
          :icon="Plus"
          :loading="isCreating"
          :disabled="!canCreate"
          data-testid="api-key-create"
        >
          키 만들기
        </UiButton>
      </form>
      <p v-if="nameTooLong" class="mt-2 text-sm text-error">
        이름은 {{ NAME_MAX }}자 이하여야 합니다.
      </p>
      <p class="mt-2 text-xs text-muted">
        <b>admin</b>은 관리 API(전체 글 목록, Craft 동기화 등)까지, <b>user</b>는 글·이미지 쓰기만
        가능합니다. CLI에는 admin이 필요합니다.
      </p>
    </UiCard>

    <div
      v-if="createdKey"
      data-testid="api-key-created"
      class="rounded-lg bg-green-50 p-4 text-green-800 ring-1 ring-inset ring-green-200"
    >
      <p class="text-sm font-medium">키를 만들었습니다. 지금 복사해 두세요.</p>
      <p class="mt-1 text-sm opacity-90">이 화면을 벗어나면 다시 볼 수 없습니다.</p>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <code
          data-testid="api-key-value"
          class="min-w-0 flex-1 break-all rounded-md border border-default bg-default px-2.5 py-1.5 text-sm text-default"
        >
          {{ createdKey.key }}
        </code>
        <UiButton color="neutral" variant="soft" size="sm" :icon="Copy" @click="copyKey">
          복사
        </UiButton>
        <UiButton color="neutral" variant="ghost" size="sm" @click="createdKey = null">
          닫기
        </UiButton>
      </div>
    </div>

    <template v-if="isLoading">
      <UiCard v-for="i in 2" :key="i">
        <div class="space-y-2">
          <UiSkeleton class="h-5 w-1/3" />
          <UiSkeleton class="h-4 w-1/2" />
        </div>
      </UiCard>
    </template>

    <template v-else-if="!loadErrorMessage">
      <div class="space-y-3">
        <h2 class="font-semibold">사용 중인 키</h2>
        <UiEmptyState
          v-if="activeKeys.length === 0"
          :icon="KeyRound"
          label="사용 중인 키가 없습니다."
        />
        <UiCard
          v-for="key in activeKeys"
          :key="key.api_key_id"
          data-testid="api-key-item"
          body-class="flex items-center justify-between gap-4"
        >
          <div class="min-w-0 space-y-1">
            <p class="flex items-center gap-2 font-semibold">
              <span class="truncate">{{ key.name }}</span>
              <UiBadge :variant="key.role === 'admin' ? 'solid' : 'outline'" size="sm">
                {{ key.role }}
              </UiBadge>
            </p>
            <p class="text-xs text-muted">
              <code>{{ key.key_prefix }}…</code>
              · 만든 때 {{ formatTime(key.created_at) }} ·
              {{ key.last_used_at ? `마지막 사용 ${formatTime(key.last_used_at)}` : '아직 안 씀' }}
            </p>
          </div>
          <UiButton
            color="error"
            :variant="confirmingId === key.api_key_id ? 'solid' : 'soft'"
            size="sm"
            :loading="revokingId === key.api_key_id"
            :data-testid="`api-key-revoke-${key.api_key_id}`"
            @click="revokeKey(key)"
          >
            {{ confirmingId === key.api_key_id ? '정말 폐기' : '폐기' }}
          </UiButton>
        </UiCard>
      </div>

      <div v-if="revokedKeys.length > 0" class="space-y-3">
        <h2 class="font-semibold text-muted">폐기한 키</h2>
        <UiCard v-for="key in revokedKeys" :key="key.api_key_id" body-class="opacity-60">
          <p class="flex items-center gap-2 font-semibold">
            <span class="truncate line-through">{{ key.name }}</span>
            <UiBadge variant="outline" color="neutral" size="sm">폐기됨</UiBadge>
          </p>
          <p class="text-xs text-muted">
            <code>{{ key.key_prefix }}…</code> · {{ formatTime(key.revoked_at) }}에 폐기
          </p>
        </UiCard>
      </div>
    </template>
  </div>
</template>
