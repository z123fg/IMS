import { expect, test, type Page } from '@playwright/test'
import { deleteE2ERows, env, listImages, login, rowById, seedInterview, TEST_USER } from './fixtures'

test.afterAll(deleteE2ERows)

const HEADER_H = 40
const ROW_H = 52

async function scroller(page: Page) {
  return page.locator('[role="table"]').locator('..')
}

test('未登录跳转登录页；错误密码提示；登录后回到原页面', async ({ page }) => {
  await page.goto('/?q=abc')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.getByLabel('邮箱').fill(TEST_USER.email)
  await page.getByLabel('密码').fill('wrong-password')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByText('邮箱或密码错误')).toBeVisible()

  await page.getByLabel('密码').fill(TEST_USER.password)
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/\?q=abc$/)
  await expect(page.getByRole('button', { name: '新建面试' }).first()).toBeVisible()

  // 退出后再访问会被拦截
  await page.getByRole('button', { name: '账号菜单' }).click()
  await page.getByRole('menuitem', { name: '退出登录' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

test('新建与行内编辑，刷新后保留', async ({ page }) => {
  await login(page)
  const tag = `E2E-Create-${Date.now()}`
  await page.getByRole('button', { name: '新建面试' }).first().click()

  const client = page.getByLabel('Client').first()
  await expect(client).toBeFocused()
  const section = page.locator('section[data-row-id]').first()
  const id = (await section.getAttribute('data-row-id'))!
  const row = rowById(page, id)

  await client.fill(tag)
  await page.keyboard.press('Tab')
  await expect(row.getByLabel('Vendor')).toBeFocused()
  await page.keyboard.type('TekSystems')
  await page.keyboard.press('Tab')
  await expect(row.getByLabel('面试者')).toBeFocused()
  await page.keyboard.type('张伟')
  await page.keyboard.press('Tab')
  await expect(row.getByLabel('面试官')).toBeFocused()
  await page.keyboard.type('Sarah Chen')
  await page.keyboard.press('Tab')
  await expect(row.getByLabel('面试类型')).toBeFocused()
  await page.keyboard.type('Onsite Loop')
  await page.keyboard.press('Tab')

  // 面试日期：打开日历，选 28 号并确定
  await row.getByRole('button', { name: '面试日期', exact: true }).click()
  await page.getByRole('gridcell', { name: '28' }).first().click()
  await page.getByRole('button', { name: '确认' }).click()
  await expect(row.getByRole('button', { name: '面试日期', exact: true })).toContainText('28日')

  // Esc 撤销未提交的输入
  await row.getByLabel('Vendor').fill('should be reverted')
  await page.keyboard.press('Escape')
  await expect(row.getByLabel('Vendor')).toHaveValue('TekSystems')

  await page.waitForTimeout(500)
  await page.reload()
  await page.getByLabel('搜索', { exact: true }).fill(tag)
  await expect(rowById(page, id).getByLabel('Client')).toHaveValue(tag)
  await expect(rowById(page, id).getByLabel('Vendor')).toHaveValue('TekSystems')
  await expect(rowById(page, id).getByLabel('面试者')).toHaveValue('张伟')
  await expect(rowById(page, id).getByLabel('面试官')).toHaveValue('Sarah Chen')
  await expect(rowById(page, id).getByLabel('面试类型')).toHaveValue('Onsite Loop')
  await expect(rowById(page, id).getByRole('button', { name: '面试日期', exact: true })).toContainText('28日')
})

test('搜索、类型筛选、排序，状态保存在 URL', async ({ page }) => {
  const now = Date.now()
  await seedInterview({ client: 'E2E-Seed Alpha', vendor: 'V1', interview_type: 'HR', received_at: '2026-09-01' })
  await seedInterview({ client: 'E2E-Seed Beta', vendor: 'V2', interview_type: 'Technical', received_at: '2026-09-10' })
  await seedInterview({
    client: 'E2E-Seed Gamma',
    vendor: 'V3',
    interview_type: 'Technical',
    received_at: '2026-08-20',
    interview_at: new Date(now + 86_400_000 * 2).toISOString(),
  })
  await login(page)

  await page.getByLabel('搜索', { exact: true }).fill('e2e-seed')
  const clients = () => page.locator('section[data-row-id]').getByLabel('Client')
  const values = () => clients().evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))
  await expect(clients()).toHaveCount(3)
  // 搜索时自动按相关度排序；点列头改为按该列排序
  await expect(page).toHaveURL(/sort=relevance/)
  await page.getByRole('columnheader', { name: '收到面试日期' }).getByRole('button').click()
  await expect.poll(values).toEqual(['E2E-Seed Beta', 'E2E-Seed Alpha', 'E2E-Seed Gamma'])

  await page.getByRole('button', { name: 'Client' }).click()
  await expect.poll(values).toEqual(['E2E-Seed Alpha', 'E2E-Seed Beta', 'E2E-Seed Gamma'])
  await page.getByRole('button', { name: 'Client' }).click()
  await expect.poll(values).toEqual(['E2E-Seed Gamma', 'E2E-Seed Beta', 'E2E-Seed Alpha'])

  await page.getByPlaceholder('面试类型').click()
  await page.getByRole('option', { name: 'Technical' }).click()
  await page.keyboard.press('Escape')
  await expect(clients()).toHaveCount(2)

  await page.getByRole('button', { name: '即将到来' }).click()
  await expect.poll(values).toEqual(['E2E-Seed Gamma'])
  await expect(page.locator('section[data-row-id]').getByText('后天')).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL(/types=/)
  await expect(page.getByLabel('搜索', { exact: true })).toHaveValue('e2e-seed')
  await expect.poll(values).toEqual(['E2E-Seed Gamma'])
})

