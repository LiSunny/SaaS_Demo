/* 完整演示录制 v2：只录 Agent 工作台画面
 * 预热 context 登录拿 localStorage → 录制 context 注入后直接进 /agent
 * 视频第一帧 = 工作台，无登录页/大屏画面；账号切换在工作台内刷新完成
 */
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const ROOT = process.cwd()
const SHOTS = path.join(ROOT, 'docs', '韧性AI助手', 'demo-shots')
const VIDEO = path.join(ROOT, 'docs', '韧性AI助手', 'demo-video')
fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(VIDEO, { recursive: true })
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

async function dumpLocalStorage(page) {
  return page.evaluate(() => {
    const o = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      o[k] = localStorage.getItem(k)
    }
    return o
  })
}

async function prepareLogin(browser, account) {
  const page = await browser.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/login?phone=${account.phone}&password=${encodeURIComponent(account.password)}&redirect=/agent`)
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 })
  await page.waitForTimeout(1500)
  const dump = await dumpLocalStorage(page)
  await page.close()
  return dump
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

async function switchAccount(page, dump, label) {
  console.log(`[切换账号] ${label}`)
  await page.evaluate(d => { localStorage.clear(); for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v) }, dump)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('textarea.input-area', { timeout: 15000 })
  await page.waitForTimeout(1800)
  console.log('      切换完成，工作台就绪')
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // ── 预热：登录两个角色，拿到 localStorage 快照 ──
  console.log('[预热] 登录监管机构…')
  const dumpRegulator = await prepareLogin(browser, ACCOUNTS.regulator)
  console.log('[预热] 登录社会单位…')
  const dumpUnit = await prepareLogin(browser, ACCOUNTS.unit)
  console.log('[预热] 完成，开始录制')

  // ── 录制 context：注入监管身份，第一帧即工作台 ──
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO, size: { width: 1440, height: 900 } },
  })
  await ctx.addInitScript(d => {
    try {
      for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v)
    } catch (e) { /* 首帧前可能无同源页面 */ }
  }, dumpRegulator)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/agent`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('textarea.input-area', { timeout: 15000 })
  await page.waitForTimeout(1500)
  console.log('[录制] 工作台已就绪（无登录画面）')

  // ── 幕 1：监管机构问告警 ──
  await ask(page, '今天辖区有什么告警？', '幕1-监管问告警.png', '幕1')

  // ── 幕 2：切换社会单位，同问 → 权限对比 ──
  await switchAccount(page, dumpUnit, ACCOUNTS.unit.label)
  await ask(page, '今天辖区有什么告警？', '幕2-学校问告警-权限对比.png', '幕2')

  // ── 幕 3：问得深（隐患 / 设备）──
  await ask(page, '我们有哪些隐患还没整改？', '幕3a-学校隐患未整改.png', '幕3a')
  await ask(page, '我们的设备都在线吗？', '幕3b-学校设备在线.png', '幕3b')

  // ── 幕 4：切回监管，出日报 + 产物 ──
  await switchAccount(page, dumpRegulator, ACCOUNTS.regulator.label + '（回场）')
  await ask(page, '出个今天的告警日报', '幕4-监管告警日报.png', '幕4')
  await page.locator('.col-right .right-tab').nth(1).click()
  await page.waitForSelector('.artifact-item', { timeout: 10000 })
  await page.waitForTimeout(1500)
  await page.locator('.col-collapse-btn').first().click()
  await page.waitForTimeout(600)
  await page.evaluate(() => {
    const el = document.querySelector('.col-right')
    if (el) { el.style.width = '700px'; el.style.flex = '0 0 700px'; el.style.maxWidth = 'none' }
  })
  await page.waitForTimeout(900)
  await page.screenshot({ path: path.join(SHOTS, '幕4-产物卡片.png') })
  console.log('      📸 幕4-产物卡片.png')

  // ── 幕 5：调用时间线（过程透明）──
  await page.locator('.col-right .right-tab').nth(0).click()
  await page.waitForSelector('.tl-node', { timeout: 10000 })
  await page.waitForTimeout(800)
  await page.locator('.tl-node summary').first().click()
  await page.waitForTimeout(1800)
  await page.screenshot({ path: path.join(SHOTS, '幕5-调用时间线.png') })
  console.log('      📸 幕5-调用时间线.png')

  await browser.close()
  const vids = fs.readdirSync(VIDEO)
  console.log('[完成] 视频文件:', vids)
})().catch(e => { console.error('[FAIL]', e.message); process.exit(1) })
