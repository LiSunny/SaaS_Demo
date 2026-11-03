/**
 * 大屏「系统监测」页（ebike-v2）
 *
 * 覆盖（版式按 Figma 设计稿 110:10889「智能安全管控平台/系统监测」）：
 * - 版式：顶部「设备检测指标概览」横条 + 左侧组态画布 + 右列（实时警情 / 多发故障排名）
 * - 指标：四项计数取自平台真值（画面图元数 + 绑定点位声明的状态类），不是写死的演示值
 * - 系统切换：顶部「当前系统」下拉可列出画面里的系统，切换后画布与指标跟着换
 * - 缩放：画布右上角 − / ＋ / 适应，缩放以画布中心为基准（放大后仍居中）
 * - 右列两卡：实时警情（角标 + 故障类型 + 时间 / 位置）、多发故障排名（名次 + 类型 + 百分比 + 占比条）
 *
 * 用例前先经 API 建一幅画面（画面是平台数据，指标 / 警情 / 排名都从它派生），
 * 断言里的数字由用例自己算出来，不写死。
 *
 * 登录用种子企业用户（非平台角色）：平台角色带 system-role，
 * 会被路由守卫挡在业务域路由外（见 src/router/index.ts 全局守卫）。
 */
import { test, expect } from '@playwright/test'

/** e2e 后端端口（见 e2e/setup.mjs）；本地复跑可覆盖为 E2E_API */
const API = process.env.E2E_API ?? `http://localhost:${process.env.E2E_API_PORT ?? '3202'}`

/** 种子企业用户（非平台角色，可访问大屏路由） */
const USER = { phone: '13300001111', password: 'admin123!@#' }

/** 大屏设计稿视口 */
const VIEWPORT = { width: 1920, height: 1080 }

/** 用例画面：两个图元，取自内置图元库
 *  - PMP-SET-01 消防泵组：故障点（is-fault）、运行点（offClass is-off）
 *  - TNK-FIRE-01 消防水池：溢流点（is-over）
 *  期望的指标：设备总数 2 / 故障 1 / 屏蔽 1 / 预警 1 */
const NODES = [
  { id: 'n1', symbol: 'PMP-SET-01', x: 320, y: 300, size: 72, label: '消防泵组' },
  { id: 'n2', symbol: 'TNK-FIRE-01', x: 720, y: 300, size: 96, label: '消防水池' },
]

/** 第二个系统的画面：单个图元（PAI-CYL-01 钢瓶压力表，欠压点 is-fault）
 *  期望的指标：设备总数 1 / 故障 1 / 屏蔽 0 / 预警 0 */
const GAS_NODES = [{ id: 'g1', symbol: 'PAI-CYL-01', x: 320, y: 300, size: 72, label: '钢瓶压力表' }]

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
  return token
}

/** 建一幅画面（平台级共享），并写入图元 */
async function seedScene(
  page: import('@playwright/test').Page,
  token: string,
  form: { name: string; systemKey: string },
  nodes: unknown[],
) {
  const headers = { Authorization: `Bearer ${token}` }
  const created = await page.request.post(`${API}/api/scenes`, {
    headers,
    data: {
      name: form.name,
      systemKey: form.systemKey,
      scope: '',
      width: 1200,
      height: 700,
      style: 'image',
    },
  })
  if (!created.ok()) throw new Error(`建画面失败：${created.status()} ${await created.text()}`)
  const scene = (await created.json()).data

  const layout = await page.request.put(`${API}/api/scenes/${encodeURIComponent(scene.id)}/layout`, {
    headers,
    data: { nodes, edges: [] },
  })
  if (!layout.ok()) throw new Error(`写画面布局失败：${layout.status()} ${await layout.text()}`)
  return scene
}

/** 建两幅画面：两个系统各一幅（系统下拉才有得选） */
async function seedScenes(page: import('@playwright/test').Page, token: string) {
  await seedScene(page, token, { name: 'e2e 消防给水总貌', systemKey: 'pipeline' }, NODES)
  await seedScene(page, token, { name: 'e2e 气体灭火总貌', systemKey: 'gas' }, GAS_NODES)
}

