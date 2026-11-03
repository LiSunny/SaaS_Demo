/**
 * 截图：大屏「消防档案」页（ebike-v2）
 *
 * 三个 tab 各出一张 1920×1080 的图，用于交付留档与版式核对。
 * 用法: node scripts/shot-ebike-v2-fire-archive.mjs [输出目录]
 *
 * 前置：本地 dev server 在 3200（代理到 3201）、后端在 3201。
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.argv[2] ?? 'screenshots/ebike-v2-fire-archive'
const USER = { phone: '13300001111', password: 'admin123!@#' }

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(USER),
})
const body = await res.json()
if (!body?.data?.token) {
  console.error('登录失败:', JSON.stringify(body).slice(0, 300))
  process.exit(1)
}
const { token, user } = body.data

fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(BASE)
await page.evaluate(
  ({ token, user }) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
  },
  { token, user },
)

await page.goto(`${BASE}/landing/ebike-v2?bigscreenId=20`, { waitUntil: 'networkidle' })

// 等三维模型的加载遮罩撤下：遮罩在时主线程被渲染占满，
// Playwright 的可操作性检查（等元素稳定）会被饿死，导航点不动。
await page
  .waitForFunction(() => !document.querySelector('.campus-layer__loading'), undefined, { timeout: 60000 })
  .catch(() => console.log('  ! 模型加载遮罩未在 60s 内撤下，继续尝试点击导航'))
await page.waitForTimeout(1500)

// 顶栏导航第 4 项 = 消防档案。
// 点击超时是软件渲染下三维循环占满主线程所致（真实点击路径已由
// e2e/specs/ebike-v2-fire-archive.spec.ts 验证），截图脚本兜底直接派发事件。
const navItem = page.locator('.v2-nav__item', { hasText: '消防档案' })
try {
  await navItem.click({ timeout: 30000 })
} catch {
  console.log('  ! 导航点击超时，改用事件派发')
  await navItem.dispatchEvent('click')
}
await page.locator('.list-panel').waitFor({ state: 'visible', timeout: 30000 })
await page.waitForTimeout(1200)

for (const tab of ['值班记录', '巡查记录', '隐患台账']) {
  await page.locator('.list-panel__tab', { hasText: tab }).click()
  await page.waitForTimeout(500)
  const file = `${OUT}/${tab}.png`
  await page.screenshot({ path: file })
  console.log(file)
}

/* 「每页条数」下拉是 teleport 到 body 的，不在 .bigscreen 作用域内，
   单独取一张展开态，确认 popper-class 生效、下拉也是深色而不是白底。 */
await page.locator('.list-panel__tab', { hasText: '值班记录' }).click()
await page.waitForTimeout(400)
await page.locator('.list-panel__foot .el-pagination__sizes .el-select').click({ timeout: 15000 })
await page.waitForTimeout(600)
const dropdownFile = `${OUT}/分页-每页条数下拉.png`
await page.screenshot({ path: dropdownFile })
console.log(dropdownFile)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

/* 窄视口（1440×900，常见笔记本）复核：底部要同时容下分页器和右下角 AI 悬浮球 */
const narrow = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await narrow.goto(BASE)
await narrow.evaluate(
  ({ token, user }) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
  },
  { token, user },
)
await narrow.goto(`${BASE}/landing/ebike-v2?bigscreenId=20`, { waitUntil: 'networkidle' })
await narrow
  .waitForFunction(() => !document.querySelector('.campus-layer__loading'), undefined, { timeout: 60000 })
  .catch(() => {})
await narrow.waitForTimeout(1500)
const narrowNav = narrow.locator('.v2-nav__item', { hasText: '消防档案' })
try {
  await narrowNav.click({ timeout: 30000 })
} catch {
  await narrowNav.dispatchEvent('click')
}
await narrow.locator('.list-panel').waitFor({ state: 'visible', timeout: 30000 })
await narrow.waitForTimeout(1000)
const narrowFile = `${OUT}/值班记录-1440.png`
await narrow.screenshot({ path: narrowFile })
console.log(narrowFile)

await browser.close()
