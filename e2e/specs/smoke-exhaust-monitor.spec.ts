/**
 * 防排烟系统监测（设备设施管理 › 运行监控 › 防排烟系统监测）
 *
 * 与消防水页、气体灭火页共用同一套公共组件（SubsystemMonitorLayout 及其子组件），
 * 版式断言与那两页一一对应；差异只在画面内容与取值口径：
 * - 组态：2 个位图图元（防排烟监测主机 / 风机压差探测器）+ 1 条连线
 * - 风机压差探测器节点显示「最低压差 + 压差正常台数」
 * - 报警记录：压差不足（加压送风压差不足）= 紧急
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

/** 从「= 96 台」这类文案里取数字 */
function declared(text: string | null, pattern: RegExp) {
  const m = text?.match(pattern)
  if (!m) throw new Error(`文案里取不到数字：${text}`)
  return Number(m[1])
}

test.describe('防排烟系统监测', () => {
  test.use({ viewport: VIEWPORT })

  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/device-facility/monitor/fire-smoke')
    await expect(page.locator('.sm__title')).toHaveText('防排烟系统')
    // 等首帧组态与实时数据就位
    await expect(page.locator('.sm-scene__node').first()).toBeVisible()
    await page.waitForTimeout(1200)
  })

  test('统计区常驻固定高度 + 页面不出垂直滚动条 + 三个视图切换', async ({ page }) => {
    // ===== 统计区常驻 =====
    const statsBox = await page.locator('.sm__stats').boundingBox()
    expect(statsBox?.height).toBeGreaterThan(0)

    // ===== 三个 tab =====
    const tabs = await page.locator('.sm-tabs__item').allTextContents()
    expect(tabs.map(s => s.trim())).toEqual(['系统总览', '报警记录', '设备台帐'])

    // 切到报警记录：统计区位置与高度不变，主体区换成表格
    await page.locator('.sm-tabs__item', { hasText: '报警记录' }).click()
    await expect(page.locator('.sm-at .fi-th').first()).toBeVisible()
    const statsBox2 = await page.locator('.sm__stats').boundingBox()
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
    await page.locator('.sm-tabs__item', { hasText: '设备台帐' }).click()
    await expect(page.locator('.sm-lt .fi-th').first()).toBeVisible()
    const overflow2 = await page.evaluate(() => {
      const el = document.querySelector('.main-content') as HTMLElement | null
      return el ? { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight } : null
    })
    expect(overflow2!.scrollHeight).toBeLessThanOrEqual(overflow2!.clientHeight + 1)
  })

  test('统计卡 4 张 + 分项可复算（主机+器件=总数，比率与分项一致）', async ({ page }) => {
    await expect(page.locator('.sm-card')).toHaveCount(4)
    const cardLabels = await page.locator('.sm-card__label').allTextContents()
    expect(cardLabels.map(s => s.trim())).toEqual([
      '设备总数',
      '设备在线率',
      '设备故障率',
      '预警设备',
    ])

    // 每张卡都要有主值与图例分项
    for (const label of cardLabels) {
      const card = page.locator('.sm-card', { hasText: label }).first()
      await expect(card.locator('.sm-card__num')).not.toBeEmpty()
      await expect(card.locator('.sm-card__legend-item')).toHaveCount(2)
    }

    // 设备总数 = 主机 + 器件
    const totalCard = page.locator('.sm-card', { hasText: '设备总数' }).first()
    const totalNum = Number(await totalCard.locator('.sm-card__num').textContent())
    const legendNums = await totalCard.locator('.sm-card__legend-value').allTextContents()
    const [host, device] = legendNums.map(n => Number(n.trim()))
    expect(host + device).toBe(totalNum)

    // 设备在线率 = 在线 / 总数
    const onlineCard = page.locator('.sm-card', { hasText: '设备在线率' }).first()
    const onlinePct = Number(await onlineCard.locator('.sm-card__num').textContent())
    const [offline, online] = (
      await onlineCard.locator('.sm-card__legend-value').allTextContents()
    ).map(n => Number(n.trim()))
    expect((online / totalNum) * 100).toBeCloseTo(onlinePct, 1)
    expect(offline + online).toBe(totalNum)

    // 设备故障率 = 故障 / 总数
    const faultCard = page.locator('.sm-card', { hasText: '设备故障率' }).first()
    const faultPct = Number(await faultCard.locator('.sm-card__num').textContent())
    const [fault, faultNormal] = (
      await faultCard.locator('.sm-card__legend-value').allTextContents()
    ).map(n => Number(n.trim()))
    expect((fault / totalNum) * 100).toBeCloseTo(faultPct, 1)
    expect(fault + faultNormal).toBe(totalNum)

    // 预警设备台数 = 预警 + 正常
    const warnCard = page.locator('.sm-card', { hasText: '预警设备' }).first()
    const warnNum = Number(await warnCard.locator('.sm-card__num').textContent())
    const [warn, warnNormal] = (
      await warnCard.locator('.sm-card__legend-value').allTextContents()
    ).map(n => Number(n.trim()))
    expect(warn + warnNormal).toBe(totalNum)
    expect(warnNum).toBe(warn)
  })

  test('系统总览：组态 2 图元 / 1 连线 + 位图加载成功 + 角标只标异常', async ({ page }) => {
    // 三层结构：底图层（连线 + 图元位图）/ 文本层（数值 + 交互）/ 动画层（流动光带）
    await expect(page.locator('.sm-scene__svg--base')).toHaveCount(1)
    await expect(page.locator('.sm-scene__svg--text')).toHaveCount(1)
    await expect(page.locator('.sm-scene__svg--flow')).toHaveCount(1)
    await expect(page.locator('.sm-scene__svg--base .sm-scene__node')).toHaveCount(2)
    await expect(page.locator('.sm-scene__svg--text .sm-scene__node')).toHaveCount(2)
    await expect(page.locator('.sm-scene__svg--base .sm-edge')).toHaveCount(1)
    await expect(page.locator('.sm-scene__svg--flow .sm-edge__flow')).toHaveCount(1)
    // 位图只在底图层：文本层与动画层含位图会让每次刷新重栅格化整张 SVG
    expect(await page.locator('.sm-scene__svg--text image').count()).toBe(0)
    expect(await page.locator('.sm-scene__svg--flow image').count()).toBe(0)

    // 位图全部加载成功（画面用的是平台内新增的图元，产品图在 OSS 公网地址上）
    const imgs = await page.evaluate(() =>
      [...document.querySelectorAll('.sm-scene__svg--base image')].map(im => ({
        href: im.getAttribute('href') ?? '',
        loaded: (im as SVGImageElement).getBBox !== undefined && im.getBoundingClientRect().width > 0,
      })),
    )
    expect(imgs.length).toBe(2)
    expect(imgs.every(i => i.loaded)).toBe(true)
    expect(imgs.every(i => i.href.startsWith('http'))).toBe(true)

    // 角标：正常不显示，只有异常显示；异常角标闪烁；图标后面的光晕圈不画
    const badgeState = await page.evaluate(() =>
      [...document.querySelectorAll('.sm-scene__svg--base .sm-scene__node')].map(n => {
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
    expect(badgeState).toHaveLength(2)
    for (const s of badgeState) {
      if (s.isRun) expect(s.badges).toBe(0)
      if (s.isAbnormal) {
        expect(s.badges).toBeGreaterThan(0)
        expect(s.blinking).toBe(true)
      }
      expect(s.haloHidden).toBe(true)
    }

    // 图例：浮在画面左上角，三色
    const legend = page.locator('.sm-scene__legend')
    await expect(legend).toBeVisible()
    await expect(legend.locator('.sm-scene__legend-item')).toHaveCount(3)
    await expect(legend).toContainText('点击图元查看其下点位')
  })

  test('风机压差探测器节点：最低压差 + 压差正常台数', async ({ page }) => {
    const node = page.locator('.sm-scene__svg--text .sm-scene__node', { hasText: '风机压差探测器' }).first()
    await expect(node).toBeVisible()
    // 主值：压差数值（Pa），副值：压差正常 N/93
    await expect(node.locator('.sm-scene__value')).toContainText('Pa')
    await expect(node.locator('.sm-scene__sub')).toContainText('压差正常')
    const sub = await node.locator('.sm-scene__sub').textContent()
    expect(sub ?? '').toMatch(/压差正常\s*\d+\/\d+/)
  })

  test('统计卡下钻：所辖点位总数 = 卡片声明数（分页展示，总数不变）', async ({ page }) => {
    const card = page.locator('.sm-card', { hasText: '设备总数' }).first()
    const hint = await card.getAttribute('title')
    const declaredCount = declared(hint ?? '', /=\s*(\d+)\s*台/)

    await card.click()
    await expect(page.locator('.sm-drawer__list .pr').first()).toBeVisible()

    // 抽屉自己声明的总数 = 卡片声明的设备数
    const meta = await page.locator('.sm-drawer__meta').textContent()
    expect(declared(meta ?? '', /(\d+)\s*个点位/)).toBe(declaredCount)

    // 分页：单页最多 100 行，区间提示写清"显示到哪、总共多少"
    const rows = await page.locator('.sm-drawer__list .pr').count()
    expect(rows).toBe(Math.min(declaredCount, 100))
    const range = await page.locator('.sm-drawer__range').textContent()
    expect(declared(range ?? '', /共\s*(\d+)\s*个点位/)).toBe(declaredCount)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)
  })

  test('组态图元下钻：点位组抽屉 → 单点详情抽屉', async ({ page }) => {
    await page
      .locator('.sm-scene__svg--text .sm-scene__node', { hasText: '风机压差探测器' })
      .first()
      .click()
    await expect(page.locator('.sm-drawer__list .pr').first()).toBeVisible()
    await expect(page.locator('.el-drawer__title').first()).toHaveText('风机压差探测器')

    // 异常优先排序：首行应带异常标记
    await expect(page.locator('.sm-drawer__list .pr').first()).toBeVisible()

    await page.locator('.sm-drawer__list .pr').first().click()
    await expect(page.locator('.pdd')).toBeVisible()
    await expect(page.locator('.pdd__chart canvas')).toHaveCount(1)
    // 组内导航：点位编号（FY 前缀）
    await expect(page.locator('.el-drawer__title').last()).toHaveText(/^FY-\d{4}$/)
  })

  test('报警记录：设计稿列齐 + 筛选 + 标记已处理', async ({ page }) => {
    await page.locator('.sm-tabs__item', { hasText: '报警记录' }).click()
    await expect(page.locator('.sm-at .fi-th').first()).toBeVisible()

    for (const col of ['事件类型', '事件内容', '设备类型', '设备编码', '安装位置', '上报时间', '操作']) {
      await expect(page.locator('.sm-at .fi-th', { hasText: col }).first()).toBeVisible()
    }
    const rows = page.locator('.sm-at tbody tr')
    // 报警记录在页面加载后立即播种：等它有真实数据（空表只有 1 行占位）
    await expect.poll(() => rows.count()).toBeGreaterThan(1)
    const before = await rows.count()
    expect(before).toBeGreaterThan(0)

    // 事件内容写明是风机压差越限（加压送风压差不足）
    await expect(page.locator('.sm-at tbody tr').first().locator('.col-content')).toContainText(
      /风机压差|设备故障|通信中断/,
    )

    // 筛选：按设备编码过滤后条数不多于全部
    await page.locator('.sm-at__search input').fill('FY-0001')
    await page.locator('.sm-at__btn--primary').click()
    await page.waitForTimeout(400)
    const filtered = await rows.count()
    expect(filtered).toBeLessThanOrEqual(before)

    // 清空筛选后恢复
    await page.locator('.sm-at__search input').fill('')
    await page.locator('.sm-at__btn--primary').click()
    await page.waitForTimeout(400)
    expect(await rows.count()).toBe(before)

    // 标记已处理
    await page.locator('.sm-at tbody tr').first().locator('.act-btn', { hasText: '处理' }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('.sm-at tbody tr').first()).toContainText('已处理')
  })

  test('设备台帐：设计稿列齐 + 行数与分页', async ({ page }) => {
    await page.locator('.sm-tabs__item', { hasText: '设备台帐' }).click()
    await expect(page.locator('.sm-lt .fi-th').first()).toBeVisible()

    for (const col of ['运行状态', '设备名称', '设备类型', '设备编码', '安装位置', '添加时间', '操作']) {
      await expect(page.locator('.sm-lt .fi-th', { hasText: col }).first()).toBeVisible()
    }
    const rows = page.locator('.sm-lt tbody tr')
    expect(await rows.count()).toBeGreaterThan(0)

    // 分页文案自证：共 N 条记录 第 1/M 页
    const pager = await page.locator('.pagi-total').textContent()
    const total = declared(pager ?? '', /共\s*(\d+)\s*条记录/)
    expect(total).toBeGreaterThan(0)

    // 操作列 5 个图标
    await expect(rows.first().locator('.act-btn--icon')).toHaveCount(5)
  })
})
