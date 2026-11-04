/**
 * 水泵房场景监控（二级专题页）
 *
 * 覆盖：
 * - 入口：总览页「消防用水监控」卡的第一行「水箱液位」是可点入口
 * - 路由：/landing/ebike-v2/pump-room 独立页，带 bigscreenId 上下文
 * - 布局：三维模型铺底（iframe 在底层）、右侧竖排 5 张实时指标卡
 * - 场景顶栏：独立实现，只保留标题牌；无全局菜单、无右上角用户信息
 * - 标题牌：水平英文装饰 + 「消防水泵房」，返回按钮在中文名下方
 * - 卡面无「演示」字样
 * - 三维交互：视图预设切换、剖视开关
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
    // 入口提示徽标已按批注去掉（只去箭头、保留整块下钻点击），这里不再断言它存在

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
    // 二级专题页要拉起三维模型（WebGL + 地形/水体相交告警），无头环境下首帧很慢，
    // 路由跳转要等动态 import 的组件解析完才落 URL —— 默认 10s 的 expect 超时不够，
    // 表现为「点击后没跳转」的假失败。这里放宽的是等待窗口，不是断言本身。
    await expect(page).toHaveURL(/\/landing\/ebike-v2\/pump-room/, { timeout: 60000 })
    await expect(page).toHaveURL(/bigscreenId=20/, { timeout: 60000 })
    await expect(page.locator('.pump-page')).toBeVisible({ timeout: 60000 })
  })

  test('模型铺底 + 右侧竖排 5 张指标卡', async ({ page }) => {
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

    // 右侧竖排 5 张指标卡
    await expect(page.locator('.pump-page__side .pm')).toHaveCount(5)

    // 竖排：卡片自上而下依次排列，同在右侧栏内
    const cards = await page.evaluate(() =>
      [...document.querySelectorAll('.pump-page__side .pm')].map((el) => {
        const r = el.getBoundingClientRect()
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
      }),
    )
    const side = await page.locator('.pump-page__side').boundingBox()
    for (const c of cards) {
      expect(c.x).toBe(cards[0].x)
      expect(c.w).toBe(cards[0].w)
      // 卡片在右侧栏内，不越界
      expect(c.x + c.w).toBeLessThanOrEqual(Math.round(side!.x + side!.width) + 1)
    }
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].y).toBeGreaterThan(cards[i - 1].y)
    }

    // 原「泵房设备」详情列已按批注移除
    await expect(page.locator('.pump-page__side .pd')).toHaveCount(0)
    await expect(page.locator('.pump-page__top')).toHaveCount(0)
  })

  test('场景顶栏：独立标题牌，无全局菜单与用户信息', async ({ page }) => {
    await page.goto('/landing/ebike-v2/pump-room?bigscreenId=20')
    await expect(page.locator('.pr-header')).toBeVisible()

    // 场景页有自己的顶栏组件，不复用带全局菜单的 EbikeV2Header
    await expect(page.locator('.v2-nav__item')).toHaveCount(0)
    await expect(page.locator('.bs-title-bar__user')).toHaveCount(0)
    // 也没有通用顶栏那套壳
    await expect(page.locator('.bs-title-bar')).toHaveCount(0)
  })

  test('标题牌：水平英文装饰 + 中文名 + 返回按钮在中文名下方', async ({ page }) => {
    await page.goto('/landing/ebike-v2/pump-room?bigscreenId=20')
    await expect(page.locator('.pump-title')).toBeVisible()
    await expect(page.locator('.pump-title__cn')).toHaveText('消防水泵房')
    await expect(page.locator('.pump-title__en')).toHaveText('FIRE PUMP ROOM')

    // 等字体就绪：牌子尺寸随字体 metrics 变，字体没到位时量到的值会偏。
    await page.evaluate(() => document.fonts.ready)

    // 同一帧内量：分两次 boundingBox() 会跨帧，字体中途就位就会量出两个尺寸
    const geom = await page.evaluate(() => {
      const r = (sel: string) => {
        const el = document.querySelector(sel)!
        const b = el.getBoundingClientRect()
        return { x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom }
      }
      return {
        plate: r('.pump-title'),
        en: r('.pump-title__en'),
        cn: r('.pump-title__cn'),
        back: r('.pump-title__back'),
        band: r('.pr-header'),
      }
    })

    // 英文水平：宽 > 高
    expect(geom.en.w).toBeGreaterThan(geom.en.h)
    // 英文是中文名上方的引导行
    expect(geom.en.bottom).toBeLessThanOrEqual(geom.cn.y + 1)

    // 返回按钮在中文名下方一行
    expect(geom.back.y).toBeGreaterThanOrEqual(geom.cn.bottom)
    expect(geom.back.x).toBeLessThanOrEqual(geom.cn.x + 1)
    expect(geom.back.bottom).toBeLessThanOrEqual(geom.plate.bottom + 1)

    // 整块牌子收在顶栏带内，不能压到顶栏底部那道装饰线
    expect(geom.plate.bottom).toBeLessThanOrEqual(geom.band.bottom)
  })

  test('卡面无「演示」字样，液位主值自带 %', async ({ page }) => {
    await page.goto('/landing/ebike-v2/pump-room?bigscreenId=20')
    await expect(page.locator('.pm').first()).toBeVisible()

    // 演示标签已按批注移除：卡面上不出现来源角标
    await expect(page.locator('.pm__origin')).toHaveCount(0)
    // 整页可见文本里也不该有「演示」二字
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).not.toContain('演示')

    // 五张卡都在
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('.pm')].map((el) =>
        el.querySelector('.pm__name')?.textContent?.trim(),
      ),
    )
    expect(names).toEqual(['环境温度', '环境湿度', '水浸报警', '水罐液位', '水泵 / 控制柜'])

    // 液位主值自带 %（平台聚合已格式化），卡上不再重复挂一个单位
    const level = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.pm')].find(
        (c) => c.querySelector('.pm__name')?.textContent?.trim() === '水罐液位',
      )
      return {
        value: el?.querySelector('.pm__value')?.textContent?.trim() ?? '',
        unit: el?.querySelector('.pm__unit')?.textContent?.trim() ?? '',
      }
    })
    expect(level.value).toMatch(/^\d+%$/)
    expect(level.unit).toBe('')
  })

  test('三维视图预设可切换、剖视可开关', async ({ page }) => {
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

    // 设备清单已按批注移除，页面侧不再有「点行聚焦设备」的入口；
    // 三维模型自身仍可在画面里点设备高亮（模型内交互，不归页面用例管）。
  })

  test('返回总览并保留 bigscreenId', async ({ page }) => {
    await page.goto('/landing/ebike-v2/pump-room?bigscreenId=20')
    // 返回按钮在标题牌内、中文名下方
    await expect(page.locator('.pump-title__back')).toBeVisible()
    await page.locator('.pump-title__back').click({ timeout: 60000 })
    // URL 断言要严：/landing/ebike-v2 是 /landing/ebike-v2/pump-room 的前缀，
    // 松正则连泵房页自己都匹配，等于什么都没断言。
    // 超时放宽到 30s：点击之后路由确认要等主线程空出来 —— 三维循环在软件渲染下
    // 把主线程占满，路由的 push 是异步的，默认 10s 偶尔不够（实测偶发）。
    await expect(page).toHaveURL(/\/landing\/ebike-v2(\?|#|$)/, { timeout: 30000 })
    await expect(page).toHaveURL(/bigscreenId=20/, { timeout: 30000 })
    // 回总览要等三维校园模型挂载（软件渲染下不便宜）
    await expect(page.locator('.ebike-v2')).toBeVisible({ timeout: 30000 })
  })
})
