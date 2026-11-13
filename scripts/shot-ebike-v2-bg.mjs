/**
 * 大屏底色复核：逐 tab 截图 + 运行时背景色取值
 *
 * 目的：确认「大屏整体背景 = #000D34，所有 tab 共用」在运行时成立 ——
 * 不是只看 CSS 写没写，而是读每个 tab 下真实生效的 background-color。
 *
 * 用法: node scripts/shot-ebike-v2-bg.mjs [输出目录]
 * 前置：本地 dev server 在 3200（代理到 3201）、后端在 3201。
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.argv[2] ?? 'screenshots/ebike-v2-bg'
const USER = { phone: '13200002345', password: 'admin123!@#' }
const EXPECT = 'rgb(0, 13, 52)' // #000D34

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
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))

await page.goto(BASE)
await page.evaluate(
  ({ token, user }) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
  },
  { token, user },
)

await page.goto(`${BASE}/landing/ebike-v2?bigscreenId=20`, { waitUntil: 'domcontentloaded' })
await page
  .waitForFunction(() => !document.querySelector('.campus-layer__loading'), undefined, { timeout: 90000 })
  .catch(() => console.log('  ! 模型加载遮罩未撤下，继续'))
await page.waitForTimeout(2500)

/** 读当前 tab 下真实生效的背景：页面根 + tab 内容根 + 所有大面积不透明底 */
const probe = () =>
  page.evaluate(() => {
    const pick = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        cls: el.className?.toString?.().slice(0, 60) ?? '',
        bg: cs.backgroundColor,
        bgImage: cs.backgroundImage === 'none' ? '' : 'has-image',
        area: Math.round(r.width * r.height),
      }
    }
    const root = document.querySelector('.ebike-v2')
    // tab 内容根：导航页组件根元素
    const contentRoot = document.querySelector('.ebike-v2 > .duty, .ebike-v2 > .page-shell, .ebike-v2 > .archive, .ebike-v2 > .op-report')
    // 视口四角各 1px 的实际渲染色（用 elementFromPoint 找最上层元素）
    const corners = [
      ['左上', 8, 8],
      ['右上', 1912, 8],
      ['左下', 8, 1072],
      ['右下', 1912, 1072],
    ].map(([name, x, y]) => {
      const el = document.elementFromPoint(x, y)
      return { name, tag: el?.tagName, cls: el?.className?.toString?.().slice(0, 40) ?? '', bg: el ? getComputedStyle(el).backgroundColor : null }
    })
    // 页面根的 CSS 变量
    const vars = getComputedStyle(root)
    return {
      page: pick(root),
      contentRoot: pick(contentRoot),
      pageBgVar: vars.getPropertyValue('--bigscreen-page-bg').trim(),
      embedBgVar: vars.getPropertyValue('--embed-page-bg').trim(),
      corners,
    }
  })

const TABS = ['校园总览', '实时警情', '系统监测', '消防档案', '运行报告', '小尼平安']
const results = []

for (const label of TABS) {
  const item = page.locator('.v2-nav__item', { hasText: label })
  try {
    await item.click({ timeout: 20000 })
  } catch {
    await item.dispatchEvent('click')
  }
  await page.waitForTimeout(1800)
  const info = await probe()
  const file = `${OUT}/${label}.png`
  // 页面有持续动画（三维模型 + 异常点闪烁），整屏 screenshot 会等不到稳定帧；
  // 用 clip 走裁剪路径可直接出图（与 verify-ebike-v2-text-hierarchy.mjs 同法）。
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1920, height: 1080 }, timeout: 90000 })
  results.push({ label, file, ...info })
  console.log(`\n[${label}]`)
  console.log('  页面根背景 :', info.page?.bg, '| 变量 --bigscreen-page-bg =', info.pageBgVar)
  console.log('  tab 内容根 :', info.contentRoot ? `${info.contentRoot.cls} → ${info.contentRoot.bg}` : '（无）')
  console.log('  四角元素   :', info.corners.map((c) => `${c.name}:${c.cls || c.tag}=${c.bg}`).join('  '))
}

console.log('\n===== 底色断言 =====')
let failed = 0
for (const r of results) {
  const ok = r.page?.bg === EXPECT && r.pageBgVar.toLowerCase() === '#000d34'
  console.log(`  ${ok ? '✓' : '✗'} ${r.label}：页面根 ${r.page?.bg}（期望 ${EXPECT}），变量 ${r.pageBgVar}`)
  if (!ok) failed++
}

/* 泵房场景页 */
await page.goto(`${BASE}/landing/ebike-v2/pump-room?bigscreenId=20`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
await page.screenshot({ path: `${OUT}/泵房场景页.png`, clip: { x: 0, y: 0, width: 1920, height: 1080 }, timeout: 90000 })
const pump = await page.evaluate(() => {
  const el = document.querySelector('.pump-page')
  const cs = el ? getComputedStyle(el) : null
  const iframe = document.querySelector('iframe')
  return {
    bg: cs?.backgroundColor,
    inline: el?.getAttribute('style') ?? '',
    iframe: !!iframe,
  }
})
console.log('\n[泵房场景页]')
console.log('  .pump-page 背景 :', pump.bg)
console.log('  内联 style      :', pump.inline)
console.log('  三维 iframe      :', pump.iframe ? '已加载' : '缺失')
console.log(`  ${pump.bg === EXPECT ? '✓' : '✗'} 泵房页底色 = ${EXPECT}`)
if (pump.bg !== EXPECT) failed++

console.log('\n控制台错误:', errors.length ? errors : '无')
console.log(`\n${failed ? `✗ ${failed} 项未通过` : '✓ 全部通过'}`)
console.log('输出目录:', OUT)

await browser.close()
process.exit(failed ? 1 : 0)