test('展开 JD：自动保存、吸顶、收起、切换材料', async ({ page }) => {
  const id = await seedInterview({ client: 'E2E-Doc', vendor: 'Sticky', received_at: '2026-09-30' })
  for (let i = 0; i < 12; i++) await seedInterview({ client: `E2E-Filler ${i}`, received_at: '2020-01-01' })
  await login(page)
  await page.getByLabel('搜索', { exact: true }).fill('E2E-')
  const row = rowById(page, id)

  await row.getByRole('button', { name: '展开JD' }).click()
  await expect(page).toHaveURL(new RegExp(`open=${id}`))
  const editor = row.locator('.ProseMirror')
  await expect(editor).toBeVisible()
  await editor.click()
  for (let i = 1; i <= 60; i++) {
    await page.keyboard.insertText(`第 ${i} 段：负责核心交易系统的设计与开发。`)
    await page.keyboard.press('Enter')
  }
  await expect(row.getByText('已保存')).toBeVisible({ timeout: 15_000 })

  // 吸顶：向下滚动后，该行固定在列头下方，面板工具栏在其下方
  const sc = await scroller(page)
  await sc.evaluate((el) => (el.scrollTop += 600))
  await page.waitForTimeout(200)
  const scTop = (await sc.boundingBox())!.y
  const rowBox = (await row.getByRole('row').boundingBox())!
  expect(Math.abs(rowBox.y - (scTop + 1 + HEADER_H))).toBeLessThanOrEqual(2)
  const tabs = (await row.getByRole('tab', { name: 'JD' }).boundingBox())!
  expect(tabs.y).toBeGreaterThanOrEqual(scTop + HEADER_H + ROW_H)
  expect(tabs.y).toBeLessThan(scTop + HEADER_H + ROW_H + 50)

  // 滚过面板末尾后，该行随面板离开，不再吸顶
  await sc.evaluate((el) => (el.scrollTop = el.scrollHeight))
  await page.waitForTimeout(200)
  const released = await row.getByRole('row').boundingBox()
  expect(released === null || released.y < scTop + HEADER_H - 5).toBeTruthy()

  // 输入后立刻收起也不丢内容
  await sc.evaluate((el) => (el.scrollTop = 0))
  await row.getByRole('tab', { name: 'JD' }).scrollIntoViewIfNeeded()
  await editor.click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.insertText('QUICK-SAVE-MARK')
  await row.getByRole('button', { name: '收起JD' }).click()
  await expect(editor).toHaveCount(0)
  await expect(page).not.toHaveURL(/open=/)
  await expect(row.getByRole('button', { name: '展开JD' })).toBeVisible()

  await page.waitForTimeout(800)
  await page.reload()
  await row.getByRole('button', { name: '展开JD' }).click()
  await expect(row.locator('.ProseMirror')).toContainText('QUICK-SAVE-MARK')
  await expect(row.locator('.ProseMirror')).toContainText('第 60 段')

  // 切换到材料
  await row.getByRole('tab', { name: '材料' }).click()
  await expect(page).toHaveURL(/doc=materials/)
  await expect(row.locator('.ProseMirror p.is-editor-empty')).toHaveAttribute('data-placeholder', /面试准备/)
})

