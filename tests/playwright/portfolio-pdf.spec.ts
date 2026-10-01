import { expect, test } from '@nuxt/test-utils/playwright'

const authState = { isAuth: true, accessToken: 'playwright-access-token', userRole: 'admin' }

test.use({ nuxt: { rootDir: '.' } })

// cms-api의 portfolio_pdf 섹션을 가로채 기본 문서(404)에서 시작한다. 실제 서버로는 요청을 보내지 않는다.
test.beforeEach(async ({ baseURL, page }) => {
  await page.context().clearCookies()
  await page.context().addCookies([
    {
      name: 'auth',
      value: encodeURIComponent(JSON.stringify(authState)),
      url: new URL('/', baseURL!).toString(),
    },
  ])
})

test('PDF 포트폴리오: 페이지를 추가하고 순서를 바꿔 저장한다', async ({ goto, page }) => {
  let saved: {
    content: { pages: { id: string; template: string; data: { label?: string } }[] }
  } | null = null
  await page.route('**/api/portfolio/sections/portfolio_pdf', async (route) => {
    if (route.request().method() === 'PUT') {
      saved = route.request().postDataJSON()
      return route.fulfill({ json: { status: true, data: {} } })
    }
    return route.fulfill({ status: 404, json: { message: 'none' } })
  })

  await goto('/portfolio-pdf', { waitUntil: 'hydration' })

  const rows = page.getByTestId('portfolio-pdf-page-list').locator('li')
  await expect(rows).toHaveCount(10)
  // 미리보기는 실제 페이지 컴포넌트(1920×1080)다.
  await expect(page.getByTestId('portfolio-pdf-preview').locator('.rs-page')).toBeVisible()

  await page.getByTestId('portfolio-pdf-add-page').click()
  await expect(rows).toHaveCount(11)

  // 첫 페이지를 한 칸 아래로
  await rows.nth(0).getByRole('button', { name: '아래로' }).click()
  await page.getByRole('button', { name: '저장' }).click()

  await expect.poll(() => saved?.content.pages.length).toBe(11)
  expect(saved!.content.pages[1]!.template).toBe('cover')
})

test('PDF 포트폴리오 인쇄 화면: 저장된 페이지를 모두 그린다', async ({ goto, page }) => {
  await page.route('**/api/portfolio/sections/portfolio_pdf', (route) =>
    route.fulfill({
      json: {
        status: true,
        data: {
          section_key: 'portfolio_pdf',
          updated_at: '2026-10-01 00:00:00',
          content: {
            theme: { accent: '#1f4fd8', accent_dark: '#7da2ff' },
            pages: [
              { id: 'a', template: 'cover', dark: true, data: { name: '유태양' } },
              { id: 'b', template: 'closing', dark: false, data: { title: '감사합니다.' } },
            ],
          },
        },
      },
    }),
  )

  await goto('/portfolio-pdf/print?noprint=1', { waitUntil: 'hydration' })

  const pages = page.getByTestId('portfolio-pdf-print-root').locator('.rs-page')
  await expect(pages).toHaveCount(2)
  const box = await pages.first().boundingBox()
  expect(box!.width).toBeGreaterThan(0)
})
