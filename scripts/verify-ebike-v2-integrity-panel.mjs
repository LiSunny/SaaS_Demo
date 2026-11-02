/**
 * 校验 ebike-v2「消防设备完好率」卡与 Figma 70:703 的版式一致性。
 *
 * 容器口径（1920×1080 画布，右列上卡 1382..1904 × 86..586）：
 *   列宽左右等宽 522、模型区 844 = 522 × φ（1 : φ : 1 黄金分割）
 *   卡头 40（86..126）→ 卡体 460（126..586）
 *   卡体内距 10px 12px → 内容区 x 1394..1892、y 136..576
 *   总体块内距 8px 12px 0 → 横向内容 x 1406..1880
 *     · 图标框 48×48，贴内容左缘（1532），垂直居中于 64 高的行内
 *     · 标题「完好率」15px + 说明角标 13×13
 *     · 数值 32px，百分号 16px
 *     · 状态分布环 64×64，右缘对齐 1880
 *     · 图例 2 行 2 列，列距 25（第二列色块左缘 1655.5，与第一列相距 249.5），
 *       色块 10×10，百分比右对齐
 *   分隔线 1px（y ≈ 284）
 *   8 系统网格 2 列 4 行、行距 8，格内两行：
 *     · 第 1 行 14px 图标 + 系统名 14px + 右对齐台数 14px
 *     · 第 2 行 「完好率」14px + 占比条 4px + 右对齐百分比 14px
 *
 * 用法: node scripts/verify-ebike-v2-integrity-panel.mjs
 */
import { chromium } from '@playwright/test'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.env.SHOT_OUT ?? 'screenshots/ebike-v2-integrity'
const USER = { phone: '13300001111', password: 'admin123!@#' }

/** 1920 画布下的设计坐标 */
const DESIGN = {
  cardLeft: 1382,
  cardRight: 1904,
  cardTop: 86,
  cardBottom: 586,
  bodyTop: 126,
  contentLeft: 1394,
  contentRight: 1892,
  contentTop: 136,
  contentBottom: 576,
  totalInsetLeft: 12,
  totalInsetRight: 12,
  ringSize: 64,
  iconSize: 48,
  swatchSize: 10,
  /** 图例列距 25 → 第二列色块与第一列相距 249.5 */
  legendColPitch: 249.5,
  gridGap: 8,
  sysRows: 4,
  sysCols: 2,
}

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

