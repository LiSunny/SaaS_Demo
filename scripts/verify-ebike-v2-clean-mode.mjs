/**
 * 校验 ebike-v2 总览页「清屏」入口：
 *   1. 清屏入口在昼夜切换正下方（左缘齐平、纵向堆叠，设计稿 70:313 模型区左缘两枚控件）；
 *   2. 点击后顶栏 / 左右模块列 / 悬浮控件组 / 全局悬浮机器人全部隐藏，
 *      画面只剩三维模型；
 *   3. 右下角退出入口可见，Esc 与点击退出都能还原大屏。
 * 用法: node scripts/verify-ebike-v2-clean-mode.mjs
 */
import { chromium } from '@playwright/test'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.env.SHOT_OUT ?? 'screenshots/ebike-v2-clean'
const USER = { phone: '13300001111', password: 'admin123!@#' }

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(USER),
})
const { data } = await res.json()
if (!data?.token) {
  console.error('登录失败')
  process.exit(1)
}

const browser = await chromium.launch()
let failed = 0

/**
 * 采集当前可见状态
 */
const probe = (page) =>
  page.evaluate(() => {
    const visible = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return false
      const s = getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden') return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }
    const rect = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) }
    }
    const frame = document.querySelector('.campus-layer__frame')
    return {
      header: visible('.bs-title-bar'),
      colLeft: visible('.col--left'),
      colRight: visible('.col--right'),
      tools: visible('.ebike-v2__scene-tools'),
      fab: visible('.agent-floating-chat'),
      model: visible('.campus-layer__frame'),
      exitBtn: visible('.v2-clean-toggle--floating'),
      inlineBtn: visible('.ebike-v2__scene-tools .v2-clean-toggle'),
      timeSwitch: visible('.v2-time__switch'),
      bodyClean: document.body.classList.contains('ebike-clean-mode'),
      frameRect: frame ? rect('.campus-layer__frame') : null,
      switchRect: rect('.v2-time__switch'),
      cleanRect: rect('.ebike-v2__scene-tools .v2-clean-toggle'),
      exitRect: rect('.v2-clean-toggle--floating'),
    }
  })

/**
 * 真实鼠标点击。
 * 不用 locator.click：本页所有浮在三维模型 iframe 之上的控件，
 * Playwright 的可操作性检查（visible/stable）都判定不过（既有控件同样如此），
 * 而 CDP 真实输入事件命中正常——与用户实际点击一致。
 */
async function clickAt(page, selector) {
  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, selector)
  if (!box) throw new Error(`未找到元素：${selector}`)
  await page.mouse.click(box.x, box.y)
}

for (const vp of [{ width: 1920, height: 1080 }, { width: 1443, height: 988 }]) {
  const page = await browser.newPage({ viewport: vp })
  await page.goto(BASE)
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
    },
    { token: data.token, user: data.user },
  )
  await page.goto(`${BASE}/landing/ebike-v2?bigscreenId=20`, { waitUntil: 'networkidle' })
  await page
    .waitForFunction(() => !document.querySelector('.campus-layer__loading'), null, { timeout: 90000 })
    .catch(() => console.log('  ! 模型加载遮罩未在 90s 内撤下'))
  await page.waitForTimeout(1200)

  const before = await probe(page)

  // ① 入口在昼夜切换正下方：左缘齐平、纵向堆叠（设计稿 70:313 的模型区左缘两枚控件）
  const stacked = Math.abs(before.cleanRect.x - before.switchRect.x) <= 2
  const below = before.cleanRect.y >= before.switchRect.b && before.cleanRect.y - before.switchRect.b <= 16
  // 同高：两枚控件等高
  const sameHeight = Math.abs(before.switchRect.h - before.cleanRect.h) <= 2

  // ② 点击清屏
  await clickAt(page, '.ebike-v2__scene-tools .v2-clean-toggle')
  await page.waitForTimeout(500)
  const clean = await probe(page)
  await page.screenshot({ path: `${OUT}/清屏态-${vp.width}.png`, timeout: 90000 })

  // ③ Esc 退出
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  const afterEsc = await probe(page)

  // ④ 再清屏 + 点退出按钮
  await clickAt(page, '.ebike-v2__scene-tools .v2-clean-toggle')
  await page.waitForTimeout(400)
  const clean2 = await probe(page)
  await clickAt(page, '.v2-clean-toggle--floating')
  await page.waitForTimeout(400)
  const afterBtn = await probe(page)
  if (vp.width === 1920) {
    await page.screenshot({ path: `${OUT}/退出后还原-${vp.width}.png`, timeout: 90000 })
  }

  const checks = [
    ['清屏入口在昼夜切换正下方', stacked && below, `左缘差${Math.abs(before.cleanRect.x - before.switchRect.x)}px 纵向间距${before.cleanRect.y - before.switchRect.b}px`],
    ['清屏入口与昼夜切换同高', sameHeight, `开关${before.switchRect.h}px 入口${before.cleanRect.h}px`],
    ['常态：顶栏/模块列/控件组可见', before.header && before.colLeft && before.colRight && before.tools, ''],
    ['常态：模型铺满视口', before.model && before.frameRect.w === vp.width && before.frameRect.h === vp.height, `${before.frameRect?.w}x${before.frameRect?.h}`],
    ['清屏：顶栏隐藏', !clean.header, ''],
    ['清屏：左右模块列隐藏', !clean.colLeft && !clean.colRight, ''],
    ['清屏：悬浮控件组隐藏', !clean.tools, ''],
    ['清屏：全局悬浮机器人隐藏', !clean.fab, ''],
    ['清屏：只剩三维模型', clean.model && clean.bodyClean, ''],
    ['清屏：模型仍铺满视口', clean.frameRect.w === vp.width && clean.frameRect.h === vp.height, `${clean.frameRect?.w}x${clean.frameRect?.h}`],
    ['清屏：右下角退出入口可见', clean.exitBtn, ''],
    ['退出入口在右下角', clean.exitRect.r >= vp.width - 40 && clean.exitRect.b >= vp.height - 40 && clean.exitRect.r > vp.width / 2 && clean.exitRect.b > vp.height / 2, `右下 ${clean.exitRect?.r}x${clean.exitRect?.b}`],
    ['Esc 退出后大屏还原', afterEsc.header && afterEsc.colLeft && afterEsc.colRight && afterEsc.tools && !afterEsc.exitBtn && !afterEsc.bodyClean, ''],
    ['退出按钮还原大屏', afterBtn.header && afterBtn.colLeft && afterBtn.colRight && afterBtn.tools && !afterBtn.exitBtn, ''],
  ]

  console.log(`\n===== ${vp.width}x${vp.height} =====`)
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? `：${detail}` : ''}`)
    if (!ok) failed++
  }
  await page.close()
}

await browser.close()
console.log(failed ? `\n✗ ${failed} 项未通过` : '\n✓ 全部通过')
process.exit(failed ? 1 : 0)
