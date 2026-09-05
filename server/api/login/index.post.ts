export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody<{ user_id: string; password: string }>(event)

  return await $fetch(`${config.public.tyangeCmsApiBase}/login`, {
    method: 'POST',
    body: {
      user_id: body.user_id,
      password: body.password,
    },
  })
})
