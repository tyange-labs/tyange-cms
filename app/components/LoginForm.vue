<script lang="ts" setup>
import type { AuthResponse } from '~/types/response.types'

const enteredId = ref('')
const enteredPassword = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const { completeAdminLogin, getLoginErrorMessage } = useAdminLogin()

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const response = await $fetch<AuthResponse>('/api/login', {
      method: 'POST',
      body: {
        user_id: enteredId.value,
        password: enteredPassword.value,
      },
      credentials: 'include',
    })

    console.warn('[auth] password login succeeded', { userRole: response.user_role })

    const result = await completeAdminLogin(response)

    if (!result.ok) {
      errorMessage.value = result.message
    }
  }
  catch (error) {
    console.error('[auth] password login failed', error)
    errorMessage.value = getLoginErrorMessage(error)
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/6 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
    <div class="relative hidden overflow-hidden xl:flex">
      <div class="absolute inset-0 bg-[linear-gradient(140deg,rgba(56,189,248,0.18),rgba(16,185,129,0.12)_55%,transparent)]" />
      <div class="relative flex flex-col justify-between p-10">
        <div class="space-y-4">
          <p class="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-white/80">
            Tyange CMS
          </p>
          <div class="space-y-3">
            <h1 class="max-w-md text-4xl font-semibold leading-tight text-white">
              운영 권한이 있는 관리자만 접근할 수 있습니다.
            </h1>
            <p class="max-w-md text-sm leading-6 text-white/70">
              블로그 운영과 내부 업무를 다루는 전용 관리 화면입니다. 관리자 계정으로 로그인해 주세요.
            </p>
          </div>
        </div>

        <div class="grid gap-3 text-sm text-white/65">
          <div class="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
            Admin role 검증 후에만 세션이 저장됩니다.
          </div>
        </div>
      </div>
    </div>

    <div class="bg-[linear-gradient(180deg,rgba(4,12,26,0.92),rgba(6,18,37,0.98))] p-6 sm:p-10">
      <div class="mx-auto max-w-md space-y-8">
        <div class="space-y-3 xl:hidden">
          <p class="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/80">
            Tyange CMS
          </p>
          <h1 class="text-3xl font-semibold leading-tight text-white">
            관리자 로그인
          </h1>
          <p class="text-sm leading-6 text-white/65">
            운영 권한이 확인된 계정만 로그인할 수 있습니다.
          </p>
        </div>

        <div class="space-y-2">
          <h2 class="text-2xl font-semibold text-white">
            Sign in
          </h2>
          <p class="text-sm leading-6 text-white/60">
            관리자 자격 증명으로 접속해 주세요.
          </p>
        </div>

        <UForm class="space-y-5" @submit="handleSubmit">
          <UFormField label="ID" name="id" class="text-white/80">
            <UInput
              v-model="enteredId"
              :disabled="isSubmitting"
              autocomplete="username"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Password" name="password" class="text-white/80">
            <UInput
              v-model="enteredPassword"
              type="password"
              :disabled="isSubmitting"
              autocomplete="current-password"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            block
            size="xl"
            color="primary"
            class="mt-2 h-14 justify-center rounded-2xl font-semibold"
            :loading="isSubmitting"
          >
            로그인
          </UButton>
        </UForm>

        <div class="min-h-6">
          <p v-if="errorMessage" class="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {{ errorMessage }}
          </p>
        </div>

        <p class="text-xs leading-5 text-white/40">
          로그인 성공 후에도 관리자 권한이 아니면 세션은 저장되지 않습니다.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
