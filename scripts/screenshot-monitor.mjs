// 截取协同监控页面，1920×1080 视口，对照设计稿
import { chromium } from 'playwright'
import { setTimeout as sleep } from 'node:timers/promises'

const URL = process.env.URL || 'http://localhost:3200/system/monitor'
const OUT = process.env.OUT || '/tmp/monitor.png'
const W = Number(process.env.W || 1920)
const H = Number(process.env.H || 1080)

const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

// 监听 console
page.on('console', (m) => console.log(`[console:${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))

// 写入 token 避免跳登录（如果需要）
await page.addInitScript(() => {
  localStorage.setItem('auth_token', 'mock-token-001')
  localStorage.setItem('userInfo', JSON.stringify({
    id: 1, username: '管理员', systemRole: 'platform-admin', role: 'admin',
  }))
})

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
await sleep(1500)
await page.screenshot({ path: OUT, fullPage: false })
console.log(`Saved: ${OUT}`)
await browser.close()
