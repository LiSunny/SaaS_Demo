/**
 * 大屏「消防档案」页（ebike-v2）
 *
 * 覆盖（版式按 Figma 设计稿 110:11265「智能安全管控平台/消防档案」）：
 * - 入口：顶栏导航第 4 项「消防档案」
 * - 版式：左栏「档案分类」（280 宽，三个纵向 tab）+ 右栏「详细记录」（表格铺满余量）
 * - tab：值班记录 / 巡查记录 / 隐患台账三类（设计稿未给条数角标，故无角标）
 * - 字段：三张表的列与设计稿/附件截图一致（值班 7 / 巡查 9 / 隐患 10 列）
 * - 工具条：搜索 + 筛选下拉 + 日期区间 + 查询 / 批量导出
 * - 交互：搜索真实过滤、筛选下拉真实过滤、日期区间真实过滤、tab 切换后各自记住状态
 * - 色彩：异常态统一一个红，非异常走中性色阶（全页无绿 / 橙）
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

/** 打开大屏并切到消防档案页 */
async function gotoArchive(page: import('@playwright/test').Page) {
  await page.goto('/landing/ebike-v2?bigscreenId=20')
  // 顶栏导航浮在三维模型 iframe 之上，Playwright 的合成 click 会卡在可操作性检查
  // （本大屏既有控件同样如此，见 .claude/CLAUDE.md「本页 Playwright 合成点击全部判不过」）。
  // 改用真实鼠标事件点元素中心 —— 与用户实际点击一致，也不受机器负载影响。
  const nav = page.locator('.v2-nav__item', { hasText: '消防档案' })
  const box = await nav.boundingBox()
  if (!box) throw new Error('顶栏导航「消防档案」不可见')
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.locator('.list-panel')).toBeVisible({ timeout: 30000 })
}

