import { defineConfig } from '@playwright/test'

// 需要本地 Supabase（pnpm supabase start）与 .env.local 指向它
//
// 两个项目：
// - zh：主要用例按中文文案编写，测试服务器以 VITE_UI_LANG=zh 固定为中文界面
// - en：使用与线上相同的默认配置（英文界面），验证默认语言
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  globalSetup: './e2e/global-setup.ts',
  use: {
    // 默认使用本机 Chrome；也可 PW_CHANNEL= pnpm e2e 改用 playwright install 的 Chromium
    channel: process.env.PW_CHANNEL ?? 'chrome',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'zh', testIgnore: /english\.spec\.ts/, use: { baseURL: 'http://localhost:5189' } },
    { name: 'en', testMatch: /english\.spec\.ts/, use: { baseURL: 'http://localhost:5190' } },
  ],
  // 独立端口且不复用已有服务，确保测的一定是本项目
  webServer: [
    {
      command: 'pnpm dev --port 5189 --strictPort',
      url: 'http://localhost:5189',
      reuseExistingServer: false,
      env: { VITE_UI_LANG: 'zh' },
    },
    {
      command: 'pnpm dev --port 5190 --strictPort',
      url: 'http://localhost:5190',
      reuseExistingServer: false,
    },
  ],
})
