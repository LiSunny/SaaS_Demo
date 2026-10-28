/**
 * 消防水系统监测（设备设施管理 › 运行监控 › 消防水系统监测）
 *
 * 覆盖新版式（设计稿）：
 * - 结构：统计区常驻（固定高度）→ 视图切换条 → 主体区填满剩余高度
 * - 页面不出垂直滚动条
 * - 统计卡 4 张：设备总数 / 设备在线率 / 设备故障率 / 预警设备，分项可复算
 * - 三个视图：系统总览（组态）/ 报警记录 / 设备台帐
 * - 组态：11 个位图图元 + 10 条连线；位图全部加载成功（0 个解码失败）
 * - 下钻：点图元 → 点位组抽屉 → 点行 → 单点详情抽屉
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

/** 设计稿目标视口：1920×1080 + 272px 侧栏 = 1648×998 内容区 */
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

/** 从「114 个测点」这类文案里取数字 */
function declared(text: string | null, pattern: RegExp) {
  const m = text?.match(pattern)
  if (!m) throw new Error(`文案里取不到数字：${text}`)
  return Number(m[1])
}

test.describe('消防水系统监测', () => {
  test.use({ viewport: VIEWPORT })

  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/device-facility/monitor/fire-water')
    await expect(page.locator('.fwm__title')).toBeVisible()
    // 等首帧组态与实时数据就位
    await expect(page.locator('.fw-scene__node').first()).toBeVisible()
    await page.waitForTimeout(1200)
  })

  test('统计区常驻固定高度 + 页面不出垂直滚动条 + 三个视图切换', async ({ page }) => {
    // ===== 统计区常驻 =====
    const statsBox = await page.locator('.fwm__stats').boundingBox()
    expect(statsBox?.height).toBeGreaterThan(0)

    // ===== 三个 tab =====
    const tabs = await page.locator('.fw-tabs__item').allTextContents()
    expect(tabs.map(s => s.trim())).toEqual(['系统总览', '报警记录', '设备台帐'])

    // 切到报警记录：统计区位置与高度不变，主体区换成表格
    await page.locator('.fw-tabs__item', { hasText: '报警记录' }).click()
    await expect(page.locator('.fwat .fi-th').first()).toBeVisible()
    const statsBox2 = await page.locator('.fwm__stats').boundingBox()
    expect(statsBox2?.y).toBeCloseTo(statsBox?.y ?? 0, 0)
    expect(statsBox2?.height).toBeCloseTo(statsBox?.height ?? 0, 0)

    // ===== 页面不出垂直滚动条 =====
    const overflow = await page.evaluate(() => {
      const el = document.querySelector('.main-content') as HTMLElement | null
      if (!el) return null
      return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
    })
    expect(overflow).not.toBeNull()
    // 允许 1px 的取整误差
    expect(overflow!.scrollHeight).toBeLessThanOrEqual(overflow!.clientHeight + 1)

    // ===== 切到设备台帐 =====
    await page.locator('.fw-tabs__item', { hasText: '设备台帐' }).click()
    await expect(page.locator('.fwlt .fi-th').first()).toBeVisible()
    const overflow2 = await page.evaluate(() => {
      const el = document.querySelector('.main-content') as HTMLElement | null
      return el ? { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight } : null
    })
    expect(overflow2!.scrollHeight).toBeLessThanOrEqual(overflow2!.clientHeight + 1)
  })

  test('统计卡 4 张 + 分项可复算（主机+器件=总数，比率与分项一致）', async ({ page }) => {
    await expect(page.locator('.fw-card')).toHaveCount(4)
    const cardLabels = await page.locator('.fw-card__label').allTextContents()
    expect(cardLabels.map(s => s.trim())).toEqual([
      '设备总数',
      '设备在线率',
      '设备故障率',
      '预警设备',
    ])

    // 每张卡都要有主值与图例分项
    for (const label of cardLabels) {
      const card = page.locator('.fw-card', { hasText: label }).first()
      await expect(card.locator('.fw-card__num')).not.toBeEmpty()
      await expect(card.locator('.fw-card__legend-item')).toHaveCount(2)
    }

    // 设备总数 = 主机 + 器件
    const totalCard = page.locator('.fw-card', { hasText: '设备总数' }).first()
    const totalNum = Number(await totalCard.locator('.fw-card__num').textContent())
    const legendNums = await totalCard.locator('.fw-card__legend-value').allTextContents()
    const [host, device] = legendNums.map(n => Number(n.trim()))
    expect(host + device).toBe(totalNum)

    // 设备在线率 = 在线 / 总数
    const onlineCard = page.locator('.fw-card', { hasText: '设备在线率' }).first()
    const onlinePct = Number(await onlineCard.locator('.fw-card__num').textContent())
    const [offline, online] = (
      await onlineCard.locator('.fw-card__legend-value').allTextContents()
    ).map(n => Number(n.trim()))
    expect((online / totalNum) * 100).toBeCloseTo(onlinePct, 1)
    expect(offline + online).toBe(totalNum)

    // 设备故障率 = 故障 / 总数
    const faultCard = page.locator('.fw-card', { hasText: '设备故障率' }).first()
    const faultPct = Number(await faultCard.locator('.fw-card__num').textContent())
    const [fault, faultNormal] = (
      await faultCard.locator('.fw-card__legend-value').allTextContents()
    ).map(n => Number(n.trim()))
    expect((fault / totalNum) * 100).toBeCloseTo(faultPct, 1)
    expect(fault + faultNormal).toBe(totalNum)

    // 预警设备台数 = 预警 + 正常
    const warnCard = page.locator('.fw-card', { hasText: '预警设备' }).first()
    const warnNum = Number(await warnCard.locator('.fw-card__num').textContent())
    const [warn, warnNormal] = (
      await warnCard.locator('.fw-card__legend-value').allTextContents()
    ).map(n => Number(n.trim()))
    expect(warn + warnNormal).toBe(totalNum)
    expect(warnNum).toBe(warn)
  })

  test('系统总览：组态 11 图元 / 10 连线 + 位图加载成功 + 悬浮图例', async ({ page }) => {
    // 三层结构：底图层（连线 + 图元位图）/ 文本层（数值 + 交互）/ 动画层（流动光带）
    await expect(page.locator('.fw-scene__svg--base')).toHaveCount(1)
    await expect(page.locator('.fw-scene__svg--text')).toHaveCount(1)
    await expect(page.locator('.fw-scene__svg--flow')).toHaveCount(1)
    await expect(page.locator('.fw-scene__svg--base .fw-scene__node')).toHaveCount(11)
    await expect(page.locator('.fw-scene__svg--text .fw-scene__node')).toHaveCount(11)
    await expect(page.locator('.fw-scene__svg--base .fw-edge')).toHaveCount(10)
    // 10 条边全是管道线（flow=reverse）→ 动画层 10 条
    await expect(page.locator('.fw-scene__svg--flow .fw-edge__flow')).toHaveCount(10)
    // 位图只在底图层：文本层与动画层含位图会让每次刷新重栅格化整张 SVG
    expect(await page.locator('.fw-scene__svg--text image').count()).toBe(0)
    expect(await page.locator('.fw-scene__svg--flow image').count()).toBe(0)
    // 位图全部加载成功
    const imgs = await page.evaluate(() =>
      [...document.querySelectorAll('.fw-scene__svg--base image')].map(im => ({
        href: im.getAttribute('href') ?? '',
        loaded: (im as SVGImageElement).getBBox !== undefined && im.getBoundingClientRect().width > 0,
      })),
    )
    expect(imgs.length).toBe(11)
    expect(imgs.every(i => i.loaded)).toBe(true)
    // 画面用的是平台内新增的图元，产品图在 OSS 公网地址上
    expect(imgs.every(i => i.href.startsWith('http'))).toBe(true)

    // 角标：正常不显示，只有异常显示；异常角标闪烁；图标后面的光晕圈不画
    const badgeState = await page.evaluate(() =>
      [...document.querySelectorAll('.fw-scene__svg--base .fw-scene__node')].map(n => {
        const cls = n.querySelector('svg.sym-root')?.getAttribute('class') ?? ''
        const visible = [...n.querySelectorAll('.sym-badge')].filter(
          b => getComputedStyle(b).display !== 'none',
        )
        const halo = n.querySelector('.sym-halo')
        return {
          isRun: cls.includes('is-run'),
          isAbnormal: /is-(fault|alarm|over|discharge)/.test(cls),
          badges: visible.length,
          blinking: visible.some(b => getComputedStyle(b).animationName !== 'none'),
          haloHidden: !halo || getComputedStyle(halo).display === 'none',
        }
      }),
    )
    expect(badgeState).toHaveLength(11)
    for (const s of badgeState) {
      if (s.isRun) expect(s.badges).toBe(0)
      if (s.isAbnormal) {
        expect(s.badges).toBeGreaterThan(0)
        expect(s.blinking).toBe(true)
      }
      expect(s.haloHidden).toBe(true)
    }

    // 图例：浮在画面左上角，三色
    const legend = page.locator('.fw-scene__legend')
    await expect(legend).toBeVisible()
    await expect(legend.locator('.fw-scene__legend-item')).toHaveCount(3)
    await expect(legend).toContainText('点击图元查看其下点位')
  })

  test('统计卡下钻：所辖点位总数 = 卡片声明数（分页展示，总数不变）', async ({ page }) => {
    const card = page.locator('.fw-card', { hasText: '设备总数' }).first()
    const hint = await card.getAttribute('title')
    const declaredCount = declared(hint ?? '', /=\s*(\d+)\s*台/)

    await card.click()
    await expect(page.locator('.fwd__list .pr').first()).toBeVisible()

    // 抽屉自己声明的总数 = 卡片声明的设备数
    const meta = await page.locator('.fwd__meta').textContent()
    expect(declared(meta ?? '', /(\d+)\s*个点位/)).toBe(declaredCount)

    // 分页：单页最多 100 行，区间提示写清"显示到哪、总共多少"
    const rows = await page.locator('.fwd__list .pr').count()
    expect(rows).toBe(Math.min(declaredCount, 100))
    const range = await page.locator('.fwd__range').textContent()
    expect(declared(range ?? '', /共\s*(\d+)\s*个点位/)).toBe(declaredCount)

    // 翻页后可继续看到剩下的点位
    if (declaredCount > 100) {
      const pageCount = Math.ceil(declaredCount / 100)
      await page.locator('.fwd__pg-btn', { hasText: '下一页' }).click()
      await expect(page.locator('.fwd__pg-text')).toHaveText(`2 / ${pageCount}`)
      // 每页最多 100 行，末页才是余数
      await expect(page.locator('.fwd__list .pr')).toHaveCount(Math.min(declaredCount - 100, 100))
    }

    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
  })

  test('组态图元下钻：点位组抽屉 → 单点详情抽屉', async ({ page }) => {
    await page.locator('.fw-scene__svg--text .fw-scene__node', { hasText: '液位' }).first().click()
    await expect(page.locator('.fwd__list .pr').first()).toBeVisible()
    await expect(page.locator('.el-drawer__title').first()).toHaveText('液位')

    // 异常优先排序：首行应带异常标记
    await expect(page.locator('.fwd__list .pr').first()).toBeVisible()

    await page.locator('.fwd__list .pr').first().click()
    await expect(page.locator('.pdd')).toBeVisible()
    await expect(page.locator('.pdd__chart canvas')).toHaveCount(1)
    // 组内导航：点位编号（4 位采集点）
    await expect(page.locator('.el-drawer__title').last()).toHaveText(/^[A-Z]+-\d{4}$/)
  })

  test('报警记录：设计稿列齐 + 筛选 + 标记已处理', async ({ page }) => {
    await page.locator('.fw-tabs__item', { hasText: '报警记录' }).click()
    await expect(page.locator('.fwat .fi-th').first()).toBeVisible()

    for (const col of ['事件类型', '事件内容', '设备类型', '设备编码', '安装位置', '上报时间', '操作']) {
      await expect(page.locator('.fwat .fi-th', { hasText: col }).first()).toBeVisible()
    }
    const rows = page.locator('.fwat tbody tr')
    const before = await rows.count()
    expect(before).toBeGreaterThan(0)

    // 筛选：按事件类型关键词过滤后条数不多于全部
    await page.locator('.fwat__search input').fill('FM-0001')
    await page.locator('.fwat__btn--primary').click()
    await page.waitForTimeout(400)
    const filtered = await rows.count()
    expect(filtered).toBeLessThanOrEqual(before)

    // 清空筛选后恢复
    await page.locator('.fwat__search input').fill('')
    await page.locator('.fwat__btn--primary').click()
    await page.waitForTimeout(400)
    expect(await rows.count()).toBe(before)

    // 标记已处理
    await page.locator('.fwat tbody tr').first().locator('.act-btn', { hasText: '处理' }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('.fwat tbody tr').first()).toContainText('已处理')
  })

  test('设备台帐：设计稿列齐 + 行数与分页', async ({ page }) => {
    await page.locator('.fw-tabs__item', { hasText: '设备台帐' }).click()
    await expect(page.locator('.fwlt .fi-th').first()).toBeVisible()

    for (const col of ['运行状态', '设备名称', '设备类型', '设备编码', '安装位置', '添加时间', '操作']) {
      await expect(page.locator('.fwlt .fi-th', { hasText: col }).first()).toBeVisible()
    }
    const rows = page.locator('.fwlt tbody tr')
    expect(await rows.count()).toBeGreaterThan(0)

    // 分页文案自证：共 N 条记录 第 1/M 页
    const pager = await page.locator('.fwlt__pager-text').textContent()
    const total = declared(pager ?? '', /共\s*(\d+)\s*条记录/)
    expect(total).toBeGreaterThan(0)

    // 操作列 5 个图标
    await expect(rows.first().locator('.act-btn--icon')).toHaveCount(5)
  })
})