async function pasteImage(page: Page) {
  await page.locator('.ProseMirror').evaluate(async (el) => {
    const c = document.createElement('canvas')
    c.width = 800
    c.height = 400
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#4f5bd5'
    ctx.fillRect(0, 0, 800, 400)
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png'))
    const dt = new DataTransfer()
    dt.items.add(new File([blob], 'shot.png', { type: 'image/png' }))
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }))
  })
}

test('粘贴图片上传、刷新后显示；导出 PDF / Word；删除时清理图片', async ({ page }) => {
  const id = await seedInterview({ client: 'E2E-Image', vendor: 'Export', received_at: '2026-09-30' })
  await login(page, `/?open=${id}&doc=materials`)
  const row = rowById(page, id)
  const editor = row.locator('.ProseMirror')
  await editor.click()
  await page.keyboard.insertText('截图如下：')
  await pasteImage(page)
  await expect(editor.locator('img')).toHaveAttribute('src', /\/storage\/v1\/object\/sign\/ims-images\//)
  await expect(row.getByText('已保存')).toBeVisible({ timeout: 15_000 })
  expect(await listImages(id)).toHaveLength(1)

  await page.reload()
  const img = rowById(page, id).locator('.ProseMirror img')
  await expect(img).toBeVisible()
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(800)

  // 导出
  for (const [button, magic, ext] of [
    ['导出材料为 PDF', '%PDF', 'pdf'],
    ['导出材料为 Word（.docx）', 'PK', 'docx'],
  ] as const) {
    const [dl] = await Promise.all([page.waitForEvent('download'), rowById(page, id).getByRole('button', { name: button }).click()])
    expect(dl.suggestedFilename()).toBe(`E2E-Image-Export-材料.${ext}`)
    const path = await dl.path()
    const { readFile } = await import('node:fs/promises')
    const buf = await readFile(path)
    expect(buf.subarray(0, magic.length).toString('latin1')).toBe(magic)
    expect(buf.length).toBeGreaterThan(5_000)
  }

  // 删除
  await rowById(page, id).getByRole('button', { name: '更多操作' }).click()
  await page.getByRole('menuitem', { name: '删除面试' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '删除' }).click()
  await expect(rowById(page, id)).toHaveCount(0)
  await expect.poll(() => listImages(id)).toHaveLength(0)
})

test('两人同时编辑同一文档：后保存者看到冲突提示并可重新加载', async ({ browser }) => {
  const id = await seedInterview({ client: 'E2E-Conflict', received_at: '2026-09-30' })
  const a = await (await browser.newContext()).newPage()
  const b = await (await browser.newContext()).newPage()
  await login(a, `/?open=${id}&doc=jd`)
  await login(b, `/?open=${id}&doc=jd`)
  await expect(a.locator('.ProseMirror')).toBeVisible()
  await expect(b.locator('.ProseMirror')).toBeVisible()

  await a.locator('.ProseMirror').click()
  await a.keyboard.insertText('来自 A 的内容')
  await expect(a.getByText('已保存')).toBeVisible({ timeout: 15_000 })

  await b.locator('.ProseMirror').click()
  await b.keyboard.insertText('来自 B 的内容')
  await expect(b.getByRole('dialog')).toContainText('已被他人修改', { timeout: 15_000 })
  await b.getByRole('button', { name: '重新加载' }).click()
  await expect(b.locator('.ProseMirror')).toContainText('来自 A 的内容')
  await expect(b.locator('.ProseMirror')).not.toContainText('来自 B 的内容')
})

test('安全：匿名请求拿不到数据，公开注册被拒绝', async () => {
  const { url, anonKey } = env()
  const rows = await fetch(`${url}/rest/v1/interviews?select=id`, { headers: { apikey: anonKey } })
  expect(rows.ok).toBe(false)

  const signup = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'intruder@ims.test', password: 'intruder-pass-123' }),
  })
  expect(signup.ok).toBe(false)

  const ping = await fetch(`${url}/rest/v1/rpc/ping`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: '{}',
  })
  expect(await ping.json()).toBe('pong')
})

