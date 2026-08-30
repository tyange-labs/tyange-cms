<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.userRole === 'admin')

const items = computed<NavigationMenuItem[]>(() =>
  isAdmin.value
    ? [
        {
          label: '포스트 목록',
          to: '/managing-blog',
          active: route.path === '/managing-blog',
        },
        {
          label: '새 글 쓰기',
          to: '/managing-blog/create',
          active: route.path === '/managing-blog/create',
        },
        {
          label: '포트폴리오',
          to: '/portfolio',
          active: route.path === '/portfolio',
        },
        {
          label: '하객 명단',
          to: '/wedding-guests',
          active: route.path === '/wedding-guests',
        },
      ]
    : [],

)

async function handleLogout() {
  authStore.clearSession()
  await navigateTo('/')
}
</script>

<template>
  <UHeader
    data-testid="dashboard-header"
    title="tyange-cms"
    :ui="{
      container: 'mx-auto flex h-full w-full max-w-3xl items-center justify-between gap-3 px-5',
      header: 'h-(--ui-header-height) shrink-0 flex items-center justify-between gap-3',
      body: 'px-5 py-4 overflow-y-auto',
    }"
  >
    <UNavigationMenu v-if="items.length" :items="items" />
    <template #right>
      <div data-testid="dashboard-header-actions" class="flex items-center gap-3">
        <span class="text-sm text-muted">{{ authStore.userRole ?? 'unknown' }}</span>
        <UButton color="neutral" variant="ghost" icon="i-lucide-log-out" @click="handleLogout">
          로그아웃
        </UButton>
      </div>
    </template>
    <template #body>
      <UNavigationMenu v-if="items.length" :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>

<style scoped></style>
