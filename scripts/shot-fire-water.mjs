/**
 * 截图脚本：按设计稿目标视口（1920×1080）截三个视图
 * 用法：node scripts/shot-fire-water.mjs
 */
import { chromium } from '@playwright/test'

const API = process.env.E2E_API ?? 'http://localhost:3202'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const USER = { phone: '13300001111', password: 'admin123!@#' }
const OUT = process.env.SHOT_OUT ?? 'figma-preview'

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(USER),
})
const body = await res.json()
const { token, user } = body.data

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
await page.goto(`${BASE}/device-facility/monitor/fire-water`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const shots = [
  { tab: '系统总览', file: 'shot-overview.png' },
  { tab: '报警记录', file: 'shot-alarm.png' },
  { tab: '设备台帐', file: 'shot-ledger.png' },
]
for (const s of shots) {
  await page.locator('.fw-tabs__item', { hasText: s.tab }).click()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/${s.file}` })
  console.log('saved', `${OUT}/${s.file}`)
}

// 垂直滚动量（目标视口）
const v = await page.evaluate(() => {
  const mc = document.querySelector('main.main-content')
  return mc ? { v: mc.scrollHeight - mc.clientHeight, h: mc.scrollWidth - mc.clientWidth } : null
})
console.log('overflow @1920x1080:', JSON.stringify(v))

await browser.close()
