export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiKeyId = Number(getQuery(event).id)

  if (!Number.isInteger(apiKeyId) || apiKeyId <= 0) {
    throw createError({ statusCode: 400, statusMessage: '키 id가 올바르지 않습니다.' })
  }

  const authHeader = getRequestHeader(event, 'Authorization')
  const headers = new Headers()

  if (authHeader) {
    headers.append('Authorization', authHeader)
  }

  return await $fetch(`${config.public.tyangeCmsApiBase}/admin/api-keys/${apiKeyId}`, {
    method: 'DELETE',
    headers,
  })
})
