/* 介绍页截图刷新 v3（2026-08-19）
 * 修复：8/18 重构后 addInitScript 在 reload 时重新注入旧 dump 导致账号切换失效。
 * 方案：每个账号独立 context（各注入自己的 dump），切换账号 = 换 context/page，不做 reload 覆盖。
 */
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const ROOT = process.cwd()
const SHOTS = path.join(ROOT, 'public', 'agent-intro', 'demo-shots')
fs.mkdirSync(SHOTS, { recursive: true })
const BASE = 'http://localhost:3200'
const ACCOUNTS = {
  regulator: { phone: '13000000001', password: 'admin123!@#', label: '监管机构 · 海港应急局' },
  unit:      { phone: '13100001234', password: 'admin123!@#', label: '社会单位 · 新思维高级中学' },
}

async function waitForAI(page, timeoutMs = 180000) {
  let last = '', stable = 0
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const cur = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.msg.assistant')
      if (!msgs.length) return ''
      return msgs[msgs.length - 1].textContent || ''
    })
    if (cur && cur === last) {
      stable++
      if (stable >= 3) return { text: cur, ms: Date.now() - start }
    } else { stable = 0; last = cur }
    await page.waitForTimeout(2500)
  }
  throw new Error('等待 AI 回答超时')
}

async function prepareDump(browser, account) {
  const page = await browser.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/login?phone=${account.phone}&password=${encodeURIComponent(account.password)}&redirect=/agent`)
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 })
  await page.waitForTimeout(1500)
  const dump = await page.evaluate(() => {
    const o = {}
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k) }
    return o
  })
  await page.close()
  return dump
}

/* 独立 context + 注入身份 → 返回就绪的工作台页面 */
async function openWorkbench(browser, dump) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(d => {
    try { for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v) } catch (e) {}
  }, dump)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/agent`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('textarea.input-area', { timeout: 15000 })
  await page.waitForTimeout(1500)
  return page
}

async function ask(page, question, shotName, label) {
  console.log(`[提问] ${label}：「${question}」`)
  await page.fill('textarea.input-area', question)
  await page.waitForTimeout(600)
  await page.click('button.send-btn')
  const r = await waitForAI(page)
  console.log(`      回答完成（${r.ms}ms, ${r.text.length}字）`)
  await page.waitForTimeout(1800)
  if (shotName) {
    await page.screenshot({ path: path.join(SHOTS, shotName) })
    console.log(`      📸 ${shotName}`)
  }
  return r.text
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  console.log('[预热] 登录监管机构…')
  const dumpRegulator = await prepareDump(browser, ACCOUNTS.regulator)
  console.log('[预热] 登录社会单位…')
  const dumpUnit = await prepareDump(browser, ACCOUNTS.unit)
  console.log('[预热] 完成，开始截图')

  // ── 幕 1：监管机构问告警 ──
  const pReg = await openWorkbench(browser, dumpRegulator)
  await ask(pReg, '今天辖区有什么告警？', '幕1-监管问告警.png', '幕1')

  // ── 幕 2/3：社会单位（独立 context，同问 → 权限对比）──
  const pUnit = await openWorkbench(browser, dumpUnit)
  await ask(pUnit, '今天辖区有什么告警？', '幕2-学校问告警-权限对比.png', '幕2')
  await ask(pUnit, '我们有哪些隐患还没整改？', '幕3a-学校隐患未整改.png', '幕3a')
  await ask(pUnit, '我们的设备都在线吗？', '幕3b-学校设备在线.png', '幕3b')

  // ── 幕 4：回监管，出日报 + 产物 ──
  await ask(pReg, '出个今天的告警日报', null, '幕4')
  // 8/18 后生成产物会自动切到「产物」Tab —— 聊天表格截图前必须切回时间线 Tab（铁律：聊天图右栏保持时间线）
  await pReg.locator('.col-right .right-tab').nth(0).click()
  await pReg.waitForTimeout(800)
  await pReg.screenshot({ path: path.join(SHOTS, '幕4-监管告警日报.png') })
  console.log('      📸 幕4-监管告警日报.png')

  await pReg.locator('.col-right .right-tab').nth(1).click()
  await pReg.waitForSelector('.artifact-item', { timeout: 10000 })
  await pReg.waitForTimeout(1500)
  await pReg.locator('.col-expand-btn').first().click()  // first = 收起会话列表（折叠左栏，8/18 重构后新选择器）
  await pReg.waitForTimeout(600)
  await pReg.evaluate(() => {
    const el = document.querySelector('.col-right')
    if (el) { el.style.width = '950px'; el.style.flex = '0 0 950px'; el.style.maxWidth = 'none' }
  })
  await pReg.waitForTimeout(900)
  await pReg.screenshot({ path: path.join(SHOTS, '幕4-产物卡片.png') })
  console.log('      📸 幕4-产物卡片.png')

  // ── 幕 5：调用时间线（过程透明）──
  await pReg.locator('.col-right .right-tab').nth(0).click()
  await pReg.waitForSelector('.tl-node', { timeout: 10000 })
  await pReg.waitForTimeout(800)
  await pReg.locator('.tl-node summary').first().click()
  await pReg.waitForTimeout(1800)
  await pReg.screenshot({ path: path.join(SHOTS, '幕5-调用时间线.png') })
  console.log('      📸 幕5-调用时间线.png')

  await browser.close()
  const files = fs.readdirSync(SHOTS).filter(f => f.endsWith('.png'))
  console.log('[完成] 截图文件:', files)
})().catch(e => { console.error('[FAIL]', e.message); process.exit(1) })
