export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const sectionKey = getRouterParam(event, 'key')
  const body = await readBody(event)

  const authHeader = getRequestHeader(event, 'Authorization')
  const headers = new Headers()

  if (authHeader) {
    headers.append('Authorization', authHeader)
  }

  return await $fetch(`${config.public.tyangeCmsApiBase}/portfolio/sections/${sectionKey}`, {
    method: 'PUT',
    headers,
    body,
  })
})
