/**
 * 验证大屏选择浮层的跳转：点「校园值守监控可视化大屏」应落到 ebike-v2，
 * 点「港南二中大屏」应落到 campus —— 两者必须是不同的页面。
 *
 * 用法: node scripts/verify-bigscreen-picker-jump.mjs
 */
import { chromium } from '@playwright/test'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.env.SHOT_OUT ?? 'screenshots/bigscreen-picker'
const USER = { phone: '13100001234', password: 'admin123!@#' }

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(USER),
})
const { data } = await res.json()
if (!data?.token) {
  console.error('登录失败:', JSON.stringify(await res.json()).slice(0, 300))
  process.exit(1)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1443, height: 988 } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))

await page.goto(BASE)
await page.evaluate(
  ({ token, user }) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
  },
  { token: data.token, user: data.user },
)
await page.goto(`${BASE}/workbench`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)

// 打开大屏选择浮层
await page.click('.user-area .icon-btn[title*="大屏"]')
await page.waitForSelector('.bs-picker-card', { timeout: 10000 })

const cards = await page.$$eval('.bs-picker-card', (els) =>
  els.map((el) => ({
    name: el.querySelector('.bs-picker-name')?.textContent?.trim(),
    scenario: el.querySelector('.bs-picker-scenario')?.textContent?.trim(),
    isDefault: !!el.querySelector('.bs-picker-default-badge'),
  })),
)
console.log('浮层里的卡片:')
for (const c of cards) console.log(`  - ${c.name}（${c.scenario}）${c.isDefault ? ' [默认]' : ''}`)

await page.screenshot({ path: `${OUT}/_picker.png` })

// 逐张卡片点击，捕获新开标签页的 URL 与页面特征
const results = []
for (let i = 0; i < cards.length; i++) {
  const card = (await page.$$('.bs-picker-card'))[i]
  const label = cards[i].name
  const [popup] = await Promise.all([
    ctx.waitForEvent('page', { timeout: 15000 }),
    card.click(),
  ])
  await popup.waitForLoadState('domcontentloaded')
  await popup.waitForTimeout(2500)

  const url = new URL(popup.url())
  const info = await popup.evaluate(() => ({
    headerTitle:
      document.querySelector('.bs-title-bar__title, .header-title, .cm-header__title')?.textContent?.trim()
      ?? null,
    hasCampusModel: !!document.querySelector('.campus-layer__frame, .campus-layer'),
    hasV2Nav: !!document.querySelector('.v2-nav__item'),
    hasCampusPage: !!document.querySelector('.campus-bigscreen'),
    bodyClass: document.body.className || null,
  }))

  console.log(`\n点击「${label}」`)
  console.log(`  URL  : ${url.pathname}${url.search}`)
  console.log(`  页面  : ${JSON.stringify(info)}`)

  results.push({ label, path: url.pathname, search: url.search, ...info })

  await popup.close()
  // 重新打开浮层供下一张卡片点击
  await page.waitForTimeout(300)
  if (i < cards.length - 1) {
    await page.click('.user-area .icon-btn[title*="大屏"]')
    await page.waitForSelector('.bs-picker-card', { timeout: 10000 })
  }
}

// 断言
const watch = results.find((r) => r.label?.includes('校园值守'))
const gangnan = results.find((r) => r.label?.includes('港南二中'))

const checks = [
  ['浮层有 2 张卡片', cards.length === 2, `实际 ${cards.length}`],
  ['「校园值守监控」→ ebike-v2 路由', watch?.path === '/landing/ebike-v2', watch?.path],
  ['「校园值守监控」带 bigscreenId=20', watch?.search === '?bigscreenId=20', watch?.search],
  ['「校园值守监控」渲染 ebike-v2 顶栏', watch?.hasV2Nav === true, JSON.stringify(watch?.headerTitle)],
  ['「校园值守监控」含校园三维模型', watch?.hasCampusModel === true, String(watch?.hasCampusModel)],
  ['「港南二中」→ campus 路由', gangnan?.path === '/landing/campus', gangnan?.path],
  ['「港南二中」渲染 campus 页', gangnan?.hasCampusPage === true, String(gangnan?.hasCampusPage)],
  ['两条记录落到不同页面', watch?.path !== gangnan?.path, `${watch?.path} vs ${gangnan?.path}`],
]

console.log('\n===== 大屏选择跳转断言 =====')
let failed = 0
for (const [name, ok, detail] of checks) {
  console.log(`  ${ok ? '✓' : '✗'} ${name}：${detail}`)
  if (!ok) failed++
}
console.log('控制台错误:', errors.length ? errors.slice(0, 5) : '无')
console.log(failed ? `\n✗ ${failed} 项未通过` : '\n✓ 全部通过')

await browser.close()
process.exit(failed ? 1 : 0)
