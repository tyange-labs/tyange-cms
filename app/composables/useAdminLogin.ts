import type { AuthResponse } from '~/types/response.types'

const ADMIN_ONLY_MESSAGE = '관리자만 로그인할 수 있습니다.'

interface FetchLikeError {
  data?: { message?: string; error?: string } | string
  status?: number
  statusCode?: number
  statusMessage?: string
  response?: {
    _data?: { message?: string; error?: string } | string
    status?: number
  }
  message?: string
}

function extractStatus(error: FetchLikeError) {
  return error.status ?? error.statusCode ?? error.response?.status
}

function extractMessage(error: FetchLikeError) {
  const data = error.data ?? error.response?._data

  if (typeof data === 'string' && data) {
    return data
  }

  if (data && typeof data === 'object') {
    if ('message' in data && typeof data.message === 'string' && data.message) {
      return data.message
    }

    if ('error' in data && typeof data.error === 'string' && data.error) {
      return data.error
    }
  }

  if (typeof error.statusMessage === 'string' && error.statusMessage) {
    return error.statusMessage
  }

  if (typeof error.message === 'string' && error.message) {
    return error.message
  }

  return ''
}

export function useAdminLogin() {
  const authStore = useAuthStore()

  async function completeAdminLogin(response: AuthResponse) {
    if (response.user_role !== 'admin') {
      authStore.clearSession()
      console.warn('[auth] blocked non-admin login', { userRole: response.user_role })
      return {
        ok: false as const,
        message: ADMIN_ONLY_MESSAGE,
      }
    }

    authStore.$patch({
      isAuth: true,
      accessToken: response.access_token,
      userRole: response.user_role,
    })

    await navigateTo('/dashboard')

    return {
      ok: true as const,
    }
  }

  function clearInvalidSession() {
    if (!authStore.isAuth || !authStore.accessToken || authStore.userRole !== 'admin') {
      authStore.clearSession()
      return false
    }

    return true
  }

  function getLoginErrorMessage(error: unknown) {
    const fetchError = error as FetchLikeError
    const status = extractStatus(fetchError)
    const message = extractMessage(fetchError)

    if (status === 401) {
      return '인증에 실패했습니다. 계정을 다시 확인해 주세요.'
    }

    if (status === 500) {
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    }

    if (message.toLowerCase().includes('network')) {
      return '네트워크 오류가 발생했습니다. 연결을 확인해 주세요.'
    }

    return message || '로그인에 실패했습니다.'
  }

  return {
    adminOnlyMessage: ADMIN_ONLY_MESSAGE,
    clearInvalidSession,
    completeAdminLogin,
    getLoginErrorMessage,
  }
}