/** 打开大屏并切到系统监测页 */
async function gotoMonitor(page: import('@playwright/test').Page) {
  await page.goto('/landing/ebike-v2?bigscreenId=20')
  // 顶栏导航浮在三维模型 iframe 之上，Playwright 的合成 click 会卡在可操作性检查
  // （同 .claude/CLAUDE.md「本页 Playwright 合成点击全部判不过」）。
  // 改用真实鼠标事件点元素中心 —— 与用户实际点击一致，也不受机器负载影响。
  const nav = page.locator('.v2-nav__item', { hasText: '系统监测' })
  const box = await nav.boundingBox()
  if (!box) throw new Error('顶栏导航「系统监测」不可见')
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.locator('.monitor')).toBeVisible({ timeout: 30000 })
}

/** 从顶部「当前系统」下拉里切到指定系统 */
async function selectSystem(page: import('@playwright/test').Page, name: string) {
  await page.locator('.mm__system-toggle').click()
  const menu = page.locator('.mm__menu')
  await expect(menu).toBeVisible()
  await menu.locator('.mm__menu-item', { hasText: name }).click()
  await expect(menu).toBeHidden()
  await expect(page.locator('.mm__system-name')).toHaveText(name)
}

test.describe('大屏系统监测页', () => {
  test.use({ viewport: VIEWPORT })

  /**
   * 用例超时放宽到 120s
   *
   * 进页前停在总览页，总览页带三维场景。无头 Chromium 走软件渲染
   * （SwiftShader），三维循环占满主线程，Playwright 的可操作性检查被饿死：
   * 实测一次点击要 6.2s、模型就绪要 7.5s。这不是页面缺陷，是无头环境的
   * 渲染开销 —— 超时按实测开销配，别按默认值卡。
   */
  test.describe.configure({ timeout: 120000 })

  test.beforeEach(async ({ page }) => {
    const token = await login(page)
    await seedScenes(page, token)
  })

  test('顶部指标条 + 组态画布 + 右列两卡的版式', async ({ page }) => {
    await gotoMonitor(page)

    // ===== 顶部指标条：当前系统 + 分隔线 + 四项指标 =====
    await expect(page.locator('.mm')).toBeVisible()
    await expect(page.locator('.mm__system-label')).toHaveText('当前系统')
    await expect(page.locator('.mm__system-name')).not.toBeEmpty()
    await expect(page.locator('.mm__divider')).toHaveCount(1)

    // 四项指标名按设计稿顺序
    await expect(page.locator('.mm__label')).toHaveText(['设备总数', '故障', '屏蔽', '预警'])
    // 每项都有图标框与数值
    await expect(page.locator('.mm__icon')).toHaveCount(4)
    await expect(page.locator('.mm__value')).toHaveCount(4)

    // ===== 左侧组态画布 + 右上角缩放控件 =====
    await expect(page.locator('.monitor__canvas')).toBeVisible()
    await expect(page.locator('.monitor-scene__zoom')).toBeVisible()
    // 缩放四件套：− / 百分比 / ＋ / 适应
    await expect(page.locator('.monitor-scene__zoom-btn[title="缩小"]')).toBeVisible()
    await expect(page.locator('.monitor-scene__zoom-btn[title="放大"]')).toBeVisible()
    await expect(page.locator('.monitor-scene__zoom-btn[title="适应画布"]')).toBeVisible()
    await expect(page.locator('.monitor-scene__zoom-val')).toHaveText('100%')

    // ===== 右列：实时警情（上）+ 多发故障排名（下）=====
    await expect(page.locator('.monitor__side')).toBeVisible()
    await expect(page.locator('.v2-card')).toHaveCount(2)
    await expect(page.locator('.ma').first()).toBeVisible()
    await expect(page.locator('.rank').first()).toBeVisible()
  })

  test('四项指标取自平台真值（画面图元数 + 绑定状态类）', async ({ page }) => {
    await gotoMonitor(page)
    await selectSystem(page, '消防给水')

    const values = await page.locator('.mm__value').allTextContents()
    // 设备总数 = 画面图元数；故障 = is-fault 绑定数；屏蔽 = offClass is-off 绑定数；预警 = is-over 绑定数
    expect(values.map((v) => v.replace(/,/g, ''))).toEqual(['2', '1', '1', '1'])

    // 换到气体灭火：画面只有 1 个图元，指标跟着换
    await selectSystem(page, '气体灭火')
    const gasValues = await page.locator('.mm__value').allTextContents()
    expect(gasValues.map((v) => v.replace(/,/g, ''))).toEqual(['1', '1', '0', '0'])
  })

  test('系统下拉可列出画面里的系统并切换', async ({ page }) => {
    await gotoMonitor(page)

    const before = (await page.locator('.mm__system-name').textContent())?.trim()

    // 打开下拉（Teleport 到 body，按触发框定位）
    await page.locator('.mm__system-toggle').click()
    const menu = page.locator('.mm__menu')
    await expect(menu).toBeVisible()

    const options = (await menu.locator('.mm__menu-item').allTextContents()).map((o) => o.trim())
    expect(options.length).toBeGreaterThan(1)
    expect(options).toContain('消防给水')
    expect(options).toContain('气体灭火')

    // 切到另一个系统：系统名与画布跟着换
    const other = options.find((o) => o !== before)
    expect(other).toBeTruthy()
    await menu.locator('.mm__menu-item', { hasText: other! }).click()
    await expect(menu).toBeHidden()

    await expect(page.locator('.mm__system-name')).toHaveText(other!)
    await expect(page.locator('.monitor-scene__svg').first()).toBeVisible()
  })

  test('画布缩放：＋ 放大 / − 缩小 / 适应 复位，且以中心为基准', async ({ page }) => {
    await gotoMonitor(page)

    const val = page.locator('.monitor-scene__zoom-val')
    await expect(val).toHaveText('100%')

    const canvas = page.locator('.monitor-scene__canvas')
    const transformOf = async () => {
      const t = await canvas.evaluate((el) => getComputedStyle(el).transform)
      return t
    }

    await page.locator('.monitor-scene__zoom-btn[title="放大"]').click()
    await expect(val).not.toHaveText('100%')
    const zoomed = await transformOf()
    // 放大后仍居中：transform 的平移分量为 0
    expect(zoomed).toMatch(/matrix\((\d+\.\d+), 0, 0, \1, 0, 0\)/)

    await page.locator('.monitor-scene__zoom-btn[title="缩小"]').click()
    await expect(val).toHaveText('100%')

    await page.locator('.monitor-scene__zoom-btn[title="放大"]').click()
    await page.locator('.monitor-scene__zoom-btn[title="适应画布"]').click()
    await expect(val).toHaveText('100%')
    expect(await transformOf()).toMatch(/matrix\(1, 0, 0, 1, 0, 0\)/)
  })

  test('实时警情与多发故障排名按画面异常点位派生', async ({ page }) => {
    await gotoMonitor(page)
    await selectSystem(page, '消防给水')

    // ===== 实时警情：角标 + 故障类型 + 时间 + 位置 =====
    const rows = page.locator('.ma__row')
    await expect(rows).toHaveCount(2) // 故障点 + 溢流点
    for (const row of await rows.all()) {
      await expect(row.locator('.ma__badge')).toHaveText(/故障|预警/)
      await expect(row.locator('.ma__title')).not.toBeEmpty()
      // 完整时间戳：2026-11-03 14:22
      await expect(row.locator('.ma__time')).toHaveText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
      // 位置 = 画面图元标签
      await expect(row.locator('.ma__loc')).toHaveText(/消防泵组|消防水池/)
    }

    // ===== 多发故障排名：名次徽标 + 类型 + 百分比 + 占比条 =====
    const ranks = page.locator('.rank__row')
    await expect(ranks).toHaveCount(2)
    await expect(page.locator('.rank__badge-no')).toHaveText(['01', '02'])
    await expect(page.locator('.rank__type')).toHaveText(['故障', '溢流'])
    // 占比：各 1 条异常点位 ÷ 2 条异常点位 = 50%
    await expect(page.locator('.rank__rate')).toHaveText(['50%', '50%'])
    await expect(page.locator('.rank__bar-fill')).toHaveCount(2)
  })
})
