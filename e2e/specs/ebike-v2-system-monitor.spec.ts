/**
 * 大屏「系统监测」页（ebike-v2）
 *
 * 覆盖（版式按 Figma 设计稿 110:10889「智能安全管控平台/系统监测」）：
 * - 版式：顶部「设备检测指标概览」横条 + 左侧组态画布 + 右列（实时警情 / 多发故障排名）
 * - 指标：四项计数取自实时设备数据（useSubsystemStore），按**设备台数**统计
 * - 系统切换：顶部「当前系统」下拉可列出画面里的系统，切换后画布与指标跟着换
 * - 缩放：画布右上角 − / ＋ / 适应，缩放以画布中心为基准（放大后仍居中）
 * - 右列两卡：实时警情（角标 + 设备编号 + 时间 / 位置）、多发故障排名（名次 + 设备类型 + 百分比 + 占比条）
 * - 组态画布：异常设备角标闪烁；点图元 → 右侧抽屉列这批设备 → 点行看单台详情
 *
 * 数据口径
 * --------
 * 指标 / 警情 / 排名 / 画布角标全部来自 useSubsystemStore（与「设备设施管理 → 运行监控」
 * 的三个系统主页同一份数据），因此：
 *   设备总数 = 该系统档案里的接入台数（确定性，见 config/subsystem-profiles.ts 的 scale）
 *   故障 / 预警 = 演示数据里随机注入的异常台数（有随机性 → 只断言范围，不断言具体数）
 * 画面本身是平台数据，用例经 API 现建（并按用例清理），节点符号要能在各系统的绑定表里
 * 查到对应设备，否则点开抽屉是空的。
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

/**
 * 设备台数（config/subsystem-profiles.ts 的 scale 推出来的确定性值）
 *
 * 消防给水：主机 1 + 分机 8 + 阀门 719+72 + 末端试水 194+38 + 压力 114 + 流量 6 + 液位 4 = 1156
 * 气体灭火：主机 1 + 分机 2 + 钢瓶压力探测器 98 = 101
 */
const DEVICE_TOTAL = { pipeline: '1,156', gas: '101' } as const

/**
 * 用例画面：两个图元，取自内置图元库（e2e 库里没有平台自定义图元）
 *  - VLV-BUTT-01 消火栓环网阀门 → 绑定表里领全部 FM 阀门（719 台）
 *  - PMP-SET-01 消防泵组       → 绑定表里领前 2 台监控分机
 *
 * 选 VLV-BUTT-01 是因为它领的设备多：演示数据按 ~6% 注入异常，
 * 719 台里必然有故障设备，角标闪烁的断言才不会随机翻车。
 */
const NODES = [
  { id: 'n1', symbol: 'VLV-BUTT-01', x: 320, y: 300, size: 72, label: '消火栓环网阀门' },
  { id: 'n2', symbol: 'PMP-SET-01', x: 720, y: 300, size: 72, label: '消防泵组' },
]

/** 第二个系统的画面：气体灭火的控制主机 + 钢瓶压力探测器（98 台） */
const GAS_NODES = [
  { id: 'g1', symbol: 'GFES-MH-01', x: 320, y: 300, size: 96, label: '气体灭火控制主机' },
  { id: 'g2', symbol: 'GFES-PD-01', x: 720, y: 300, size: 72, label: '钢瓶压力探测器' },
]

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

/**
 * 建一幅画面（平台级共享），并写入图元
 *
 * 返回画面 id，用例结束后删掉 —— 画面是平台级共享数据，
 * 留着会污染后续用例的画面挑选（系统监测页按规则挑「设备监控类」画面）。
 */
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
  return scene.id as string
}

/** 建两幅画面：两个系统各一幅（系统下拉才有得选） */
async function seedScenes(page: import('@playwright/test').Page, token: string): Promise<string[]> {
  const ids: string[] = []
  ids.push(
    await seedScene(page, token, { name: 'e2e 消防给水设备状态监控', systemKey: 'pipeline' }, NODES),
  )
  ids.push(
    await seedScene(page, token, { name: 'e2e 气体灭火设备状态监测', systemKey: 'gas' }, GAS_NODES),
  )
  return ids
}

