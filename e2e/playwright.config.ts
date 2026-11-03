import { defineConfig } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './specs',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // 串行执行，避免 SQLite test.db 竞争
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports' }],
    ['json', { outputFile: 'reports/test-results.json' }],
  ],
  use: {
    // 端口可覆盖（见 setup.mjs）：手工 dev server 常占着 3200，
    // 此时 e2e 起的前端会静默跑在那个 dev server 上（代理到真实后端/真实库）。
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // 全局前后置：创建 test.db → 启动前后端 → 运行测试 → 清理
  globalSetup: path.resolve(__dirname, 'setup.mjs'),
  globalTeardown: path.resolve(__dirname, 'global-teardown.mjs'),
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
})