test('展开/收起动画过程中，面板工具栏始终紧贴在行下方；末尾的行也能滚到吸顶位', async ({ page }) => {
  const doc = {
    type: 'doc',
    content: Array.from({ length: 6 }, (_, i) => ({ type: 'paragraph', content: [{ type: 'text', text: `段落 ${i + 1}` }] })),
  }
  const ids: string[] = []
  for (let i = 0; i < 10; i++) {
    ids.push(await seedInterview({ client: `E2E-Anim ${String(i).padStart(2, '0')}`, received_at: `2026-09-${String(20 - i).padStart(2, '0')}`, jd: doc }))
  }
  await login(page)
  await page.getByLabel('搜索', { exact: true }).fill('E2E-Anim')
  await expect(page.locator('section[data-row-id]')).toHaveCount(10)
  // 预热：先展开一次加载编辑器分包
  const first = rowById(page, ids[0])
  await first.getByRole('button', { name: '展开JD' }).click()
  await expect(first.locator('.ProseMirror')).toBeVisible()
  await first.getByRole('button', { name: '收起JD' }).click()
  await expect(first.locator('.ProseMirror')).toHaveCount(0)

  // 逐帧记录：工具栏顶部与行底部的距离
  const sample = (id: string, action: string) =>
    page.evaluate(
      async ([id, action]) => {
        const sec = document.querySelector(`section[data-row-id="${id}"]`)!
        const row = sec.querySelector('[role="row"]')!
        const gaps: number[] = []
        ;(sec.querySelector(`button[aria-label="${action}"]`) as HTMLElement).click()
        const t0 = performance.now()
        await new Promise<void>((resolve) => {
          const tick = () => {
            const tab = sec.querySelector('[role="tab"]')
            if (tab) {
              const header = tab.closest('.MuiStack-root')!.parentElement!
              gaps.push(Math.round(header.getBoundingClientRect().top - row.getBoundingClientRect().bottom))
            }
            if (performance.now() - t0 < 700) requestAnimationFrame(tick)
            else resolve()
          }
          requestAnimationFrame(tick)
        })
        return gaps
      },
      [id, action] as const,
    )

  const last = ids[9]
  const opening = await sample(last, '展开JD')
  expect(opening.length).toBeGreaterThan(10)
  for (const gap of opening) expect(Math.abs(gap)).toBeLessThanOrEqual(1)

  // 展开完成后，末尾这行已滚到列头下方的吸顶位
  await page.waitForTimeout(400)
  const sc = page.locator('[role="table"]').locator('..')
  const scTop = (await sc.boundingBox())!.y
  const rowTop = (await rowById(page, last).getByRole('row').boundingBox())!.y
  expect(Math.abs(rowTop - (scTop + 1 + HEADER_H))).toBeLessThanOrEqual(2)

  const closing = await sample(last, '收起JD')
  for (const gap of closing) expect(Math.abs(gap)).toBeLessThanOrEqual(1)
})

const paraDoc = (...texts: string[]) => ({
  type: 'doc',
  content: texts.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
})

