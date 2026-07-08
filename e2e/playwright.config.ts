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
    baseURL: 'http://localhost:3200',
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
