/**
 * 校验 ebike-v2 总览页「模型区悬浮控件」与「建筑导航弹窗」的几何关系：
 *   1. 场景控件组分置模型区两端：场景光线切换 + 清屏入口贴模型区左缘，
 *      建筑导航贴模型区右缘；两组顶边与左右模块列顶边齐平；
 *   2. 建筑导航弹窗（iframe 内 POI 面板）从按钮正下方展开、右缘与按钮右缘齐平；
 *   3. 两者都不与左右模块列 / 顶栏重叠，且完整可见不被裁切。
 * 位置口径取自 Figma 70:313（1920×1080）：
 *   左列 16→538、右列 1382→1904、模型区 538→1382
 *   场景控件左缘 561（左列右缘 + 23）、建筑导航右缘 1362（右列左缘 − 20）
 * 列宽口径：左右等宽 522，模型区 844 = 522 × φ（φ=1.618），1 : φ : 1 对称布局
 * 用法: node scripts/verify-ebike-v2-scene-tools.mjs
 */
import { chromium } from '@playwright/test'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.env.SHOT_OUT ?? 'screenshots/ebike-v2-overview'
const USER = { phone: '13300001111', password: 'admin123!@#' }

/** 1920 画布下的设计坐标（其他视口按比例缩放，只校验相对关系） */
const DESIGN = {
  leftColRight: 538,
  rightColLeft: 1382,
  toolsLeft: 561,
  poiRight: 1362,
  /** 模型区宽 = 单列宽 522 × φ */
  modelWidth: 844,
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
  // 等三维模型就绪：未就绪时页面有全屏加载遮罩，会盖住 iframe 内的面板
  await page
    .waitForFunction(() => !document.querySelector('.campus-layer__loading'), null, { timeout: 60000 })
    .catch(() => console.log('  ! 模型加载遮罩未在 60s 内撤下'))
  await page.waitForTimeout(1500)

  // 关闭态整体截图（悬浮控件组在模型区，弹窗未展开）
  if (vp.width === 1920) {
    await page.screenshot({ path: `${OUT}/场景开关-整体-1920.png`, clip: { x: 0, y: 0, width: vp.width, height: vp.height }, timeout: 90000 })
    await page.screenshot({ path: `${OUT}/场景开关-局部.png`, clip: { x: 545, y: 72, width: 130, height: 104 }, timeout: 90000 })
    await page.screenshot({ path: `${OUT}/建筑导航按钮-局部.png`, clip: { x: 1340, y: 150, width: 200, height: 70 }, timeout: 90000 })
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
      colLeft: rect(document.querySelector('.col--left')),
      colRight: rect(document.querySelector('.col--right')),
      tools: rect(document.querySelector('.ebike-v2__scene-tools')),
      toolsRight: rect(document.querySelector('.ebike-v2__scene-tools-right')),
      header: rect(document.querySelector('.bs-title-bar')),
      btn: rect(document.querySelector('.v2-poi-toggle')),
      switch: rect(document.querySelector('.v2-time__switch')),
      fullscreen: rect(document.querySelector('.ebike-v2__scene-tools .v2-clean-toggle')),
    }
    // 胶囊开关：圆钮必须与胶囊垂直居中（上下边距相等），且不贴边
    const track = document.querySelector('.v2-time__switch')?.getBoundingClientRect()
    const thumb = document.querySelector('.v2-time__thumb')?.getBoundingClientRect()
    const label = document.querySelector('.v2-time__label')?.getBoundingClientRect()
    const sw = track && thumb && label
      ? {
          trackW: Math.round(track.width * 10) / 10,
          trackH: Math.round(track.height * 10) / 10,
          thumbW: Math.round(thumb.width * 10) / 10,
          thumbH: Math.round(thumb.height * 10) / 10,
          marginTop: Math.round((thumb.top - track.top) * 10) / 10,
          marginBottom: Math.round((track.bottom - thumb.bottom) * 10) / 10,
          marginLeft: Math.round((thumb.left - track.left) * 10) / 10,
          marginRight: Math.round((track.right - thumb.right) * 10) / 10,
          labelLeft: Math.round((label.left - track.left) * 10) / 10,
          labelText: document.querySelector('.v2-time__label')?.textContent?.trim() ?? '',
        }
      : null
    const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b
    const body = panel.querySelector('.panel-body')
    return {
      panel: P,
      boxes,
      sw,
      overlaps: {
        colLeft: overlap(P, boxes.colLeft),
        colRight: overlap(P, boxes.colRight),
        tools: overlap(P, boxes.tools),
        toolsRight: overlap(P, boxes.toolsRight),
        header: overlap(P, boxes.header),
      },
      fullyInViewport: P.x >= 0 && P.y >= 0 && P.r <= innerWidth && P.b <= innerHeight,
      loadingMask: !!document.querySelector('.campus-layer__loading'),
      listScrollable: body ? body.scrollHeight > body.clientHeight : false,
    }
  })

  const d = (a, b) => a - b
  /**
   * 设计坐标按 vw / vh 锚定：横向间距随视口宽缩放，纵向间距随视口高缩放。
   * 断言用缩放后的期望值 + 1px 容差（取整误差）。
   */
  const kw = vp.width / 1920
  const kh = vp.height / 1080
  const near = (a, b, tol = 1) => Math.abs(a - b) <= tol
  const checks = [
    ['左列右缘 == 538（16 + 522）', near(r.boxes.colLeft.r, DESIGN.leftColRight * kw), `实测${r.boxes.colLeft.r} 期望${(DESIGN.leftColRight * kw).toFixed(1)}`],
    ['右列左缘 == 1382', near(r.boxes.colRight.x, DESIGN.rightColLeft * kw), `实测${r.boxes.colRight.x} 期望${(DESIGN.rightColLeft * kw).toFixed(1)}`],
    ['模型区宽 == 844 = 522 × φ', near(r.boxes.colRight.x - r.boxes.colLeft.r, DESIGN.modelWidth * kw), `实测${(r.boxes.colRight.x - r.boxes.colLeft.r).toFixed(1)} 期望${(DESIGN.modelWidth * kw).toFixed(1)}`],
    ['左组顶边 == 模块列顶边', d(r.boxes.tools.y, r.boxes.colRight.y) === 0, `${d(r.boxes.tools.y, r.boxes.colRight.y)}px`],
    ['右组顶边 == 模块列顶边', d(r.boxes.toolsRight.y, r.boxes.colRight.y) === 0, `${d(r.boxes.toolsRight.y, r.boxes.colRight.y)}px`],
    ['左组左缘 == 左列右缘 + 23', near(r.boxes.tools.x - r.boxes.colLeft.r, 23 * kw), `实测${r.boxes.tools.x - r.boxes.colLeft.r} 期望${(23 * kw).toFixed(1)}`],
    ['建筑导航右缘 == 右列左缘 − 20', near(r.boxes.colRight.x - r.boxes.btn.r, 20 * kw), `实测${r.boxes.colRight.x - r.boxes.btn.r} 期望${(20 * kw).toFixed(1)}`],
    ['弹窗右缘 == 建筑导航按钮右缘', d(r.panel.r, r.boxes.btn.r) === 0, `${d(r.panel.r, r.boxes.btn.r)}px`],
    ['弹窗顶边在按钮底缘下方 8px', near(r.panel.y - r.boxes.btn.b, 8 * kh), `实测${r.panel.y - r.boxes.btn.b} 期望${(8 * kh).toFixed(1)}`],
    ['弹窗底边 == 模块列底边', d(r.panel.b, r.boxes.colRight.b) === 0, `${d(r.panel.b, r.boxes.colRight.b)}px`],
    ['弹窗右缘不压右列模块', r.panel.r < r.boxes.colRight.x, `弹窗${r.panel.r} 右列${r.boxes.colRight.x}`],
    ['无重叠（左右列/两组控件/顶栏）', !Object.values(r.overlaps).some(Boolean), JSON.stringify(r.overlaps)],
    ['弹窗完整在视口内', r.fullyInViewport, String(r.fullyInViewport)],
    ['模型加载遮罩已撤下', !r.loadingMask, String(r.loadingMask)],
    ['建筑清单可滚动', r.listScrollable, String(r.listScrollable)],
    // ===== 模型区两枚控件：形制取自设计稿 70:313（1920 实测），尺寸固定 px 不随视口缩 =====
    ['胶囊开关 99×34（设计稿尺寸）', r.sw?.trackW === 99 && r.sw?.trackH === 34, `实测${r.sw?.trackW}×${r.sw?.trackH}`],
    ['圆钮 28×28', r.sw?.thumbW === 28 && r.sw?.thumbH === 28, `实测${r.sw?.thumbW}×${r.sw?.thumbH}`],
    ['圆钮垂直居中（上下边距差 ≤0.5px）', !!r.sw && Math.abs(r.sw.marginTop - r.sw.marginBottom) <= 0.5, r.sw ? `上${r.sw.marginTop}/下${r.sw.marginBottom}` : '未取到'],
    ['圆钮不贴边（上下留白 ≥3px）', !!r.sw && r.sw.marginTop >= 3 && r.sw.marginBottom >= 3, r.sw ? `上${r.sw.marginTop}/下${r.sw.marginBottom}` : '未取到'],
    ['圆钮贴右缘（黄昏态，右留白 3px）', !!r.sw && Math.abs(r.sw.marginRight - 3) <= 1, r.sw ? `右留白${r.sw.marginRight}` : '未取到'],
    ['场景名左距 == 21px', !!r.sw && Math.abs(r.sw.labelLeft - 21) <= 1, r.sw ? `实测${r.sw.labelLeft}` : '未取到'],
    ['场景名文案 == 黄昏', r.sw?.labelText === '黄昏', `实测「${r.sw?.labelText}」`],
    ['全屏查看按钮 99×34', r.boxes.fullscreen?.w === 99 && r.boxes.fullscreen?.h === 34, `实测${r.boxes.fullscreen?.w}×${r.boxes.fullscreen?.h}`],
    ['两枚控件左缘齐平', Math.abs(r.boxes.fullscreen.x - r.boxes.switch.x) <= 1, `差${Math.abs(r.boxes.fullscreen.x - r.boxes.switch.x)}px`],
    ['两枚控件纵向间距 == 8px', r.boxes.fullscreen.y - r.boxes.switch.b === 8, `实测${r.boxes.fullscreen.y - r.boxes.switch.b}px`],
  ]

  console.log(`\n===== ${vp.width}x${vp.height} =====`)
  console.log(`左组 rect: x=${r.boxes.tools.x}..${r.boxes.tools.r} y=${r.boxes.tools.y}..${r.boxes.tools.b}`)
  console.log(`右组 rect: x=${r.boxes.toolsRight.x}..${r.boxes.toolsRight.r} y=${r.boxes.toolsRight.y}..${r.boxes.toolsRight.b}`)
  console.log(`按钮   rect: x=${r.boxes.btn.x}..${r.boxes.btn.r} y=${r.boxes.btn.y}..${r.boxes.btn.b}`)
  console.log(`弹窗   rect: x=${r.panel.x}..${r.panel.r} y=${r.panel.y}..${r.panel.b} (${r.panel.w}x${r.panel.h})`)
  console.log(`左列   rect: x=${r.boxes.colLeft.x}..${r.boxes.colLeft.r}  右列 rect: x=${r.boxes.colRight.x}..${r.boxes.colRight.r}`)
  console.log(`胶囊   ${r.sw?.trackW}×${r.sw?.trackH} 圆钮${r.sw?.thumbW}×${r.sw?.thumbH} 上边距${r.sw?.marginTop} 下边距${r.sw?.marginBottom} 右留白${r.sw?.marginRight} 场景名「${r.sw?.labelText}」`)
  console.log(`全屏   ${r.boxes.fullscreen?.w}×${r.boxes.fullscreen?.h} x=${r.boxes.fullscreen?.x}..${r.boxes.fullscreen?.r} y=${r.boxes.fullscreen?.y}..${r.boxes.fullscreen?.b}`)
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? '✓' : '✗'} ${name}：${detail}`)
    if (!ok) failed++
  }

  if (vp.width === 1920) {
    await page.screenshot({ path: `${OUT}/建筑导航弹窗-1920.png`, clip: { x: 0, y: 0, width: vp.width, height: vp.height }, timeout: 90000 })
    await page.screenshot({ path: `${OUT}/场景开关-局部.png`, clip: { x: 545, y: 72, width: 130, height: 104 }, timeout: 90000 })
  }
  if (vp.width === 1443) {
    await page.screenshot({ path: `${OUT}/建筑导航弹窗-1443.png`, clip: { x: 0, y: 0, width: vp.width, height: vp.height }, timeout: 90000 })
  }
  await page.close()
}

await browser.close()
console.log(failed ? `\n✗ ${failed} 项未通过` : '\n✓ 全部通过')
process.exit(failed ? 1 : 0)
