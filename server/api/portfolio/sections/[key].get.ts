// 섹션 하나의 저장된 JSON을 읽는다(관리자 전용). 공개 GET /portfolio에 섞이지 않는 `portfolio_pdf` 같은
// 섹션을 편집기가 불러오는 용도.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const sectionKey = getRouterParam(event, 'key')

  const authHeader = getRequestHeader(event, 'Authorization')
  const headers = new Headers()

  if (authHeader) {
    headers.append('Authorization', authHeader)
  }

  return await $fetch(`${config.public.tyangeCmsApiBase}/portfolio/sections/${sectionKey}`, {
    headers,
  })
})
