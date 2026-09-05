<script setup lang="ts">
const authStore = useAuthStore()
const deniedRole = authStore.userRole
const { adminOnlyMessage } = useAdminLogin()

if (authStore.userRole === 'admin') {
  await navigateTo('/dashboard')
}

authStore.clearSession()

async function handleLogout() {
  authStore.clearSession()
  await navigateTo('/')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-6">
    <UiCard class="w-full max-w-lg">
      <template #header>
        <h1 class="text-lg font-semibold">관리자 전용 CMS입니다</h1>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-muted">
          {{ adminOnlyMessage }}
        </p>
        <p v-if="deniedRole" class="text-sm text-muted">
          현재 응답된 역할은 <strong>{{ deniedRole }}</strong> 입니다.
        </p>
        <p class="text-sm text-muted">
          관리자 계정으로 다시 로그인해 주세요. 개인 예산/소비 확인은 `tyange-dashboard`에서
          처리하는 구조입니다.
        </p>
        <div class="flex gap-2">
          <UiButton color="neutral" variant="soft" @click="handleLogout"> 로그아웃 </UiButton>
          <UiButton to="/"> 로그인으로 이동 </UiButton>
        </div>
      </div>
    </UiCard>
  </div>
</template>
