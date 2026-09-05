export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const postId = query.id

  const authHeader = getRequestHeader(event, 'Authorization')
  const headers = new Headers()

  if (authHeader) {
    headers.append('Authorization', authHeader)
  }

  return await $fetch(`${config.public.tyangeCmsApiBase}/post/delete/${postId}`, {
    method: 'DELETE',
    headers,
  })
})
