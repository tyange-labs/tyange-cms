<script setup lang="ts">
import { KeyRound, LogOut } from 'lucide-vue-next'

interface NavItem {
  label: string
  to: string
  active: boolean
}

const route = useRoute()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.userRole === 'admin')

const items = computed<NavItem[]>(() =>
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
          label: 'PDF 포트폴리오',
          to: '/portfolio-pdf',
          active: route.path.startsWith('/portfolio-pdf'),
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
  <UiHeader data-testid="dashboard-header" title="tyange-cms">
    <UiNavMenu v-if="items.length" :items="items" />
    <template #right>
      <div data-testid="dashboard-header-actions" class="flex items-center gap-3">
        <span v-if="!isAdmin" class="text-sm text-muted">{{
          authStore.userRole ?? 'unknown'
        }}</span>
        <UiButton
          v-if="isAdmin"
          to="/api-keys"
          color="neutral"
          :variant="route.path === '/api-keys' ? 'soft' : 'ghost'"
          :icon="KeyRound"
          aria-label="API 키"
          title="API 키"
          data-testid="dashboard-header-api-keys"
        />
        <UiButton color="neutral" variant="ghost" :icon="LogOut" @click="handleLogout">
          로그아웃
        </UiButton>
      </div>
    </template>
  </UiHeader>
</template>

<style scoped></style>
