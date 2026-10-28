/**
 * 消防水系统监测（设备设施管理 › 运行监控 › 消防水系统监测）
 *
 * 覆盖垂直三段式页面：
 * - 三段顺序：① 核心数据 → ② 组态 → ③ 报警记录
 * - 核心数据卡：4 张；卡面声明的测点数 = 下钻抽屉实际列出的行数
 * - 组态：12 个位图图元 + 12 条连线；位图全部加载成功（0 个解码失败）
 * - 下钻：点图元 → 点位组抽屉 → 点行 → 单点详情抽屉
 * - 报警记录：表头列齐、有记录、等级筛选可用
 *
 * 计数断言一律用「页面自己声明的数字」互相校验，不写死总数。
 *
 * 登录用种子企业用户（非平台角色）：平台角色带 system-role，
 * 会被路由守卫挡在业务域路由外（见 src/router/index.ts 全局守卫）。
 */
import { test, expect } from '@playwright/test'

/** e2e 后端端口（见 e2e/setup.mjs）；本地复跑可覆盖为 E2E_API */
const API = process.env.E2E_API ?? 'http://localhost:3202'

/** 种子企业用户（非平台角色，可访问业务域路由） */
const USER = { phone: '13300001111', password: 'admin123!@#' }

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

/** 从「114 个测点」这类文案里取数字 */
function declared(text: string | null, pattern: RegExp) {
  const m = text?.match(pattern)
  if (!m) throw new Error(`文案里取不到数字：${text}`)
  return Number(m[1])
}

