import { expect, test } from '@nuxt/test-utils/playwright'

const authState = { isAuth: true, accessToken: 'playwright-access-token', userRole: 'admin' }

test.use({ nuxt: { rootDir: '.' } })

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

interface FakeKey {
  api_key_id: number
  name: string
  role: 'admin' | 'user'
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

// cms-api의 /admin/api-keys를 가로채 목록·발급·폐기를 흉내 낸다. 실제 서버로는 요청을 보내지 않는다.
async function fakeApiKeys(page: import('@playwright/test').Page) {
  const keys: FakeKey[] = [
    {
      api_key_id: 1,
      name: 'tyange CLI (맥북)',
      role: 'admin',
      key_prefix: 'tyk_0123456789ab',
      created_at: '2026-10-15T04:00:00Z',
      last_used_at: '2026-10-15T05:00:00Z',
      revoked_at: null,
    },
    {
      api_key_id: 2,
      name: '옛 키',
      role: 'user',
      key_prefix: 'tyk_ba9876543210',
      created_at: '2026-10-01T04:00:00Z',
      last_used_at: null,
      revoked_at: '2026-10-10T04:00:00Z',
    },
  ]
  const seen = { created: [] as unknown[], revoked: [] as string[] }

  await page.route('**/api/api-keys', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      seen.created.push(body)
      keys.unshift({
        api_key_id: 3,
        name: body.name,
        role: body.role,
        key_prefix: 'tyk_aaaaaaaaaaaa',
        created_at: '2026-10-15T06:00:00Z',
        last_used_at: null,
        revoked_at: null,
      })
      return route.fulfill({
        json: {
          status: true,
          data: {
            api_key_id: 3,
            name: body.name,
            role: body.role,
            key: 'tyk_aaaaaaaaaaaa_secretsecretsecretsecretsecretsecretsecretsecret12',
            created_at: '2026-10-15T06:00:00Z',
          },
          message: null,
        },
      })
    }
    return route.fulfill({ json: { status: true, data: { keys }, message: null } })
  })

  await page.route('**/api/api-keys/revoke*', async (route) => {
    const id = new URL(route.request().url()).searchParams.get('id')!
    seen.revoked.push(id)
    const key = keys.find((item) => String(item.api_key_id) === id)
    if (key) {
      key.revoked_at = '2026-10-15T07:00:00Z'
    }
    return route.fulfill({
      json: { status: true, data: { api_key_id: Number(id) }, message: null },
    })
  })

  return seen
}

test('API 키: 목록에 사용 중인 키와 폐기한 키가 나뉘어 보인다', async ({ goto, page }) => {
  await fakeApiKeys(page)

  await goto('/api-keys', { waitUntil: 'hydration' })

  const active = page.getByTestId('api-key-item')
  await expect(active).toHaveCount(1)
  await expect(active.first()).toContainText('tyange CLI (맥북)')
  await expect(active.first()).toContainText('tyk_0123456789ab')
  await expect(page.getByText('폐기됨')).toBeVisible()
  // 키 원문은 목록 어디에도 없다.
  await expect(page.getByText('secret')).toHaveCount(0)
})

test('API 키: 이름이 비어 있으면 만들 수 없고, 만들면 원문을 한 번 보여 준다', async ({
  goto,
  page,
}) => {
  const seen = await fakeApiKeys(page)

  await goto('/api-keys', { waitUntil: 'hydration' })

  const create = page.getByTestId('api-key-create')
  await expect(create).toBeDisabled()

  await page.getByTestId('api-key-name').fill('새 키')
  await expect(create).toBeEnabled()
  await create.click()

  await expect(page.getByTestId('api-key-created')).toBeVisible()
  await expect(page.getByTestId('api-key-value')).toContainText('tyk_aaaaaaaaaaaa_secret')
  expect(seen.created).toEqual([{ name: '새 키', role: 'admin' }])
  await expect(page.getByTestId('api-key-item')).toHaveCount(2)

  await page.getByRole('button', { name: '닫기' }).click()
  await expect(page.getByTestId('api-key-created')).toHaveCount(0)
})

test('API 키: 폐기는 두 번 눌러야 실행된다', async ({ goto, page }) => {
  const seen = await fakeApiKeys(page)

  await goto('/api-keys', { waitUntil: 'hydration' })

  const revoke = page.getByTestId('api-key-revoke-1')
  await revoke.click()
  await expect(revoke).toHaveText('정말 폐기')
  expect(seen.revoked).toEqual([])

  await revoke.click()
  await expect.poll(() => seen.revoked).toEqual(['1'])
  await expect(page.getByTestId('api-key-item')).toHaveCount(0)
})
