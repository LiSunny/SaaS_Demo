/**
 * 消息通知 · 顶栏未读角标 / 抽屉三态（最近列表 → 全部列表 → 详情）
 *
 * 覆盖链路：
 * - 顶栏消息入口显示未读角标
 * - 点击消息图标 → 右侧抽屉（不再是浮层弹窗），卡片式最近列表
 * - 抽屉「全部」/ 底部「查看全部消息」→ **抽屉内**切到全部消息列表（不跳路由）
 * - 全部列表点行 → 抽屉内切详情态，详情与列表同宽，返回回到列表
 * - 独立列表页 /notifications：关键字过滤、状态过滤、排序、点行打开详情抽屉
 * - 抽屉详情态：Markdown / HTML 网页 / 表格 三种正文形态，上一条 / 下一条
 * - 进入详情即已读 → 顶栏角标相应减少
 *
 * 消息数据来自前端 localStorage（src/api/adapters/notification-dao.ts 的种子数据），
 * 每个 Playwright 用例独立 context，localStorage 互不影响。
 */
import { test, expect, type Page } from '@playwright/test'

/** e2e 后端端口（见 e2e/setup.mjs） */
const API = process.env.E2E_API ?? 'http://localhost:3202'

/** 平台方体验账号（prisma/seed.ts 写入测试库，systemRole=platform-ops） */
const USER = { phone: '13800000001', password: '3xkxr4' }

/** 种子消息总数（notification-dao 的 SEED_NOTIFICATIONS） */
const SEED_TOTAL = 7
/** 种子未读数（SEED_NOTIFICATIONS 中 read=false 的条数） */
const SEED_UNREAD = 5

/**
 * 写入登录态
 *
 * 用 addInitScript 而非 goto + evaluate：登录页 / 工作台等页面会并发请求后端接口，
 * 一旦某个接口返回 401，src/utils/request.ts 的拦截器会清掉 auth_token，
 * 与「goto 后再 evaluate 写入」存在竞态（token 刚写入就被 401 清掉）。
 * addInitScript 在每次导航前注入，登录态始终有效。
 */
async function login(page: Page) {
  const res = await page.request.post(`${API}/api/auth/login`, { data: USER })
  if (!res.ok()) throw new Error(`登录失败：${res.status()} ${await res.text()}`)
  const body = await res.json()
  const { token, user } = body.data

  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
      if (user.systemRole) localStorage.setItem('system-role', user.systemRole)
    },
    { token, user },
  )
}

/** 打开顶栏消息抽屉（列表态） */
async function openDrawer(page: Page) {
  await page.goto('/workbench')
  await page.waitForSelector('.msg-entry button')
  await page.click('.msg-entry button')
  await page.waitForSelector('.msg-notification-drawer .msg-card')
}

/** 在抽屉列表里点第 N 行（0 基）→ 进详情态 */
async function openDetailByRow(page: Page, rowIndex: number) {
  await page.locator('.msg-notification-drawer .msg-card').nth(rowIndex).click()
  await page.waitForSelector('.msg-notification-drawer .nd-title')
}

