import { expect, test } from '@playwright/test'
import { deleteE2ERows, rowById, seedInterview, TEST_USER } from './fixtures'

// 线上默认配置：界面固定为英文，不提供语言切换

test.afterAll(deleteE2ERows)

test('默认英文界面，没有语言切换；浏览器里存过中文也不生效', async ({ page }) => {
  // 模拟之前在切换开放时选过中文的用户
  await page.addInitScript(() => localStorage.setItem('ims.lang', 'zh'))
  const id = await seedInterview({ client: 'E2E-English', received_at: '2026-09-01' })

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Sign in to IMS' })).toBeVisible()
  await expect(page).toHaveTitle('IMS · Interviews')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('button', { name: 'EN' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '中文' })).toHaveCount(0)

  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Password').fill(TEST_USER.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('button', { name: 'New interview' }).first()).toBeVisible()
  await expect(page.getByRole('group', { name: 'Language' })).toHaveCount(0)
  await page.getByLabel('Search', { exact: true }).fill('E2E-English')
  await expect(rowById(page, id).getByRole('button', { name: 'Open Questions' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Candidate' })).toBeVisible()
})
