import type { Locator } from '@playwright/test'
import { expect, test } from '@nuxt/test-utils/playwright'

const authState = {
  isAuth: true,
  accessToken: 'playwright-access-token',
  userRole: 'admin',
}

const styleProps = [
  'gap',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'maxWidth',
] as const

type StyleProp = (typeof styleProps)[number]
type StyleSnapshot = Record<StyleProp, string>

async function readStyles(
  locator: Locator,
  properties: readonly StyleProp[],
): Promise<StyleSnapshot> {
  return locator.evaluate((element: Element, props: readonly StyleProp[]) => {
    const computed = window.getComputedStyle(element)

    return props.reduce(
      (result, prop) => {
        result[prop] = computed[prop]
        return result
      },
      {} as Record<StyleProp, string>,
    )
  }, properties)
}

test.use({
  nuxt: {
    rootDir: '.',
  },
})

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

test('locks the /dashboard layout baseline', async ({ goto, page }) => {
  await goto('/dashboard', { waitUntil: 'hydration' })

  await expect(page).toHaveURL(/\/dashboard$/)

  const dashboardPage = page.getByTestId('dashboard-page')
  const dashboardMain = page.getByTestId('dashboard-main')
  const dashboardContentWrap = page.getByTestId('dashboard-content-wrap')
  const notReadyYet = page.getByTestId('not-ready-yet')
  const dashboardHeader = page.getByTestId('dashboard-header')
  const dashboardHeaderActions = page.getByTestId('dashboard-header-actions')

  await expect(dashboardPage).toBeVisible()
  await expect(dashboardHeader).toBeVisible()
  await expect(notReadyYet).toBeVisible()

  const pageStyles = await readStyles(dashboardPage, styleProps)
  const mainStyles = await readStyles(dashboardMain, styleProps)
  const contentWrapStyles = await readStyles(dashboardContentWrap, styleProps)
  const emptyStateStyles = await readStyles(notReadyYet, styleProps)
  const headerStyles = await readStyles(dashboardHeader, styleProps)
  const headerActionStyles = await readStyles(dashboardHeaderActions, styleProps)

  expect(pageStyles).toEqual({
    gap: 'normal',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    maxWidth: 'none',
  })

  expect(mainStyles).toEqual({
    gap: 'normal',
    paddingTop: '24px',
    paddingRight: '20px',
    paddingBottom: '24px',
    paddingLeft: '20px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    maxWidth: 'none',
  })

  expect(contentWrapStyles).toEqual({
    gap: 'normal',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    marginTop: '0px',
    marginRight: '316px',
    marginBottom: '0px',
    marginLeft: '316px',
    maxWidth: '768px',
  })

  expect(emptyStateStyles).toEqual({
    gap: '20px',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    maxWidth: 'none',
  })

  expect(headerStyles).toEqual({
    gap: 'normal',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    maxWidth: 'none',
  })

  expect(headerActionStyles).toEqual({
    gap: '12px',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    maxWidth: 'none',
  })

  await expect(page).toHaveScreenshot('dashboard-layout.png', {
    fullPage: true,
  })
})
