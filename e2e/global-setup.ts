import { execSync } from 'node:child_process'
import { adminHeaders, deleteE2ERows, TEST_USER } from './fixtures'

/** 从 `supabase status` 读取本地密钥，创建（或重置）测试账号，并清理上次遗留的 E2E 数据 */
export default async function globalSetup() {
  const out = execSync('pnpm exec supabase status -o env', { encoding: 'utf8' })
  const vars = Object.fromEntries(
    out
      .split('\n')
      .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1], m[2]]),
  )
  process.env.E2E_SUPABASE_URL = vars.API_URL
  process.env.E2E_SERVICE_ROLE_KEY = vars.SERVICE_ROLE_KEY
  process.env.E2E_ANON_KEY = vars.ANON_KEY

  const base = vars.API_URL
  const list = await fetch(`${base}/auth/v1/admin/users?per_page=1000`, { headers: adminHeaders() })
  const { users } = (await list.json()) as { users: { id: string; email: string }[] }
  const existing = users.find((u) => u.email === TEST_USER.email)
  const res = existing
    ? await fetch(`${base}/auth/v1/admin/users/${existing.id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ password: TEST_USER.password }),
      })
    : await fetch(`${base}/auth/v1/admin/users`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password, email_confirm: true }),
      })
  if (!res.ok) throw new Error(`创建测试账号失败：${res.status} ${await res.text()}`)

  await deleteE2ERows()
}
