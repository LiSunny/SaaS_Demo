/**
 * 水泵房场景监控（二级专题页）
 *
 * 覆盖：
 * - 入口：总览页「消防用水监控」卡的第一行「水箱液位」是可点入口
 * - 路由：/landing/ebike-v2/pump-room 独立页，带 bigscreenId 上下文
 * - 布局：三维模型铺底（iframe 在底层）、顶部 5 张指标卡、右侧设备详情列
 * - 数据来源标注：温湿度 / 水浸带「演示」标签，平台实时项不带
 * - 示意标注：备泵、母管、排污井无独立测点，标为示意不伪造状态
 * - 三维交互：视图预设切换、剖视开关、点详情行聚焦设备
 * - 返回：回到总览页且保留 bigscreenId
 *
 * 登录用种子企业用户（非平台角色）：平台角色带 system-role，
 * 会被路由守卫挡在业务域路由外（见 src/router/index.ts 全局守卫）。
 */
import { test, expect } from '@playwright/test'

/** e2e 后端端口（见 e2e/setup.mjs）；本地复跑可覆盖为 E2E_API */
const API = process.env.E2E_API ?? 'http://localhost:3202'

/** 种子企业用户（非平台角色，可访问大屏路由） */
const USER = { phone: '13300001111', password: 'admin123!@#' }

/** 大屏设计稿视口 */
const VIEWPORT = { width: 1920, height: 1080 }

/** 通过 API 写登录态，跳过登录页 */
async function login(page: import('@playwright/test').Page) {
  const res = await page.request.post(`${API}/api/auth/login`, {
    data: USER,
  })
  if (!res.ok()) throw new Error(`登录失败：${res.status()} ${await res.text()}`)
  const body = await res.json()
  const { token, user } = body.data
  await page.goto('/')
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
    },
    { token, user },
  )
}

