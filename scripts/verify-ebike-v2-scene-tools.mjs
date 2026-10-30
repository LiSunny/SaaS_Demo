/**
 * 校验 ebike-v2 总览页「模型区悬浮控件」与「建筑导航弹窗」的几何关系：
 *   1. 昼夜切换 + 建筑导航 控件组顶边与右列首卡「消防设备完好率」对齐；
 *   2. 建筑导航弹窗（iframe 内 POI 面板）吸附在按钮下方，左缘与按钮左缘齐平；
 *   3. 两者都不与态势条 / 左右模块列 / 顶栏重叠，且完整可见不被裁切。
 * 用法: node scripts/verify-ebike-v2-scene-tools.mjs
 */
import { chromium } from '@playwright/test'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.env.SHOT_OUT ?? 'screenshots/ebike-v2-overview'
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
  // 等三维模型就绪：未就绪时页面有全屏加载遮罩，会盖住 iframe 内的面板
  await page
    .waitForFunction(() => !document.querySelector('.campus-layer__loading'), null, { timeout: 60000 })
    .catch(() => console.log('  ! 模型加载遮罩未在 60s 内撤下'))
  await page.waitForTimeout(1500)

  // 关闭态整体截图（悬浮控件组在模型区，弹窗未展开）
  if (vp.width === 1920) {
    await page.screenshot({ path: `${OUT}/场景开关-整体-1920.png`, clip: { x: 0, y: 0, width: vp.width, height: vp.height }, timeout: 90000 })
    await page.screenshot({ path: `${OUT}/场景开关-局部.png`, clip: { x: 1150, y: 150, width: 300, height: 110 }, timeout: 90000 })
  }

  // 打开建筑导航面板
  await page.evaluate(() => document.querySelector('.v2-poi-toggle')?.click())
  await page.waitForTimeout(800)

  const r = await page.evaluate(() => {
    const frame = document.querySelector('.campus-layer__frame')
    const doc = frame.contentDocument
    const panel = doc.getElementById('poi-panel')
    const pr = panel.getBoundingClientRect()
    const P = { x: Math.round(pr.x), y: Math.round(pr.y), w: Math.round(pr.width), h: Math.round(pr.height), r: Math.round(pr.right), b: Math.round(pr.bottom) }
    const rect = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), r: Math.round(b.right), b: Math.round(b.bottom) }
    }
    const boxes = {
      statusbar: rect(document.querySelector('.ebike-v2__statusbar')),
      colLeft: rect(document.querySelector('.col--left')),
      colRight: rect(document.querySelector('.col--right')),
      tools: rect(document.querySelector('.ebike-v2__scene-tools')),
      header: rect(document.querySelector('.bs-title-bar')),
      btn: rect(document.querySelector('.v2-poi-toggle')),
    }
    // 开关：圆钮必须与胶囊垂直居中（上下边距相等），且不贴边
    const track = document.querySelector('.v2-time__track')?.getBoundingClientRect()
    const thumb = document.querySelector('.v2-time__thumb')?.getBoundingClientRect()
    const sw = track && thumb
      ? {
          trackH: Math.round(track.height * 10) / 10,
          thumbH: Math.round(thumb.height * 10) / 10,
          marginTop: Math.round((thumb.top - track.top) * 10) / 10,
          marginBottom: Math.round((track.bottom - thumb.bottom) * 10) / 10,
          marginLeft: Math.round((thumb.left - track.left) * 10) / 10,
          marginRight: Math.round((track.right - thumb.right) * 10) / 10,
        }
      : null
    const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b
    const body = panel.querySelector('.panel-body')
    return {
      panel: P,
      boxes,
      sw,
      overlaps: {
        statusbar: overlap(P, boxes.statusbar),
        colLeft: overlap(P, boxes.colLeft),
        colRight: overlap(P, boxes.colRight),
        tools: overlap(P, boxes.tools),
        header: overlap(P, boxes.header),
      },
      fullyInViewport: P.x >= 0 && P.y >= 0 && P.r <= innerWidth && P.b <= innerHeight,
      loadingMask: !!document.querySelector('.campus-layer__loading'),
      listScrollable: body ? body.scrollHeight > body.clientHeight : false,
    }
  })

  const d = (a, b) => a - b
  const checks = [
    ['控件组顶边 == 完好率模块顶边', d(r.boxes.tools.y, r.boxes.colRight.y) === 0, `${d(r.boxes.tools.y, r.boxes.colRight.y)}px`],
    ['弹窗左缘 == 建筑导航按钮左缘', d(r.panel.x, r.boxes.btn.x) === 0, `${d(r.panel.x, r.boxes.btn.x)}px`],
    ['弹窗顶边在按钮底缘下方', r.panel.y > r.boxes.btn.b, `${r.panel.y - r.boxes.btn.b}px`],
    ['弹窗右缘 == 控制组右缘', d(r.panel.r, r.boxes.tools.r) === 0, `${d(r.panel.r, r.boxes.tools.r)}px`],
    ['弹窗底边 == 模块列底边', d(r.panel.b, r.boxes.colRight.b) === 0, `${d(r.panel.b, r.boxes.colRight.b)}px`],
    ['无重叠（态势条/左右列/控件组/顶栏）', !Object.values(r.overlaps).some(Boolean), JSON.stringify(r.overlaps)],
    ['弹窗完整在视口内', r.fullyInViewport, String(r.fullyInViewport)],
    ['模型加载遮罩已撤下', !r.loadingMask, String(r.loadingMask)],
    ['建筑清单可滚动', r.listScrollable, String(r.listScrollable)],
    ['圆钮垂直居中（上下边距差 ≤0.5px）', !!r.sw && Math.abs(r.sw.marginTop - r.sw.marginBottom) <= 0.5, r.sw ? `上${r.sw.marginTop}/下${r.sw.marginBottom}` : '未取到'],
    ['圆钮不贴边（上下留白 ≥3px）', !!r.sw && r.sw.marginTop >= 3 && r.sw.marginBottom >= 3, r.sw ? `上${r.sw.marginTop}/下${r.sw.marginBottom}` : '未取到'],
  ]

  console.log(`\n===== ${vp.width}x${vp.height} =====`)
  console.log(`控件组 rect: x=${r.boxes.tools.x}..${r.boxes.tools.r} y=${r.boxes.tools.y}..${r.boxes.tools.b}`)
  console.log(`按钮   rect: x=${r.boxes.btn.x}..${r.boxes.btn.r} y=${r.boxes.btn.y}..${r.boxes.btn.b}`)
  console.log(`弹窗   rect: x=${r.panel.x}..${r.panel.r} y=${r.panel.y}..${r.panel.b} (${r.panel.w}x${r.panel.h})`)
  console.log(`开关   轨道高${r.sw?.trackH} 圆钮高${r.sw?.thumbH} 上边距${r.sw?.marginTop} 下边距${r.sw?.marginBottom}`)
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? '✓' : '✗'} ${name}：${detail}`)
    if (!ok) failed++
  }

  if (vp.width === 1920) {
    await page.screenshot({ path: `${OUT}/建筑导航弹窗-1920.png`, clip: { x: 0, y: 0, width: vp.width, height: vp.height }, timeout: 90000 })
    await page.screenshot({ path: `${OUT}/场景开关-局部.png`, clip: { x: 1150, y: 150, width: 300, height: 110 }, timeout: 90000 })
  }
  if (vp.width === 1443) {
    await page.screenshot({ path: `${OUT}/建筑导航弹窗-1443.png`, clip: { x: 0, y: 0, width: vp.width, height: vp.height }, timeout: 90000 })
  }
  await page.close()
}

await browser.close()
console.log(failed ? `\n✗ ${failed} 项未通过` : '\n✓ 全部通过')
process.exit(failed ? 1 : 0)