/** 清理用例建的画面（平台级共享数据，不清理会串到别的用例） */
async function removeScenes(page: import('@playwright/test').Page, token: string, ids: string[]) {
  const headers = { Authorization: `Bearer ${token}` }
  for (const id of ids) {
    await page.request.delete(`${API}/api/scenes/${encodeURIComponent(id)}`, { headers })
  }
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

/** 读顶部四项指标（一次读全，避免 3s 刷新把两个值读到不同轮） */
async function readMetrics(page: import('@playwright/test').Page): Promise<string[]> {
  return page.locator('.mm__value').allTextContents()
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

  let token = ''
  let sceneIds: string[] = []

  test.beforeEach(async ({ page }) => {
    token = await login(page)
    sceneIds = await seedScenes(page, token)
  })

  test.afterEach(async ({ page }) => {
    await removeScenes(page, token, sceneIds)
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

  test('四项指标取自实时设备数据（按设备台数统计）', async ({ page }) => {
    await gotoMonitor(page)
    await selectSystem(page, '消防给水')

    const values = (await readMetrics(page)).map((v) => v.replace(/,/g, ''))
    // 设备总数 = 该系统接入的设备台数（确定性）
    expect(values[0]).toBe(DEVICE_TOTAL.pipeline.replace(/,/g, ''))
    // 故障 / 屏蔽 / 预警是随机注入的异常台数 → 只断言范围与合计
    const fault = Number(values[1])
    const shield = Number(values[2])
    const warn = Number(values[3])
    expect(Number.isInteger(fault)).toBe(true)
    expect(fault).toBeGreaterThanOrEqual(0)
    expect(shield).toBeGreaterThanOrEqual(0)
    expect(warn).toBeGreaterThanOrEqual(0)
    // 1156 台按 ~6% 注入异常 → 必然有异常设备
    expect(fault + warn).toBeGreaterThan(0)

    // 换到气体灭火：设备台数跟着换（101 = 主机 1 + 分机 2 + 钢瓶压力探测器 98）
    await selectSystem(page, '气体灭火')
    const gasValues = (await readMetrics(page)).map((v) => v.replace(/,/g, ''))
    expect(gasValues[0]).toBe(DEVICE_TOTAL.gas)
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

  test('实时警情与多发故障排名按实时设备数据派生', async ({ page }) => {
    await gotoMonitor(page)
    await selectSystem(page, '消防给水')

    // ===== 实时警情：角标 + 设备编号 + 时间 + 位置 =====
    const rows = page.locator('.ma__row')
    expect(await rows.count()).toBeGreaterThan(0)
    for (const row of await rows.all()) {
      // 角标文案 = 设备当前状态（故障 / 预警 / 离线 / 未知 / 已屏蔽）
      await expect(row.locator('.ma__badge')).toHaveText(/故障|预警|离线|未知|已屏蔽/)
      // 标题 = 设备编号（现场铭牌号）
      await expect(row.locator('.ma__title')).not.toBeEmpty()
      // 完整时间戳：2026-11-03 14:22
      await expect(row.locator('.ma__time')).toHaveText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
      // 位置 = 设备类型 · 位置描述
      await expect(row.locator('.ma__loc')).toHaveText(/^.+ · .+$/)
    }

    // ===== 多发故障排名：名次徽标 + 设备类型 + 百分比 + 占比条 =====
    const ranks = page.locator('.rank__row')
    const rankCount = await ranks.count()
    expect(rankCount).toBeGreaterThan(0)
    // 名次徽标从 01 起连续
    const badges = await page.locator('.rank__badge-no').allTextContents()
    expect(badges).toEqual(badges.map((_, i) => String(i + 1).padStart(2, '0')))
    // 类型 = 设备类型名（不是点位名）
    await expect(page.locator('.rank__type').first()).not.toBeEmpty()
    // 占比条按百分比铺开
    await expect(page.locator('.rank__bar-fill')).toHaveCount(rankCount)
    const rates = (await page.locator('.rank__rate').allTextContents()).map((r) =>
      Number(r.replace('%', '')),
    )
    expect(rates[0]).toBeGreaterThan(0)
    // 降序
    expect([...rates].sort((a, b) => b - a)).toEqual(rates)
  })

  test('组态画布：异常设备角标闪烁，点图元下钻看设备清单', async ({ page }) => {
    await gotoMonitor(page)
    await selectSystem(page, '消防给水')

    // ===== 画布节点接了实时状态：阀门领 719 台，图元名与设备数写在 aria 上 =====
    const valve = page.locator('.monitor-scene__hit-group', { hasText: '消火栓环网阀门' })
    await expect(valve).toHaveAttribute('aria-label', /消火栓环网阀门：719 台设备，\d+ 台异常/)

    // ===== 异常角标：故障（橙）/ 超限（红）二选一，且角标在闪 =====
    const faultBadge = page.locator('.monitor-scene__svg--base .sym-root.is-fault .sym-badge-fault')
    const overBadge = page.locator('.monitor-scene__svg--base .sym-root.is-over .sym-badge-alarm')
    const faultVisible = await faultBadge.first().isVisible().catch(() => false)
    const overVisible = await overBadge.first().isVisible().catch(() => false)
    expect(faultVisible || overVisible).toBe(true)

    const badge = faultVisible ? faultBadge.first() : overBadge.first()
    // 闪烁：角标元素挂着 blink 动画
    const animName = await badge.evaluate((el) => getComputedStyle(el).animationName)
    expect(animName).toContain('monitor-badge-blink')

    // ===== 点图元 → 右侧抽屉列这批设备 =====
    const group = page.locator('.monitor-scene__hit-group', { hasText: '消火栓环网阀门' })
    const box = await group.boundingBox()
    if (!box) throw new Error('图元命中区不可见')
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

    const drawer = page.locator('.md')
    await expect(drawer).toBeVisible({ timeout: 10000 })
    // 标题 = 图元名
    await expect(page.locator('.md__title')).toHaveText('消火栓环网阀门')

    // 头部：设备数量 + 大数字 + 占比环 + 异常/正常图例
    // （版式与「设备设施台账 › 运行监控 › 系统监测」的下钻抽屉一致）
    await expect(page.locator('.md__stat-label')).toContainText('设备数量')
    await expect(page.locator('.md__stat-num')).toHaveText('719')
    await expect(page.locator('.md__legend-item')).toHaveCount(2)
    await expect(page.locator('.md__legend-item').first()).toContainText('异常')
    await expect(page.locator('.md__legend-item').nth(1)).toContainText('正常')

    // 筛选行：编号位置 / 运行状态 / 报警故障 / 查询
    await expect(page.locator('.md__search-input')).toHaveAttribute('placeholder', '设备编号/位置')
    await expect(page.locator('.md__select')).toHaveCount(2)
    await expect(page.locator('.md__query')).toHaveText('查询')

    // 表头五列 + 表格有数据
    await expect(page.locator('.md__th')).toHaveText(['运行状态', '设备编码', '位置', '实时值', '更新时间'])
    expect(await page.locator('.md__tr').count()).toBeGreaterThan(0)

    // 分页：共 N 条记录 第 x/y 页
    await expect(page.locator('.md__pager-total')).toHaveText(/共 \d+ 条记录 第 1\/\d+ 页/)

    // ===== 点行 → 二级详情 =====
    await page.locator('.md__code-btn').first().click()
    await expect(page.locator('.md__status')).toBeVisible()
    await expect(page.locator('.md__fact-k').first()).toHaveText('设备编号')
    await expect(page.locator('.md__fact-k').nth(1)).toHaveText('设备类型')
    await expect(page.locator('.md__fact-k').nth(2)).toHaveText('安装位置')
    await expect(page.locator('.md__section-title')).toHaveText('实时测点')
    // 详情里的测点值要给中文标签（状态量 / 开关量不能甩英文枚举）
    const metricText = await page.locator('.md__metric').first().textContent()
    expect(metricText).not.toMatch(/normal|fault|open|closed/)

    // 返回按钮回到清单
    await page.locator('.md__icon-btn[title="返回设备清单"]').click()
    await expect(page.locator('.md__table')).toBeVisible()
  })
})
