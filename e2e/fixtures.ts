import { expect, type Page } from '@playwright/test'

// 仅用于本地 Supabase 的测试账号（global-setup 会自动创建）
export const TEST_USER = { email: 'e2e@ims.test', password: 'e2e-local-only-pass' }

export const env = () => ({
  url: process.env.E2E_SUPABASE_URL!,
  serviceKey: process.env.E2E_SERVICE_ROLE_KEY!,
  anonKey: process.env.E2E_ANON_KEY!,
})

export function adminHeaders() {
  const { serviceKey } = env()
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
}

export async function login(page: Page, path = '/') {
  await page.goto(`/login?redirect=${encodeURIComponent(path)}`)
  await page.getByLabel('邮箱').fill(TEST_USER.email)
  await page.getByLabel('密码').fill(TEST_USER.password)
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByRole('button', { name: '新建面试' }).first()).toBeVisible()
}

export async function seedInterview(row: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${env().url}/rest/v1/interviews`, {
    method: 'POST',
    headers: { ...adminHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  })
  if (!res.ok) throw new Error(`seed failed: ${res.status} ${await res.text()}`)
  const [created] = (await res.json()) as { id: string }[]
  return created.id
}

export async function listImages(interviewId: string): Promise<string[]> {
  const res = await fetch(`${env().url}/storage/v1/object/list/ims-images`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ prefix: interviewId, limit: 100 }),
  })
  return ((await res.json()) as { name: string }[]).map((f) => f.name)
}

export async function deleteE2ERows() {
  await fetch(`${env().url}/rest/v1/interviews?client=like.E2E*`, { method: 'DELETE', headers: adminHeaders() })
}

export const rowById = (page: Page, id: string) => page.locator(`section[data-row-id="${id}"]`)
