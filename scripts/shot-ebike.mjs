/**
 * 截图：现有 /landing/ebike 大屏 + 新增大屏，用于与 Figma 设计稿逐块比对
 * 用法: node scripts/shot-ebike.mjs [输出目录] [路径1,路径2]
 */
import { chromium } from '@playwright/test'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.env.SHOT_OUT ?? 'screenshots/ebike-compare'
const USER = { phone: '13300001111', password: 'admin123!@#' }

const paths = (process.argv[3] ?? '/landing/ebike').split(',')
const outDir = process.argv[2] ?? OUT

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

for (const p of paths) {
  await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const name = p.replace(/[/?=&]/g, '_') || 'root'
  await page.screenshot({ path: `${outDir}/${name}.png` })
  console.log(`${outDir}/${name}.png`)
}

await browser.close()
