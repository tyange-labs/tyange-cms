function buildAuthHeaders(headers: HeadersInit | undefined, accessToken?: string) {
  const normalized = new Headers(headers)

  if (accessToken) {
    normalized.set('Authorization', accessToken)
  }

  return normalized
}

export function useAuthHeaders() {
  const authStore = useAuthStore()

  return computed(() => buildAuthHeaders(undefined, authStore.accessToken))
}

export async function handleUnauthorizedError(error: unknown) {
  const fetchError = error as {
    response?: { status?: number }
    statusCode?: number
  }

  const statusCode = fetchError?.statusCode ?? fetchError?.response?.status

  if (statusCode !== 401) {
    return false
  }

  const authStore = useAuthStore()
  authStore.clearSession()
  await navigateTo('/')
  return true
}

export function authenticatedFetch<T>(request: string, options: Record<string, any> = {}) {
  const authStore = useAuthStore()

  return $fetch<T>(request, {
    ...options,
    headers: buildAuthHeaders(options.headers, authStore.accessToken),
    credentials: options.credentials ?? 'include',
    async onResponseError(context) {
      await handleUnauthorizedError(context)

      if (typeof options.onResponseError === 'function') {
        await options.onResponseError(context)
      }
    },
  })
}
