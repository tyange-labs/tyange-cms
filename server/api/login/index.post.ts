// user_id를 'dev'로 넣으면 tyange-cms-api를 호출하지 않고 관리자 세션을 바로 발급한다.
// import.meta.dev는 빌드 타임 상수라 이 분기 자체가 프로덕션 빌드에는 포함되지 않는다.
const DEV_BYPASS_USER_ID = 'dev'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody<{ user_id: string; password: string }>(event)

  if (import.meta.dev && body.user_id === DEV_BYPASS_USER_ID) {
    console.warn('[auth] dev bypass login 사용 — tyange-cms-api를 호출하지 않았습니다.')

    return {
      access_token: 'dev-access-token',
      user_role: 'admin',
    }
  }

  return await $fetch(`${config.public.tyangeCmsApiBase}/login`, {
    method: 'POST',
    body: {
      user_id: body.user_id,
      password: body.password,
    },
  })
})