for (const vp of [{ width: 1920, height: 1080 }, { width: 1443, height: 988 }, { width: 2560, height: 1440 }]) {
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
    .waitForFunction(() => !document.querySelector('.campus-layer__loading'), null, { timeout: 60000 })
    .catch(() => console.log('  ! 模型加载遮罩未在 60s 内撤下'))
  await page.waitForTimeout(2500)

  const r = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return {
        x: +b.x.toFixed(1),
        y: +b.y.toFixed(1),
        w: +b.width.toFixed(1),
        h: +b.height.toFixed(1),
        r: +b.right.toFixed(1),
        b: +b.bottom.toFixed(1),
      }
    }
    const q = (sel) => document.querySelector(sel)
    const qa = (sel) => [...document.querySelectorAll(sel)]
    const card = q('.col--right .col__item--top')
    const body = q('.col--right .col__item--top .iip')
    const total = q('.iip__total')
    const ring = q('.iip__total-row .donut')
    const icon = q('.iip__iconbox')
    const legend = qa('.iip__legend-item')
    const dots = qa('.iip__legend-dot')
    const sys = qa('.iip__sys')
    const sysRows = qa('.iip__sys-row')
    const bar = q('.iip__sys-bar')
    const divider = q('.iip__divider')
    const grid = q('.iip__systems')
    return {
      card: rect(card),
      body: rect(body),
      total: rect(total),
      ring: rect(ring),
      icon: rect(icon),
      legend: legend.map(rect),
      dots: dots.map(rect),
      sys: sys.map(rect),
      sysRows: sysRows.map(rect),
      bar: rect(bar),
      divider: rect(divider),
      grid: rect(grid),
      sysBg: sys[0] ? getComputedStyle(sys[0]).backgroundColor : null,
      sysRadius: sys[0] ? getComputedStyle(sys[0]).borderRadius : null,
      legendCol: dots[0] && dots[1] ? { c1: rect(dots[0]).x, c2: rect(dots[1]).x } : null,
      totalOverflow: body ? body.scrollHeight - body.clientHeight : null,
      sysOverflow: grid ? grid.scrollHeight - grid.clientHeight : null,
      nameEllipsis: qa('.iip__sys-name').map((el) => el.scrollWidth - el.clientWidth),
    }
  })

  const kw = vp.width / 1920
  const kh = vp.height / 1080
  const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol
  const checks = [
    ['卡片右缘 == 1904（设计）', near(r.card.r, DESIGN.cardRight * kw), `实测${r.card.r} 期望${(DESIGN.cardRight * kw).toFixed(1)}`],
    ['卡片左缘 == 1382（右列左缘）', near(r.card.x, DESIGN.cardLeft * kw), `实测${r.card.x} 期望${(DESIGN.cardLeft * kw).toFixed(1)}`],
    ['卡片宽度 == 522（列宽）', near(r.card.w, 522 * kw), `实测${r.card.w} 期望${(522 * kw).toFixed(1)}`],
    ['卡片顶边 == 86（设计）', near(r.card.y, DESIGN.cardTop * kh), `实测${r.card.y} 期望${(DESIGN.cardTop * kh).toFixed(1)}`],
    ['卡片底边 == 586（设计）', near(r.card.b, DESIGN.cardBottom * kh), `实测${r.card.b} 期望${(DESIGN.cardBottom * kh).toFixed(1)}`],
    ['卡体顶边 == 126（卡头 40）', near(r.body.y, DESIGN.bodyTop * kh), `实测${r.body.y} 期望${(DESIGN.bodyTop * kh).toFixed(1)}`],
    ['总体块左内缩 12', near(r.total.x - r.body.x, DESIGN.totalInsetLeft * kw), `实测${(r.total.x - r.body.x).toFixed(1)}`],
    ['环直径 == 64（按 min(宽,高) 缩放）', near(r.ring.w, Math.min(DESIGN.ringSize * kw, DESIGN.ringSize * kh)), `实测${r.ring.w} 期望${Math.min(DESIGN.ringSize * kw, DESIGN.ringSize * kh).toFixed(1)}`],
    ['环右缘 == 1880（内容右缘 − 12）', near(r.ring.r, DESIGN.contentRight * kw - DESIGN.totalInsetRight * kw), `实测${r.ring.r} 期望${(DESIGN.contentRight * kw - DESIGN.totalInsetRight * kw).toFixed(1)}`],
    ['图标框宽 == 48（按 min(宽,高) 缩放）', near(r.icon.w, Math.min(DESIGN.iconSize * kw, DESIGN.iconSize * kh)), `实测${r.icon.w} 期望${Math.min(DESIGN.iconSize * kw, DESIGN.iconSize * kh).toFixed(1)}`],
    ['图标框贴内容左缘', near(r.icon.x, r.total.x + DESIGN.totalInsetLeft * kw), `实测${r.icon.x}`],
    ['图例 4 项', r.legend.length === 4, `实测${r.legend.length}`],
    ['图例色块 10×10', r.dots.length === 4 && r.dots.every((d) => near(d.w, DESIGN.swatchSize * kw) && near(d.h, DESIGN.swatchSize * kw)), r.dots.map((d) => `${d.w}×${d.h}`).join(' ')],
    ['图例第二列色块 == 1655.5（列距 25）', near(r.legendCol.c2 - r.legendCol.c1, DESIGN.legendColPitch * kw), `实测${(r.legendCol.c2 - r.legendCol.c1).toFixed(1)} 期望${(DESIGN.legendColPitch * kw).toFixed(1)}`],
    ['分隔线 1px', near(r.divider.h, Math.max(1, kh)), `实测${r.divider.h}`],
    ['系统网格 4 行', r.sysRows.length === DESIGN.sysRows, `实测${r.sysRows.length}`],
    ['系统卡 8 张', r.sys.length === 8, `实测${r.sys.length}`],
    ['系统卡底色 rgba(0,84,160,0.2)', r.sysBg === 'rgba(0, 84, 160, 0.2)', String(r.sysBg)],
    ['系统格底色圆角 4（随宽缩放）', near(parseFloat(r.sysRadius), 4 * kw), `实测${r.sysRadius} 期望${(4 * kw).toFixed(2)}`],
    ['系统卡列间距 8', near(r.sys[1].x - r.sys[0].r, DESIGN.gridGap * kw), `实测${(r.sys[1].x - r.sys[0].r).toFixed(1)}`],
    ['系统卡行间距 8', near(r.sys[2].y - r.sys[0].b, DESIGN.gridGap * kh), `实测${(r.sys[2].y - r.sys[0].b).toFixed(1)}`],
    ['占比条高 4', near(r.bar.h, 4 * kh), `实测${r.bar.h} 期望${(4 * kh).toFixed(1)}`],
    ['卡体无纵向溢出', r.totalOverflow <= 1, `溢出${r.totalOverflow}`],
    ['系统网格无纵向溢出', r.sysOverflow <= 1, `溢出${r.sysOverflow}`],
  ]

  console.log(`\n===== ${vp.width}x${vp.height} =====`)
  console.log(`卡片 rect: x=${r.card.x}..${r.card.r} y=${r.card.y}..${r.card.b}`)
  console.log(`总体块 rect: x=${r.total.x}..${r.total.r}  环 ${r.ring.w}×${r.ring.h}  图标 ${r.icon.w}×${r.icon.h}`)
  console.log(`系统格 1: x=${r.sys[0].x}..${r.sys[0].r} y=${r.sys[0].y}..${r.sys[0].b}`)
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? '✓' : '✗'} ${name}：${detail}`)
    if (!ok) failed++
  }
  if (r.nameEllipsis.length) {
    const clipped = r.nameEllipsis.filter((v) => v > 1)
    console.log(`  系统名被截断：${clipped.length}/${r.nameEllipsis.length}${clipped.length ? '（视口窄于 1920 时按省略号截断）' : ''}`)
  }

  await page.screenshot({
    path: `${OUT}/完好率卡-${vp.width}.png`,
    clip: { x: Math.round(r.card.x), y: Math.round(r.card.y), width: Math.round(r.card.w), height: Math.round(r.card.h) },
    timeout: 90000,
    animations: 'disabled',
  })
  await page.close()
}

await browser.close()
console.log(failed ? `\n✗ ${failed} 项未通过` : '\n✓ 全部通过')
process.exit(failed ? 1 : 0)
