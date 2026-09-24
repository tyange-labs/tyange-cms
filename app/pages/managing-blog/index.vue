<script setup lang="ts">
import type { PostListItem } from '~/types/editor.types'
import type { CMSResponse } from '~/types/response.types'
import { Inbox, Trash } from 'lucide-vue-next'
import { handleUnauthorizedError, useAuthHeaders } from '~/composables/useAuthenticatedApi'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const authStore = useAuthStore()
const authHeaders = useAuthHeaders()
const feedbackMessage = ref('')

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
    return '관리자만 포스트 목록을 조회할 수 있습니다.'
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

const { data, refresh, status, error } = await useFetch<CMSResponse<{ posts: PostListItem[] }>>(
  `/api/posts`,
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

const postList = computed(() => data.value?.data?.posts ?? [])
const isLoading = computed(() => status.value === 'pending')
const loadErrorMessage = computed(() =>
  error.value ? getErrorMessage(error.value, '포스트 목록을 불러오지 못했습니다.') : '',
)

async function handleDeletePost(postId: string) {
  if (!authStore.accessToken) {
    feedbackMessage.value = '로그인 정보가 없습니다.'
    return
  }

  try {
    const res = await authenticatedFetch<CMSResponse<{ post_id: string }>>(
      `/api/post/delete?id=${postId}`,
      {
        method: 'DELETE',
      },
    )

    if (res.status) {
      feedbackMessage.value = ''
      await refresh()
    }
  } catch (err: unknown) {
    feedbackMessage.value = getErrorMessage(err, '포스트 삭제에 실패했습니다.')
  }
}
</script>

<template>
  <div class="space-y-3">
    <UiAlert
      v-if="loadErrorMessage || feedbackMessage"
      color="error"
      variant="subtle"
      title="요청을 처리하지 못했습니다."
      :description="loadErrorMessage || feedbackMessage"
    />

    <template v-if="isLoading">
      <UiCard v-for="i in 5" :key="i">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 space-y-2">
            <UiSkeleton class="h-5 w-1/3" />
            <UiSkeleton class="h-4 w-2/3" />
            <div class="flex gap-4">
              <UiSkeleton class="h-3 w-24" />
              <UiSkeleton class="h-3 w-24" />
            </div>
            <div class="flex gap-1">
              <UiSkeleton v-for="j in 3" :key="j" class="h-5 w-12 rounded-full" />
            </div>
          </div>
          <UiSkeleton class="h-8 w-8 rounded-md" />
        </div>
      </UiCard>
    </template>
    <template v-else-if="!loadErrorMessage && postList.length > 0">
      <UiCard
        v-for="post in postList"
        :key="post.post_id"
        body-class="flex items-start justify-between gap-4"
      >
        <NuxtLink :to="`/managing-blog/update/${post.post_id}`" class="flex-1 min-w-0 space-y-2">
          <h2 v-if="post.title.trim()" class="font-semibold truncate">
            {{ post.title }}
          </h2>
          <h2 v-else class="font-semibold italic text-muted">제목 없음</h2>
          <p class="text-sm text-muted truncate">
            {{ post.description }}
          </p>
          <div class="flex items-center gap-4 text-xs text-muted">
            <span class="font-mono">{{ post.post_id }}</span>
            <time>{{ post.published_at }}</time>
          </div>
          <div v-if="post.tags?.length" class="flex flex-wrap gap-1">
            <UiBadge v-for="tag in post.tags" :key="tag.tag" variant="subtle" size="sm">
              {{ tag.tag }}
            </UiBadge>
          </div>
        </NuxtLink>

        <UiButton
          color="error"
          variant="ghost"
          :icon="Trash"
          size="sm"
          @click.prevent="handleDeletePost(post.post_id)"
        />
      </UiCard>
    </template>

    <UiEmptyState v-else-if="!loadErrorMessage" :icon="Inbox" label="No posts available" />
  </div>
</template>
