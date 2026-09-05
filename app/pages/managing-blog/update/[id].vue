<script setup lang="ts">
import type { PostListItem } from '~/types/editor.types'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const route = useRoute()

const { data, error } = await useFetch<PostListItem>(`/api/post?id=${route.params.id}`, {
  credentials: 'include',
})
</script>

<template>
  <div class="space-y-4">
    <UiAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="포스트를 불러오지 못했습니다."
      :description="error.message"
    />
    <Editor v-if="data" :data="data" />
  </div>
</template>

<style scoped></style>