test('全文模糊搜索：拼写容错、中文、命中片段、打开后高亮；搜索过程不误写字段', async ({ page }) => {
  const acme = await seedInterview({
    client: 'E2E-Search Acme',
    vendor: 'QuasarStaffing',
    interviewee: '欧阳锋',
    interview_type: 'Technical',
    received_at: '2026-09-28',
    jd: paraDoc('Senior Frontend Engineer', '负责交易平台前端，熟悉 Zephyrium、TypeScript 与性能优化。'),
    questions: paraDoc('如何优化 Zephyrium 应用的量子退火调度？'),
  })
  const globex = await seedInterview({
    client: 'E2E-Search Globex',
    vendor: 'Randstad',
    interviewee: '慕容复',
    received_at: '2026-09-20',
    materials: paraDoc('薪资期望与到岗时间'),
  })
  await login(page)

  // 搜索与打开文档期间，不应对普通字段发出任何写请求
  const fieldWrites: string[] = []
  page.on('request', (req) => {
    if (req.method() !== 'PATCH' || !req.url().includes('/rest/v1/interviews')) return
    const body = req.postData() ?? ''
    if (!/"(jd|materials|questions)"/.test(body)) fieldWrites.push(body)
  })

  const box = page.getByLabel('搜索', { exact: true })
  const sections = page.locator('section[data-row-id]')

  // 快捷键聚焦搜索框
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('/')
  await expect(box).toBeFocused()

  // 拼写错误也能找到，命中正文时显示片段并高亮
  await box.fill('zepyhrium')
  await expect(sections).toHaveCount(1)
  const snippet = rowById(page, acme).getByRole('button', { name: /打开.*中的搜索结果/ })
  await expect(snippet).toBeVisible()
  await expect(snippet.locator('mark').first()).toHaveText('Zephyrium')
  await expect(page.getByText('找到 1 条')).toBeVisible()

  // 点片段打开对应文档，命中处在编辑器中高亮
  await snippet.click()
  await expect(page).toHaveURL(new RegExp(`open=${acme}`))
  await expect(rowById(page, acme).locator('.ProseMirror .ims-search-hit').first()).toHaveText('Zephyrium')
  await rowById(page, acme).getByRole('button', { name: /收起/ }).first().click()

  // 中文：只命中包含原词的字段（面试题），不因零散单字误标 JD
  await box.fill('量子退火')
  await expect(sections).toHaveCount(1)
  await expect(rowById(page, acme).getByRole('button', { name: /打开面试题中的搜索结果/ })).toBeVisible()
  await expect(rowById(page, acme).locator('[role="cell"][data-matched]')).toHaveCount(1)

  // 短字段中间的子串、面试者姓名
  await box.fill('staffing')
  await expect.poll(() => sections.evaluateAll((els) => els.map((e) => e.getAttribute('data-row-id')))).toEqual([acme])
  await box.fill('慕容复')
  await expect.poll(() => sections.evaluateAll((els) => els.map((e) => e.getAttribute('data-row-id')))).toEqual([globex])

  // Esc 清空搜索并恢复默认排序
  await box.press('Escape')
  await expect(box).toHaveValue('')
  await expect(page).not.toHaveURL(/sort=relevance/)

  expect(fieldWrites).toEqual([])
  await page.reload()
  await box.fill('E2E-Search')
  await expect(rowById(page, acme).getByLabel('Vendor')).toHaveValue('QuasarStaffing')
  await expect(rowById(page, acme).getByLabel('面试者')).toHaveValue('欧阳锋')
})