test.describe('消息通知', () => {
  test('顶栏消息入口显示未读角标', async ({ page }) => {
    await login(page)
    await page.goto('/workbench')
    await page.waitForSelector('.msg-entry button')

    const badge = page.locator('.msg-badge')
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText(String(SEED_UNREAD))
    // 角标红跟随项目危险红令牌（浅色主题 --danger: #DC2626），不用设计稿独立红
    await expect(badge).toHaveCSS('background-color', 'rgb(220, 38, 38)')
  })

  test('点击消息图标弹出抽屉（卡片式列表，非浮层弹窗）', async ({ page }) => {
    await login(page)
    await openDrawer(page)

    await expect(page.locator('.msg-drawer-title')).toHaveText('通知公告')
    await expect(page.locator('.msg-drawer-more')).toHaveText('全部')
    await expect(page.locator('.msg-drawer-foot-btn')).toHaveText('查看全部消息')
    await expect(page.locator('.msg-notification-drawer .msg-card')).toHaveCount(SEED_TOTAL)

    // 卡片版式：分类名 + 接收时间 + 未读红点 + 查看详情入口
    await expect(page.locator('.msg-notification-drawer .msg-card-cat-text').first()).toHaveText(/系统通知|系统消息/)
    await expect(page.locator('.msg-notification-drawer .msg-card-time').first()).toHaveText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
    await expect(page.locator('.msg-notification-drawer .msg-card-detail').first()).toHaveText('查看详情')

    // 旧的浮层弹窗不再存在
    await expect(page.locator('.msg-notification-popper')).toHaveCount(0)

    // 未读卡片带红点，已读卡片不带
    await expect(page.locator('.msg-notification-drawer .msg-dot')).toHaveCount(SEED_UNREAD)

    // 列表态无关闭图标按钮，只能靠 ESC / 点遮罩关闭
    await expect(page.locator('.msg-notification-drawer .msg-drawer-close')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(page.locator('.msg-notification-drawer')).toBeHidden()
  })

  test('抽屉「全部」切到全部消息列表（抽屉内，不跳路由）', async ({ page }) => {
    await login(page)
    await openDrawer(page)
    const urlBefore = page.url()

    await page.click('.msg-drawer-more')

    // 抽屉内切换到「消息通知列表」态，地址栏不变化
    await expect(page.locator('.msg-drawer-title')).toHaveText('消息通知列表')
    expect(page.url()).toBe(urlBefore)
    await expect(page.locator('.msg-notification-drawer .nf-table tbody tr')).toHaveCount(SEED_TOTAL)
    await expect(page.locator('.msg-notification-drawer .nf-table thead th')).toHaveText(['序号', '状态', '标题', '接收时间'])

    // 全部列表态同样无关闭图标按钮（只有返回）
    await expect(page.locator('.msg-notification-drawer .msg-drawer-close')).toHaveCount(0)
    await expect(page.locator('.msg-notification-drawer .msg-drawer-back')).toBeVisible()
  })

  test('抽屉底部「查看全部消息」同样切到全部列表态', async ({ page }) => {
    await login(page)
    await openDrawer(page)
    const urlBefore = page.url()

    await page.click('.msg-drawer-foot-btn')

    await expect(page.locator('.msg-drawer-title')).toHaveText('消息通知列表')
    expect(page.url()).toBe(urlBefore)
    await expect(page.locator('.msg-notification-drawer .nf-table')).toBeVisible()
  })

  test('全部列表点行进详情，详情与列表宽度一致，返回回到列表', async ({ page }) => {
    await login(page)
    await openDrawer(page)
    const drawer = page.locator('.msg-notification-drawer')

    // 最近列表态是窄抽屉
    await expect(drawer).toHaveCSS('width', '400px')

    await page.click('.msg-drawer-more')
    await page.waitForSelector('.msg-notification-drawer .nf-table tbody tr')
    // 抽屉变宽有动画，等宽度稳定后再取值
    await expect(drawer).toHaveCSS('width', '720px')
    const widthAll = (await drawer.boundingBox())?.width ?? 0

    await page.locator('.msg-notification-drawer .nf-row').first().click()
    await page.waitForSelector('.msg-notification-drawer .nd-title')
    await expect(drawer).toHaveCSS('width', '720px')

    // 详情与列表同宽
    const widthDetail = (await drawer.boundingBox())?.width ?? 0
    expect(widthDetail).toBe(widthAll)

    // 返回回到全部列表态
    await page.click('.msg-drawer-back')
    await expect(page.locator('.msg-drawer-title')).toHaveText('消息通知列表')
    await expect(page.locator('.msg-notification-drawer .nf-table')).toBeVisible()
  })

  test('列表页关键字过滤生效', async ({ page }) => {
    await login(page)
    await page.goto('/notifications')
    await page.waitForSelector('.nf-table tbody tr')

    await page.fill('.nf-search-input', '值守')
    await page.click('.nf-search-btn')

    await expect(page.locator('.nf-table tbody tr')).toHaveCount(1)
    await expect(page.locator('.nf-table tbody tr').first()).toContainText('第47周值守报告')
  })

  test('列表页状态过滤生效', async ({ page }) => {
    await login(page)
    await page.goto('/notifications')
    await page.waitForSelector('.nf-table tbody tr')

    await page.click('.nf-select')
    await page.locator('.el-select-dropdown__item', { hasText: '未读' }).click()

    await expect(page.locator('.nf-table tbody tr')).toHaveCount(SEED_UNREAD)
    await expect(page.locator('.nf-tag.is-unread')).toHaveCount(SEED_UNREAD)
  })

  test('列表页按接收时间排序', async ({ page }) => {
    await login(page)
    await page.goto('/notifications')
    await page.waitForSelector('.nf-table tbody tr')

    const firstBefore = await page.locator('.nf-table tbody tr').first().textContent()
    await page.click('.nf-col-time')
    await expect(page.locator('.nf-table tbody tr').first()).not.toHaveText(firstBefore || '')
  })

  test('列表页点行打开详情抽屉，并标记已读（角标减少）', async ({ page }) => {
    await login(page)
    await page.goto('/notifications')
    await page.waitForSelector('.nf-table tbody tr')

    await page.locator('.nf-row').first().click()
    await page.waitForSelector('.msg-notification-drawer .nd-title')

    // Markdown 正文渲染出标题层级
    await expect(page.locator('.nd-body .md-h1')).toHaveText('设备告警日志分析报告')
    await expect(page.locator('.nd-body .md-h2').first()).toBeVisible()

    // 顶栏角标减 1（进入详情即已读）
    await expect(page.locator('.msg-badge')).toHaveText(String(SEED_UNREAD - 1))
  })

  test('抽屉详情支持表格形态正文', async ({ page }) => {
    await login(page)
    await openDrawer(page)
    // 倒数第 1 条 = 最早的消息（第47周值守报告，表格形态）
    await openDetailByRow(page, SEED_TOTAL - 1)

    await expect(page.locator('.notification-content table')).toBeVisible()
    await expect(page.locator('.notification-content th').first()).toHaveText('日期')
  })

  test('抽屉详情支持 HTML 网页形态正文', async ({ page }) => {
    await login(page)
    await openDrawer(page)
    // 第 2 条 = 安全态势周报（HTML 形态）
    await openDetailByRow(page, 1)

    await expect(page.locator('.notification-content iframe')).toHaveCount(1)
  })

  test('抽屉详情上一条 / 下一条在头部，最早一条「上一条」禁用', async ({ page }) => {
    await login(page)
    await openDrawer(page)
    await openDetailByRow(page, SEED_TOTAL - 1)

    // 详情态头部：返回（主色）+ 标题 + 上一条/下一条；不再有独立关闭按钮
    await expect(page.locator('.msg-notification-drawer .msg-drawer-title')).toHaveText('消息详情')
    await expect(page.locator('.msg-notification-drawer .msg-drawer-close')).toHaveCount(0)
    await expect(page.locator('.msg-notification-drawer .msg-drawer-back')).toHaveCSS(
      'color',
      'rgb(54, 120, 227)',
    )

    const prevBtn = page.locator('.msg-nav-btn.is-prev')
    const nextBtn = page.locator('.msg-nav-btn.is-next')
    await expect(prevBtn).toBeDisabled()
    await expect(nextBtn).toBeEnabled()

    // 导航在固定头部，不在正文里
    await expect(page.locator('.msg-notification-drawer .nd-nav')).toHaveCount(0)

    await nextBtn.click()
    await expect(page.locator('.nd-title')).toHaveText('第47周巡检报表')
  })

  test('抽屉详情可返回列表态', async ({ page }) => {
    await login(page)
    await openDrawer(page)
    await openDetailByRow(page, 0)

    await page.click('.msg-drawer-back')
    await page.waitForSelector('.msg-notification-drawer .msg-card')
    await expect(page.locator('.msg-drawer-title')).toHaveText('通知公告')
  })
})
