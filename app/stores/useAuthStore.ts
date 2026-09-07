import type { AuthStore } from '~/types/auth-store.types'
import { defineStore } from 'pinia'

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export const useAuthStore = defineStore('auth', {
  state: (): AuthStore => ({
    isAuth: false,
    accessToken: undefined,
    userRole: undefined,
  }),
  actions: {
    clearSession() {
      this.$reset()
    },
  },
  // 네트워크 도달은 Tailscale가 막고(‘## 로그인’ 참고), 세션은 1년짜리 쿠키로 유지한다.
  // localStorage가 아니라 쿠키인 이유: auth 미들웨어/페이지가 SSR이라 서버 렌더 시점에
  // 토큰이 읽혀야 한다. cms-api의 access token TTL도 1년이라 둘이 맞물려 약 1년간 무재로그인.
  persist: {
    storage: piniaPluginPersistedstate.cookies({
      maxAge: YEAR_IN_SECONDS,
      sameSite: 'lax',
      secure: !import.meta.dev,
    }),
  },
})
