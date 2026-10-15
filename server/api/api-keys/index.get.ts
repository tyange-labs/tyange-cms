export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const authHeader = getRequestHeader(event, 'Authorization')
  const headers = new Headers()

  if (authHeader) {
    headers.append('Authorization', authHeader)
  }

  return await $fetch(`${config.public.tyangeCmsApiBase}/admin/api-keys`, {
    headers,
  })
})
