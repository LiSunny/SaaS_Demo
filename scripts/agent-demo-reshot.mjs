/* 重截幕4-监管告警日报：折叠左栏 + 右栏700px，产物表格舒展无乱码 */
import { chromium } from 'playwright'
import path from 'node:path'

const ROOT = process.cwd()
const SHOTS = path.join(ROOT, 'docs', '韧性AI助手', 'demo-shots')
const BASE = 'http://localhost:3200'

async function waitForAI(page, timeoutMs = 180000) {
  let last = '', stable = 0
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const cur = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.msg.assistant')
      if (!msgs.length) return ''
      return msgs[msgs.length - 1].textContent || ''
    })
    if (cur && cur === last) { stable++; if (stable >= 3) return cur } else { stable = 0; last = cur }
    await page.waitForTimeout(2500)
  }
  throw new Error('等待 AI 回答超时')
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const prep = await browser.newPage()
  await prep.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await prep.evaluate(() => localStorage.clear())
  await prep.goto(`${BASE}/login?phone=13000000001&password=${encodeURIComponent('admin123!@#')}&redirect=/agent`)
  await prep.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 })
  await prep.waitForTimeout(1200)
  const dump = await prep.evaluate(() => {
    const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k) }
    return o
  })
  await prep.close()

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(d => { try { for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v) } catch (e) {} }, dump)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/agent`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('textarea.input-area', { timeout: 15000 })
  await page.waitForTimeout(1200)

  console.log('[提问] 出个今天的告警日报')
  await page.fill('textarea.input-area', '出个今天的告警日报')
  await page.waitForTimeout(500)
  await page.click('button.send-btn')
  const text = await waitForAI(page)
  console.log(`[回答] ${text.slice(0, 120).replace(/\n/g, ' ')}`)
  await page.waitForTimeout(2000)

  // 切回「调用时间线」Tab：右栏时间线节点窄栏不挤压，聊天表格全宽舒展
  await page.locator('.col-right .right-tab').nth(0).click()
  await page.waitForSelector('.tl-node', { timeout: 10000 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(SHOTS, '幕4-监管告警日报.png') })
  console.log('[完成] 已替换 幕4-监管告警日报.png（三栏布局，聊天表格全宽）')
  await browser.close()
})().catch(e => { console.error('[FAIL]', e.message); process.exit(1) })
