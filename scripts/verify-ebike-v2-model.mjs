/**
 * 验证 /landing/ebike-v2：三维模型是否就绪、层级是否正确、渲染是否成功
 * 用法: node scripts/verify-ebike-v2-model.mjs
 */
import { chromium } from '@playwright/test'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.env.SHOT_OUT ?? 'screenshots/ebike-compare'
const USER = { phone: '13200002345', password: 'admin123!@#' }

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
  { token: data.token, user: data.user },
)

// 在任何页面脚本之前挂监听，记录模型就绪信号
await page.addInitScript(() => {
  window.__campusReady = false
  window.addEventListener('message', (e) => {
    if (e?.data?.type === 'campus-model:ready') window.__campusReady = true
  })
})

await page.goto(`${BASE}/landing/ebike-v2?bigscreenId=20`, { waitUntil: 'domcontentloaded' })

let ready = false
for (let i = 0; i < 60 && !ready; i++) {
  await page.waitForTimeout(500)
  ready = await page.evaluate(() => window.__campusReady === true)
}
console.log('模型就绪:', ready)

// 再等场景渲染几帧
await page.waitForTimeout(4000)

const info = await page.evaluate(() => {
  const iframe = document.querySelector('.campus-layer__frame')
  const win = iframe?.contentWindow
  const app = win?.campusApp
  const canvas = win?.document?.querySelector('canvas')
  const poiPanel = win?.document?.getElementById('poi-panel')
  const z = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const cs = getComputedStyle(el)
    return { zIndex: cs.zIndex, position: cs.position, pointerEvents: cs.pointerEvents }
  }
  return {
    iframeExists: !!iframe,
    iframeSrc: iframe?.getAttribute('src'),
    hasApp: !!app,
    rendererInfo: app?.renderer?.info
      ? {
          calls: app.renderer.info.render.calls,
          triangles: app.renderer.info.render.triangles,
          objects: app.renderer.info.memory.objects,
          textures: app.renderer.info.memory.textures,
        }
      : null,
    canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
    cameraPos: app?.camera?.position
      ? [Math.round(app.camera.position.x), Math.round(app.camera.position.y), Math.round(app.camera.position.z)]
      : null,
    sceneBg: app?.scene?.background?.getHexString?.() ?? null,
    loadingMaskVisible: !!document.querySelector('.campus-layer__loading'),
    layers: {
      model: z('.campus-layer'),
      header: z('.bs-title-bar'),
      content: z('.ebike-v2__content'),
    },
    leftCards: document.querySelectorAll('.col--left .v2-card').length,
    rightCards: document.querySelectorAll('.col--right .v2-card').length,
    navItems: document.querySelectorAll('.v2-nav__item').length,
    sectionTitles: document.querySelectorAll('.section-title').length,
    // 模型区控件
    timeSwitch: !!document.querySelector('.v2-time__switch'),
    activeTime: document.querySelector('.v2-time__switch')?.getAttribute('aria-checked') === 'true' ? '黄昏' : '白天',
    poiToggle: !!document.querySelector('.v2-poi-toggle'),
    poiPanelExists: !!poiPanel,
    poiPanelOpen: poiPanel?.classList.contains('is-open') ?? null,
    poiPanelDisplay: poiPanel ? getComputedStyle(poiPanel).display : null,
    poiCount: win?.document?.querySelectorAll('.poi-item')?.length ?? 0,
  }
})
console.log(JSON.stringify(info, null, 2))

// 场景光线开关：默认黄昏，点一下切到白天，场景底色应跟随大屏白天配色
const switched = await page.evaluate(async () => {
  const sw = document.querySelector('.v2-time__switch')
  sw?.click()
  await new Promise((r) => setTimeout(r, 1200))
  const app = document.querySelector('.campus-layer__frame')?.contentWindow?.campusApp
  return {
    state: sw?.getAttribute('aria-checked') === 'true' ? '黄昏' : '白天',
    ariaChecked: sw?.getAttribute('aria-checked'),
    sceneBg: app?.scene?.background?.getHexString?.(),
    exposure: app?.renderer?.toneMappingExposure,
  }
})
console.log('切白天:', JSON.stringify(switched))

// 建筑导航：默认收起，点开后应可见
const panel = await page.evaluate(async () => {
  document.querySelector('.v2-poi-toggle')?.click()
  await new Promise((r) => setTimeout(r, 400))
  const el = document.querySelector('.campus-layer__frame')?.contentDocument?.getElementById('poi-panel')
  const r = el?.getBoundingClientRect()
  return {
    open: el?.classList.contains('is-open'),
    display: el ? getComputedStyle(el).display : null,
    rect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
  }
})
console.log('建筑导航:', JSON.stringify(panel))

// 全屏截图：headless Chromium 的整屏截图路径会让 iframe 内 WebGL 画布底部 90px
// 不参与合成（真实浏览器无此问题），改用等尺寸 clip 触发裁剪路径。
await page.screenshot({
  path: `${OUT}/_landing_ebike-v2_model.png`,
  clip: { x: 0, y: 0, width: 1920, height: 1080 },
})
console.log('截图:', `${OUT}/_landing_ebike-v2_model.png`)
console.log('控制台错误:', errors.length ? errors.slice(0, 8) : '无')

await browser.close()
