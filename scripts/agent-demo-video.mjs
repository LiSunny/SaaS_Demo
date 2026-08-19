/* 介绍页演示视频录制（2026-08-19）
 * 单 context 连续录制：recordVideo 是 context 级，账号切换必须留在同一 context 内。
 * 切换方案：sessionStorage 标记 + localStorage.__identity 运行时身份源
 *   - addInitScript 每次加载从 __identity 读「当前身份 dump」注入（闭包只持有初始值）
 *   - 切换账号 = 写 __identity + 清标记 → reload → addInitScript 注入新 dump
 * 布局保持三栏稳定（录制期间不改 inline style），产物展示 = Tab 切换 + 节点展开。
 */
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const ROOT = process.cwd()
const VIDEO_DIR = path.join(ROOT, 'public', 'agent-intro', 'demo-video')
const TMP_DIR = '/tmp/agent-video-new'
fs.mkdirSync(TMP_DIR, { recursive: true })
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

/* 切换账号：写 __identity（addInitScript 的数据源）+ 清标记 + reload */
async function switchAccount(page, dump, label) {
  console.log(`[切换账号] ${label}`)
  await page.evaluate(d => {
    sessionStorage.removeItem('__injected_once')
    localStorage.clear()
    localStorage.setItem('__identity', JSON.stringify(d))
    for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v)
  }, dump)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('textarea.input-area', { timeout: 15000 })
  await page.waitForTimeout(1800)
  console.log('      切换完成，工作台就绪')
}

async function ask(page, question, label) {
  console.log(`[提问] ${label}：「${question}」`)
  await page.fill('textarea.input-area', question)
  await page.waitForTimeout(600)
  await page.click('button.send-btn')
  const r = await waitForAI(page)
  console.log(`      回答完成（${r.ms}ms, ${r.text.length}字）`)
  await page.waitForTimeout(2200)
  return r.text
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  console.log('[预热] 登录监管机构…')
  const dumpRegulator = await prepareDump(browser, ACCOUNTS.regulator)
  console.log('[预热] 登录社会单位…')
  const dumpUnit = await prepareDump(browser, ACCOUNTS.unit)
  console.log('[预热] 完成，开始录制')

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: TMP_DIR, size: { width: 1440, height: 900 } },
  })
  await ctx.addInitScript(initial => {
    try {
      if (!sessionStorage.getItem('__injected_once')) {
        sessionStorage.setItem('__injected_once', '1')
        let cur = localStorage.getItem('__identity')
        if (!cur) { cur = JSON.stringify(initial); localStorage.setItem('__identity', cur) }
        const d = JSON.parse(cur)
        for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v)
      }
    } catch (e) {}
  }, dumpRegulator)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/agent`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('textarea.input-area', { timeout: 15000 })
  await page.waitForTimeout(1800)
  console.log('[录制] 工作台已就绪（无登录画面）')

  // ── 幕 1：监管机构问告警 ──
  await ask(page, '今天辖区有什么告警？', '幕1')

  // ── 幕 2/3：切换社会单位，同问 → 权限对比 + 问得深 ──
  await switchAccount(page, dumpUnit, ACCOUNTS.unit.label)
  await ask(page, '今天辖区有什么告警？', '幕2')
  await ask(page, '我们有哪些隐患还没整改？', '幕3a')
  await ask(page, '我们的设备都在线吗？', '幕3b')

  // ── 幕 4：切回监管，出日报 + 展示产物 ──
  await switchAccount(page, dumpRegulator, ACCOUNTS.regulator.label + '（回场）')
  await ask(page, '出个今天的告警日报', '幕4')
  await page.locator('.col-right .right-tab').nth(1).click()
  await page.waitForSelector('.artifact-item', { timeout: 10000 })
  await page.waitForTimeout(2600)

  // ── 幕 5：切回时间线，展开节点（过程透明）──
  await page.locator('.col-right .right-tab').nth(0).click()
  await page.waitForSelector('.tl-node', { timeout: 10000 })
  await page.waitForTimeout(1000)
  await page.locator('.tl-node summary').first().click()
  await page.waitForTimeout(2400)

  console.log('[完成] 关闭浏览器，webm 落盘中…')
  await browser.close()

  const vids = fs.readdirSync(TMP_DIR).filter(f => f.endsWith('.webm'))
  console.log('[落盘] webm:', vids)
  if (!vids.length) throw new Error('未生成 webm')
})().catch(e => { console.error('[FAIL]', e.message); process.exit(1) })