test('Vendor / 面试者自动补全已有值；面试题文档可编辑', async ({ page }) => {
  await seedInterview({
    client: 'E2E-Auto Existing',
    vendor: 'Insight Global',
    interviewee: '王芳',
    interviewer: 'Priya Raman',
    received_at: '2026-09-01',
  })
  const id = await seedInterview({ client: 'E2E-Auto New', received_at: '2026-09-02' })
  await login(page)
  await page.getByLabel('搜索', { exact: true }).fill('E2E-Auto')
  const row = rowById(page, id)

  await row.getByLabel('Vendor').click()
  await page.keyboard.type('insi')
  await page.getByRole('option', { name: 'Insight Global' }).click()
  await expect(row.getByLabel('Vendor')).toHaveValue('Insight Global')

  await row.getByLabel('面试者').click()
  await page.keyboard.type('王')
  await page.getByRole('option', { name: '王芳' }).click()
  await expect(row.getByLabel('面试者')).toHaveValue('王芳')

  await row.getByLabel('面试官').click()
  await page.keyboard.type('pri')
  await page.getByRole('option', { name: 'Priya Raman' }).click()
  await expect(row.getByLabel('面试官')).toHaveValue('Priya Raman')

  // 面试题：与 JD / 材料相同的富文本编辑器
  await row.getByRole('button', { name: '展开面试题' }).click()
  await expect(row.getByRole('tab', { name: '面试题', selected: true })).toBeVisible()
  const editor = row.locator('.ProseMirror')
  await editor.click()
  await page.keyboard.insertText('介绍一次线上故障的排查过程')
  await expect(row.getByText('未保存')).toBeVisible()
  await expect(row.getByText('已保存')).toBeVisible({ timeout: 15_000 })

  await page.reload()
  await page.getByLabel('搜索', { exact: true }).fill('线上故障')
  // 刷新后面试题面板仍展开（状态在 URL 中），命中处在编辑器里高亮
  await expect(rowById(page, id).locator('.ProseMirror .ims-search-hit')).toHaveText('线上故障')
  // 收起后，行下方显示命中片段
  await rowById(page, id).getByRole('button', { name: '收起面试题' }).click()
  await expect(rowById(page, id).getByRole('button', { name: /打开面试题中的搜索结果/ })).toBeVisible()
  await expect(rowById(page, id).getByLabel('Vendor')).toHaveValue('Insight Global')
  await expect(rowById(page, id).getByLabel('面试者')).toHaveValue('王芳')
  await expect(rowById(page, id).getByLabel('面试官')).toHaveValue('Priya Raman')
})

test('中英文切换：登录页与主界面、日期提示、编辑器文案随之切换，并在刷新后保持', async ({ page }) => {
  // 与浏览器时区（playwright.config 中的 Asia/Shanghai）一致地计算「今天 / 明天」
  const shanghaiDate = (offsetDays: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date(Date.now() + offsetDays * 86_400_000))
  const id = await seedInterview({
    client: 'E2E-Lang',
    interview_at: `${shanghaiDate(1)}T15:00:00+08:00`,
    received_at: shanghaiDate(0),
    jd: paraDoc('Frontend role'),
  })

  // 登录页即可切换
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '登录 IMS' })).toBeVisible()
  await page.getByRole('button', { name: 'EN' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in to IMS' })).toBeVisible()
  await expect(page).toHaveTitle('IMS · Interviews')
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Password').fill(TEST_USER.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  // 主界面：按钮、列头、相对日期、文档单元格
  await expect(page.getByRole('button', { name: 'New interview' }).first()).toBeVisible()
  await page.getByLabel('Search', { exact: true }).fill('E2E-Lang')
  const row = rowById(page, id)
  await expect(page.getByRole('columnheader', { name: 'Candidate' })).toBeVisible()
  await expect(row.getByRole('button', { name: 'Interview date', exact: true })).toContainText('Tomorrow')
  await expect(row.getByRole('button', { name: 'Received', exact: true })).toContainText('Today')

  // 编辑器面板
  await row.getByRole('button', { name: 'Open JD' }).click()
  await expect(row.getByRole('tab', { name: 'Questions' })).toBeVisible()
  await expect(row.getByRole('button', { name: 'Export JD as PDF' })).toBeVisible()
  await row.getByRole('tab', { name: 'Notes' }).click()
  await expect(row.locator('.ProseMirror p.is-editor-empty')).toHaveAttribute('data-placeholder', /Prep notes/)

  // 日期选择器使用英文区域设置
  await row.getByRole('button', { name: 'Close panel' }).click()
  await row.getByRole('button', { name: 'Interview date', exact: true }).click()
  await expect(page.getByRole('button', { name: 'OK' })).toBeVisible()
  await page.keyboard.press('Escape')

  // 刷新后保持英文；切回中文
  await page.reload()
  await expect(page.getByRole('button', { name: 'New interview' }).first()).toBeVisible()
  await page.getByRole('button', { name: '中文' }).click()
  await expect(page.getByRole('button', { name: '新建面试' }).first()).toBeVisible()
  await expect(page).toHaveTitle('IMS · 面试管理')
})