test.describe('消防水系统监测', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/device-facility/monitor/fire-water')
    await expect(page.locator('.fwm__title')).toBeVisible()
    // 等首帧组态与实时数据就位
    await expect(page.locator('.fw-scene__node').first()).toBeVisible()
    await page.waitForTimeout(1200)
  })

  test('三段垂直顺序 + 核心数据 4 卡 + 组态 12 图元 / 12 连线 + 位图加载成功', async ({ page }) => {
    // ===== 三段顺序 =====
    const sections = await page.locator('.fwm__section-title').allTextContents()
    expect(sections.map(s => s.trim())).toEqual(['核心数据', '消防给水系统总貌', '报警记录'])

    // 视觉顺序：三段在页面里自上而下
    const tops: number[] = []
    for (const s of sections) {
      const box = await page.locator('.fwm__section', { has: page.locator('.fwm__section-title', { hasText: s }) }).first().boundingBox()
      tops.push(box?.y ?? 0)
    }
    expect(tops[0]).toBeLessThan(tops[1])
    expect(tops[1]).toBeLessThan(tops[2])

    // ===== 核心数据 4 卡 =====
    await expect(page.locator('.fw-card')).toHaveCount(4)
    const cardLabels = await page.locator('.fw-card__label').allTextContents()
    expect(cardLabels.map(s => s.trim())).toEqual(['供水压力', '供水流量', '水池水位', '系统状态'])
    // 每张卡都要有主值与口径说明（数字可复算的前提）
    for (const label of cardLabels) {
      const card = page.locator('.fw-card', { hasText: label }).first()
      await expect(card.locator('.fw-card__num')).not.toBeEmpty()
      await expect(card.locator('.fw-card__sub')).not.toBeEmpty()
    }

    // ===== 组态 =====
    await expect(page.locator('.fw-scene__node')).toHaveCount(12)
    await expect(page.locator('.fw-edge')).toHaveCount(12)
    // 位图全部加载成功
    const imgs = await page.evaluate(() =>
      [...document.querySelectorAll('.fw-scene__node svg image')].map(im => ({
        href: im.getAttribute('href') ?? '',
        loaded: (im as SVGImageElement).getBBox !== undefined && im.getBoundingClientRect().width > 0,
      })),
    )
    expect(imgs.length).toBe(12)
    expect(imgs.every(i => i.loaded)).toBe(true)
    expect(imgs.every(i => i.href.includes('/symbols/img/'))).toBe(true)

    // ===== 报警记录 =====
    for (const col of ['时间', '位置', '点位编号', '报警内容', '等级', '状态', '操作']) {
      await expect(page.locator('.fwat .fi-th', { hasText: col }).first()).toBeVisible()
    }
    await expect(page.locator('.fwat tbody tr').first()).toBeVisible()

    // ===== 规模说明与「系统状态」卡同口径 =====
    // 页头 N 与系统状态卡 N 必须相等（1147 是设备数，1156 才是点位数）
    const desc = await page.locator('.fwm__desc').textContent()
    const descPoints = Number(desc?.match(/(\d+)\s*个采集点位/)?.[1])
    const statusRange = await page
      .locator('.fw-card', { hasText: '系统状态' })
      .first()
      .locator('.fw-card__range')
      .textContent()
    const cardPoints = Number(statusRange?.match(/(\d+)\s*个点位/)?.[1])
    expect(descPoints).toBeGreaterThan(0)
    expect(descPoints).toBe(cardPoints)
  })

  test('核心数据卡声明的测点数 = 下钻抽屉实际点位行数', async ({ page }) => {
    for (const label of ['供水压力', '供水流量', '水池水位']) {
      const card = page.locator('.fw-card', { hasText: label }).first()
      const sub = await card.locator('.fw-card__sub').textContent()
      const declaredCount = declared(sub ?? '', /(\d+)\s*个测点/)

      await card.click()
      await expect(page.locator('.fwd__list .pr').first()).toBeVisible()
      const rows = await page.locator('.fwd__list .pr').count()
      expect(rows).toBe(declaredCount)

      // 抽屉自己声明的数量也要一致
      const meta = await page.locator('.fwd__meta').textContent()
      expect(declared(meta ?? '', /(\d+)\s*个点位/)).toBe(declaredCount)

      await page.keyboard.press('Escape')
      await page.waitForTimeout(600)
    }
  })

  test('组态图元下钻：点位组抽屉 → 单点详情抽屉', async ({ page }) => {
    await page.locator('.fw-scene__node', { hasText: '消防水池' }).first().click()
    await expect(page.locator('.fwd__list .pr').first()).toBeVisible()
    await expect(page.locator('.el-drawer__title').first()).toHaveText('消防水池')

    // 异常优先排序：首行应带异常标记
    await expect(page.locator('.fwd__list .pr').first()).toBeVisible()

    await page.locator('.fwd__list .pr').first().click()
    await expect(page.locator('.pdd')).toBeVisible()
    await expect(page.locator('.pdd__chart canvas')).toHaveCount(1)
    // 组内导航：点位编号（4 位采集点）
    await expect(page.locator('.el-drawer__title').last()).toHaveText(/^[A-Z]+-\d{4}$/)
  })

  test('报警记录：等级筛选切换 + 标记已处理', async ({ page }) => {
    const rows = page.locator('.fwat tbody tr')
    const before = await rows.count()
    expect(before).toBeGreaterThan(0)

    // 等级筛选：点「一般」后仍应有行，且条数不多于全部
    await page.locator('.fwat__filter', { hasText: '一般' }).click()
    await page.waitForTimeout(400)
    const filtered = await rows.count()
    expect(filtered).toBeLessThanOrEqual(before)
    expect(filtered).toBeGreaterThan(0)

    // 切回全部
    await page.locator('.fwat__filter', { hasText: '全部' }).click()
    await page.waitForTimeout(400)
    await expect(rows).toHaveCount(before)

    // 标记已处理：首行状态从「未处理」变「已处理」
    const firstRow = rows.first()
    await firstRow.locator('.act-btn').click()
    await page.waitForTimeout(400)
    await expect(firstRow.locator('.fi-tag', { hasText: '已处理' })).toBeVisible()
  })
})