test.describe('大屏消防档案页', () => {
  test.use({ viewport: VIEWPORT })

  /**
   * 用例超时放宽到 120s
   *
   * 进入档案页前停在总览页，总览页带三维场景。无头 Chromium 走软件渲染
   * （SwiftShader），三维循环占满主线程，Playwright 的可操作性检查被饿死：
   * 实测一次点击要 6.2s、模型就绪要 7.5s。这不是页面缺陷，是无头环境的
   * 渲染开销 —— 超时按实测开销配，别按默认值卡。
   */
  test.describe.configure({ timeout: 120000 })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('左栏档案分类 + 右栏详细记录的双分区版式', async ({ page }) => {
    await gotoArchive(page)

    // 左栏：档案分类分区，固定 280 宽
    const side = page.locator('.archive-side')
    await expect(side).toHaveCount(1)
    await expect(side.locator('.section-title')).toContainText('档案分类')
    const sideBox = await side.boundingBox()
    expect(sideBox).not.toBeNull()
    expect(Math.round(sideBox!.width)).toBe(280)

    // 右栏：详细记录分区
    await expect(page.locator('.list-panel .section-title')).toContainText('详细记录')

    // 三个分类 tab（纵向侧栏，设计稿无条数角标）
    const tabs = page.locator('.archive-side__tab')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0)).toContainText('值班记录')
    await expect(tabs.nth(1)).toContainText('巡查记录')
    await expect(tabs.nth(2)).toContainText('隐患台账')
    await expect(page.locator('.archive-side__tab-count')).toHaveCount(0)

    // 默认停在值班记录
    await expect(page.locator('.archive-side__tab.is-active')).toContainText('值班记录')

    // 右栏吃掉剩余宽度（1920 − 16×2 − 280 − 18 ≈ 1582）
    const box = await page.locator('.list-panel').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(1500)
  })

  test('三张表的列与设计稿一致', async ({ page }) => {
    await gotoArchive(page)

    const heads = page.locator('.list-panel__th')
    const labels = async () => (await heads.allTextContents()).map((t) => t.trim())

    // 值班记录 7 列（设计稿 110:16969 的表头）
    expect(await labels()).toEqual([
      '日期', '班组', '班次', '实际上班时间', '值班人员', '值班内容', '操作',
    ])
    await expect(page.locator('.list-panel__row')).toHaveCount(10) // 每页 10 条

    // 巡查记录 9 列
    await page.locator('.archive-side__tab', { hasText: '巡查记录' }).click()
    expect(await labels()).toEqual([
      '状态', '所属计划', '任务名称', '执行人', '关联点位',
      '计划开始时间', '计划结束时间', '实际完成时间', '操作',
    ])
    await expect(page.locator('.list-panel__row')).toHaveCount(10)

    // 隐患台账 10 列
    await page.locator('.archive-side__tab', { hasText: '隐患台账' }).click()
    expect(await labels()).toEqual([
      '整改状态', '隐患名称', '隐患类型', '隐患位置', '上报人',
      '上报来源', '上报日期', '关联巡检点', '是否分享数据', '操作',
    ])
    await expect(page.locator('.list-panel__row')).toHaveCount(10)
  })

  test('工具条：搜索 + 筛选 + 日期区间 + 查询 / 批量导出', async ({ page }) => {
    await gotoArchive(page)

    // 值班记录：搜索人员 + 全部班组 + 全部班次 + 日期区间
    await expect(page.locator('.list-panel__search-input')).toHaveAttribute(
      'placeholder',
      '搜索人员',
    )
    const filters = page.locator('.list-panel__filter')
    await expect(filters).toHaveCount(2)
    await expect(filters.nth(0)).toContainText('全部班组')
    await expect(filters.nth(1)).toContainText('全部班次')

    // 日期区间选择器 + 查询 / 批量导出
    await expect(page.locator('.list-panel__date')).toBeVisible()
    await expect(page.locator('.list-panel__query')).toContainText('查询')
    await expect(page.locator('.list-panel__export')).toContainText('批量导出')
  })

  test('分页条：左侧每页显示与总数，右侧页码按钮', async ({ page }) => {
    await gotoArchive(page)

    // 左侧：每页显示 + 共 N 条数据
    await expect(page.locator('.list-panel__foot-left')).toContainText('每页显示')
    await expect(page.locator('.list-panel__foot-left')).toContainText('共 12 条数据')
    await expect(page.locator('.list-panel__size')).toBeVisible()

    // 右侧：上一页 / 页码 / 下一页（EP 分页器，文字按钮）
    const pager = page.locator('.list-panel__pager')
    await expect(pager.locator('.el-pager li')).toHaveCount(2) // 12 条 / 每页 10 → 2 页
    await expect(pager.locator('.btn-prev')).toContainText('上一页')
    await expect(pager.locator('.btn-next')).toContainText('下一页')

    // 第一页 10 行，翻到第二页剩 2 行
    await expect(page.locator('.list-panel__row')).toHaveCount(10)
    await pager.locator('.el-pager li').nth(1).click()
    await expect(page.locator('.list-panel__row')).toHaveCount(2)

    // 切 tab 后回到该 tab 的第一页
    await page.locator('.archive-side__tab', { hasText: '巡查记录' }).click()
    await expect(page.locator('.list-panel__row')).toHaveCount(10)
    await expect(pager.locator('.el-pager li.is-active')).toHaveText('1')
  })

  test('分页器吃到大屏深色主题，不回退成 EP 默认浅色', async ({ page }) => {
    await gotoArchive(page)

    // 全局 style.css 的页码按钮规则是 `var(--pagi-bg) !important`，
    // 而 --pagi-bg 只在 html.dark 下才是深色；大屏页没有 html.dark，
    // 不覆盖就会渲染成浅灰方块（与深蓝卡片割裂）。这里锁住。
    const pagerTone = await page.evaluate(() => {
      const li = document.querySelector('.list-panel__pager .el-pager li:not(.is-active)')
      const active = document.querySelector('.list-panel__pager .el-pager li.is-active')
      const prev = document.querySelector('.list-panel__pager .btn-prev')
      const wrapper = document.querySelector('.list-panel__size .el-select__wrapper')
      const pick = (el: Element | null) =>
        el ? { bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color } : null
      return { li: pick(li), active: pick(active), prev: pick(prev), wrapper: pick(wrapper) }
    })

    // 非激活页码：透明底（不是浅灰 #F0F1F6）、灰字
    expect(pagerTone.li?.bg).toBe('rgba(0, 0, 0, 0)')
    expect(pagerTone.li?.color).toBe('rgb(190, 190, 190)')

    // 激活页码：深蓝填充
    expect(pagerTone.active?.bg).toBe('rgba(0, 68, 130, 0.56)')

    // 「上一页」文字按钮：深蓝填充
    expect(pagerTone.prev?.bg).toBe('rgba(0, 68, 130, 0.56)')

    // 「每页条数」选择框：透明底（不是白底 #fff）
    expect(pagerTone.wrapper?.bg).toBe('rgba(0, 0, 0, 0)')
  })

  test('搜索真实过滤当前 tab 的行', async ({ page }) => {
    await gotoArchive(page)
    await page.locator('.archive-side__tab', { hasText: '隐患台账' }).click()

    await page.locator('.list-panel__search-input').fill('食堂')
    const rows = page.locator('.list-panel__row')
    await expect(rows.first()).toBeVisible()

    const texts = await rows.allTextContents()
    expect(texts.length).toBeGreaterThan(0)
    for (const t of texts) expect(t).toContain('食堂')

    // 搜索命中不到时给空态
    await page.locator('.list-panel__search-input').fill('不存在的关键字')
    await expect(page.locator('.list-panel__row')).toHaveCount(0)
    await expect(page.locator('.list-panel__empty')).toContainText('没有符合条件的记录')
  })

  test('筛选下拉真实过滤，且与搜索是 AND 关系', async ({ page }) => {
    await gotoArchive(page)
    await page.locator('.archive-side__tab', { hasText: '巡查记录' }).click()

    // 状态下拉：第一个筛选器
    await page.locator('.list-panel__filter').first().click()
    await expect(page.locator('.list-panel__menu')).toBeVisible()
    await page.locator('.list-panel__menu-item', { hasText: '逾期完成' }).click()

    const statuses = (await page.locator('.list-panel__status').allTextContents()).map((t) => t.trim())
    expect(statuses.length).toBe(2)
    for (const s of statuses) expect(s).toBe('逾期完成')

    // 总数按过滤后的结果：共 2 条数据
    await expect(page.locator('.list-panel__foot-left')).toContainText('共 2 条数据')

    // AND：再加一个搜索条件（执行人），结果仍是「逾期完成」那两条
    await page.locator('.list-panel__search-input').fill('王志豪')
    await expect(page.locator('.list-panel__row')).toHaveCount(1)
    await expect(page.locator('.list-panel__status').first()).toHaveText('逾期完成')
  })

  test('日期区间真实过滤', async ({ page }) => {
    await gotoArchive(page)

    // 直接在区间输入框里键入日期：大屏上比翻日历快，
    // 且不依赖面板当前开在哪个月（与演示数据的月份无关）。
    const inputs = page.locator('.list-panel__date input.el-range-input')
    await inputs.first().click()
    await page.keyboard.type('2026-11-02')
    await page.keyboard.press('Enter')
    await inputs.nth(1).click()
    await page.keyboard.type('2026-11-02')
    await page.keyboard.press('Enter')

    await expect(page.locator('.list-panel__row')).toHaveCount(2)
    await expect(page.locator('.list-panel__foot-left')).toContainText('共 2 条数据')
    const date = await page.locator('.list-panel__row').first().locator('.list-panel__td').first().textContent()
    expect(date?.trim()).toBe('2026-11-02')
  })

  test('切走再切回，筛选与搜索各自保留', async ({ page }) => {
    await gotoArchive(page)
    await page.locator('.archive-side__tab', { hasText: '巡查记录' }).click()

    await page.locator('.list-panel__filter').first().click()
    await page.locator('.list-panel__menu-item', { hasText: '逾期完成' }).click()
    await page.locator('.list-panel__search-input').fill('王志豪')

    // 切到别的 tab：巡查记录的条件不带过去
    await page.locator('.archive-side__tab', { hasText: '隐患台账' }).click()
    await expect(page.locator('.list-panel__filter').first()).toContainText('全部')
    await expect(page.locator('.list-panel__search-input')).toHaveValue('')
    await expect(page.locator('.list-panel__row')).toHaveCount(10)

    // 切回来：条件还在
    await page.locator('.archive-side__tab', { hasText: '巡查记录' }).click()
    await expect(page.locator('.list-panel__filter').first()).toContainText('逾期完成')
    await expect(page.locator('.list-panel__search-input')).toHaveValue('王志豪')
    await expect(page.locator('.list-panel__row')).toHaveCount(1)
  })

  test('状态色：异常统一一个红，非异常走中性色阶', async ({ page }) => {
    await gotoArchive(page)
    await page.locator('.archive-side__tab', { hasText: '隐患台账' }).click()

    // 隐患台账：待认领 / 待整改为异常红，已确认为中性
    const tone = await page.evaluate(() => {
      const out: Record<string, string> = {}
      document.querySelectorAll('.list-panel__row').forEach((row) => {
        const status = row.querySelector('.list-panel__status')
        if (!status) return
        out[status.textContent?.trim() ?? ''] = getComputedStyle(status).color
      })
      return out
    })
    expect(tone['待认领']).toBe('rgb(255, 128, 128)')
    expect(tone['待整改']).toBe('rgb(255, 128, 128)')
    // 中性色值随 fire-common.scss 的文字色阶走：c179a72「修改校园总览页 列表文字配色」
    // 把 L2 指标标签 #a9c9ea 调暗为 #93afcc（L3/L4 一并压暗），这里跟最新色阶。
    expect(tone['已确认']).toBe('rgb(147, 175, 204)')

    // 全页不出现绿 / 橙语义色：按色相判定
    // （不能比 RGB 的绿通道与蓝通道是否相等 —— 中性蓝 #a9c9ea 的两通道本就不同）
    const hues = await page.evaluate(() => {
      const hueOf = (color: string) => {
        const m = color.match(/\d+/g)?.map(Number)
        if (!m || m.length < 3) return -1
        const [r, g, b] = m
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const d = max - min
        if (d === 0) return -1
        let h: number
        if (max === r) h = ((g - b) / d) % 6
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        h *= 60
        return h < 0 ? h + 360 : h
      }
      return [...document.querySelectorAll('.list-panel__status, .list-panel__tag')].map((el) =>
        hueOf(getComputedStyle(el).color),
      )
    })
    expect(hues.length).toBeGreaterThan(0)
    for (const h of hues) {
      // 只允许「暖红」（异常）或「蓝族」（中性）
      const isWarmRed = h >= 0 && h < 15
      const isBlue = h >= 180 && h <= 260
      expect(isWarmRed || isBlue).toBe(true)
    }
  })

  test('操作列与批量导出给出明示反馈，不静默无响应', async ({ page }) => {
    await gotoArchive(page)
    await page.locator('.list-panel__act').first().click({ timeout: 60000 })
    await expect(page.locator('.list-panel__toast')).toContainText('暂未接入')

    await page.locator('.list-panel__export').click()
    await expect(page.locator('.list-panel__toast')).toContainText('批量导出')
  })
})