test.describe('水泵房场景监控', () => {
  test.use({ viewport: VIEWPORT })

  /**
   * 用例超时放宽到 120s
   *
   * 泵房页与总览页都带三维场景。无头 Chromium 走软件渲染（SwiftShader），
   * 三维循环把主线程占满，Playwright 的可操作性检查（等元素稳定）被饿死：
   * 实测模型就绪要 7.5s、一次点击要 6.2s；1920×1080 下像素更多、更慢。
   * 这不是页面缺陷，是无头环境的渲染开销 —— 超时按实测开销配，别按默认值卡。
   */
  test.describe.configure({ timeout: 120000 })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('总览页「水箱液位」行是入口，点击进入专题页并保留 bigscreenId', async ({ page }) => {
    await page.goto('/landing/ebike-v2?bigscreenId=20')
    await expect(page.locator('.wm__metric--entry')).toBeVisible()
    await expect(page.locator('.wm__metric--entry .wm__name-text')).toHaveText('水箱液位')
    // 入口提示徽标存在（叠在图标右下角，不挤动卡片几何）
    await expect(page.locator('.wm__metric--entry .wm__entry-hint')).toBeVisible()

    // 卡片几何不被入口徽标挤动：入口行与其它两行的图标 / 文字列 / 趋势图起点一致
    const geom = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.wm__metric')]
      return rows.map((el) => {
        const icon = el.querySelector('.wm__icon')?.getBoundingClientRect()
        const text = el.querySelector('.wm__text')?.getBoundingClientRect()
        const chart = el.querySelector('.wm__chart')?.getBoundingClientRect()
        return {
          iconW: Math.round(icon?.width ?? 0),
          textX: Math.round(text?.x ?? 0),
          chartX: Math.round(chart?.x ?? 0),
          chartW: Math.round(chart?.width ?? 0),
        }
      })
    })
    expect(geom.length).toBe(3)
    for (const g of geom) {
      expect(g).toEqual(geom[0])
    }

    await page.locator('.wm__metric--entry').click({ timeout: 60000 })
    await expect(page).toHaveURL(/\/landing\/ebike-v2\/pump-room/)
    await expect(page).toHaveURL(/bigscreenId=20/)
    await expect(page.locator('.pump-page')).toBeVisible()
  })

  test('模型铺底 + 顶部 5 张指标卡 + 右侧详情列', async ({ page }) => {
    await page.goto('/landing/ebike-v2/pump-room?bigscreenId=20')
    await expect(page.locator('.pump-page')).toBeVisible()

    // 三维模型 iframe 在底层
    const frame = page.locator('.pump-scene__frame')
    await expect(frame).toHaveCount(1)
    await expect(frame).toHaveAttribute('src', /pump-room-model\/index\.html\?embed=1/)

    // 模型层铺满（z-index 低于悬浮层）
    const layers = await page.evaluate(() => {
      const scene = document.querySelector('.pump-scene')
      const overlay = document.querySelector('.pump-page__overlay')
      const s = scene ? getComputedStyle(scene) : null
      const o = overlay ? getComputedStyle(overlay) : null
      return {
        scenePosition: s?.position,
        sceneZ: s?.zIndex,
        overlayZ: o?.zIndex,
      }
    })
    expect(layers.scenePosition).toBe('absolute')
    // 层级要能比大小：模型层显式 z-index 0，悬浮层 10。
    // 不显式写 z-index 时 computed 是 'auto'，Number('auto') 是 NaN，
    // 比较恒为 false —— 断言会变成一句永远失败的话。
    const sceneZ = Number.parseInt(layers.sceneZ ?? '', 10)
    const overlayZ = Number.parseInt(layers.overlayZ ?? '', 10)
    expect(Number.isNaN(sceneZ)).toBe(false)
    expect(Number.isNaN(overlayZ)).toBe(false)
    expect(overlayZ).toBeGreaterThan(sceneZ)

    // 顶部 5 张指标卡
    await expect(page.locator('.pump-page__top .pm')).toHaveCount(5)

    // 右侧详情列
    await expect(page.locator('.pump-page__side .pd')).toBeVisible()
    await expect(page.locator('.pd__group')).toHaveCount(5)
  })

  test('指标卡区分演示数据与平台实时，示意项不伪造状态', async ({ page }) => {
    await page.goto('/landing/ebike-v2/pump-room?bigscreenId=20')
    await expect(page.locator('.pm').first()).toBeVisible()

    // 演示数据标注：温湿度 + 水浸共 3 张卡带「演示」标签
    await expect(page.locator('.pm__origin')).toHaveCount(3)
    const origins = await page.evaluate(() =>
      [...document.querySelectorAll('.pm')].map((el) => ({
        name: el.querySelector('.pm__name')?.textContent?.trim(),
        origin: el.querySelector('.pm__origin')?.textContent?.trim() ?? 'platform',
      })),
    )
    const demoNames = origins.filter((o) => o.origin === '演示').map((o) => o.name)
    expect(demoNames).toContain('环境温度')
    expect(demoNames).toContain('环境湿度')
    expect(demoNames).toContain('水浸报警')

    // 平台实时项不带演示标签
    const platform = origins.filter((o) => o.origin === 'platform').map((o) => o.name)
    expect(platform).toContain('水罐液位')
    expect(platform).toContain('水泵 / 控制柜')

    // 示意项：备泵 / 母管 / 排污井无独立测点，标为示意
    const schematic = await page.evaluate(() =>
      [...document.querySelectorAll('.pd__row.is-schematic')].map((el) =>
        el.querySelector('.pd__name')?.textContent?.trim(),
      ),
    )
    expect(schematic).toContain('3# 消防备用泵')
    expect(schematic).toContain('吸水母管 DN200')
    expect(schematic).toContain('1# 排污井')

    // 备泵显示「备用」而不是伪造的运行状态
    const standby = page.locator('.pd__row', { hasText: '3# 消防备用泵' }).locator('.pd__value')
    await expect(standby).toHaveText('备用')
  })

  test('三维视图预设可切换、剖视可开关、点详情行聚焦设备', async ({ page }) => {
    await page.goto('/landing/ebike-v2/pump-room?bigscreenId=20')
    await expect(page.locator('.pump-scene__frame')).toHaveCount(1)

    // 等模型就绪。
    // 视图控件是 v-if="ready" —— 它出现就意味着铺底机位与剖视都已应用，
    // 比"句柄挂上了"更晚也更准：__pumpRoomApp 在模块加载时就有，
    // __pumpRoom 也要等 start() 跑完，两者都早于机位真正落到相机上。
    await expect(page.locator('.pump-scene__tools')).toBeVisible({ timeout: 20000 })
    await page.waitForFunction(
      () => {
        const f = document.querySelector('.pump-scene__frame') as HTMLIFrameElement | null
        const win = f?.contentWindow as any
        return !!(win?.__pumpRoomApp && win?.__pumpRoom)
      },
      undefined,
      { timeout: 20000 },
    )

    // 初始机位 = 铺底机位，剖视开启
    const initial = await page.evaluate(() => {
      const f = document.querySelector('.pump-scene__frame') as HTMLIFrameElement
      const win = f.contentWindow as any
      const app = win.__pumpRoomApp
      const pr = win.__pumpRoom
      return {
        pos: [app.camera.position.x, app.camera.position.y, app.camera.position.z],
        cutaway: pr.cutaway.on,
      }
    })
    expect(initial.pos[0]).toBeCloseTo(-14.17, 1)
    expect(initial.pos[1]).toBeCloseTo(17.37, 1)
    expect(initial.pos[2]).toBeCloseTo(11.07, 1)
    expect(initial.cutaway).toBe(true)

    // 视图预设：四个按钮都在
    const presets = page.locator('.pump-scene__tool-btn')
    await expect(presets).toHaveCount(4)

    // 切到「室内」，机位应变为模型内建预设值
    // 点击超时放宽：软件渲染下三维循环占满主线程，
    // Playwright 等元素稳定要好几秒（1280×720 实测 6.2s，1920×1080 更久）
    await page.locator('.pump-scene__tool-btn', { hasText: '室内' }).click({ timeout: 60000 })
    await page.waitForTimeout(400)
    const interior = await page.evaluate(() => {
      const f = document.querySelector('.pump-scene__frame') as HTMLIFrameElement
      const app = (f.contentWindow as any).__pumpRoomApp
      return [app.camera.position.x, app.camera.position.y, app.camera.position.z]
    })
    expect(interior[0]).toBeCloseTo(-10.2, 1)
    expect(interior[1]).toBeCloseTo(2.88, 1)
    expect(interior[2]).toBeCloseTo(-4.95, 1)

    // 剖视开关可切换
    const cutawayBox = page.locator('.pump-scene__check input')
    await cutawayBox.uncheck({ timeout: 60000 })
    await page.waitForTimeout(300)
    const cutawayOff = await page.evaluate(() => {
      const f = document.querySelector('.pump-scene__frame') as HTMLIFrameElement
      return (f.contentWindow as any).__pumpRoom.cutaway.on
    })
    expect(cutawayOff).toBe(false)

    // 点详情行 → 三维相机聚焦到该设备
    await page.locator('.pd__row', { hasText: '1# 消防水罐' }).click({ timeout: 60000 })
    await page.waitForTimeout(600)
    const focused = await page.evaluate(() => {
      const f = document.querySelector('.pump-scene__frame') as HTMLIFrameElement
      const app = (f.contentWindow as any).__pumpRoomApp
      const poi = app.pois.get('PR_TANK_01')
      return {
        pos: [app.camera.position.x, app.camera.position.y, app.camera.position.z],
        poiName: poi?.name,
      }
    })
    expect(focused.poiName).toBe('1# 消防水罐')
    // 相机离开了室内机位 → 说明确实聚焦了
    expect(Math.abs(focused.pos[1] - 2.88)).toBeGreaterThan(0.5)
  })

  test('返回总览并保留 bigscreenId', async ({ page }) => {
    await page.goto('/landing/ebike-v2/pump-room?bigscreenId=20')
    await expect(page.locator('.pump-page__back')).toBeVisible()
    await page.locator('.pump-page__back').click({ timeout: 60000 })
    // URL 断言要严：/landing/ebike-v2 是 /landing/ebike-v2/pump-room 的前缀，
    // 松正则连泵房页自己都匹配，等于什么都没断言。
    await expect(page).toHaveURL(/\/landing\/ebike-v2(\?|#|$)/)
    await expect(page).toHaveURL(/bigscreenId=20/)
    // 回总览要等三维校园模型挂载（软件渲染下不便宜）
    await expect(page.locator('.ebike-v2')).toBeVisible({ timeout: 30000 })
  })
})
