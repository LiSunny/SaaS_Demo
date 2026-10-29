/**
 * P1: 小安助手入口徽章（后台顶栏 · 平台名称右侧）
 *
 * 锁住的行为：
 * - 已登录时后台顶栏出现「小安助手」胶囊徽章，且紧邻平台名称
 * - 徽章是 target=_blank 链接到 /agent（新标签打开，不替换后台当前页）
 * - 未登录时（登录页）不渲染徽章
 */
import { test, expect, type Page } from '@playwright/test'
import { ADMIN } from '../fixtures/auth'

/**
 * API 基址：默认 3202（playwright globalSetup 启动的测试后端）。
 * 复用已在运行的本地服务时可覆盖：E2E_API_BASE=http://localhost:3201
 */
const API_BASE = process.env.E2E_API_BASE || 'http://localhost:3202'

/** 通过 API 拿 token 写入 localStorage，跳过登录页 */
async function setupAuth(page: Page) {
  const res = await page.request.post(`${API_BASE}/api/auth/login`, {
    data: { phone: ADMIN.phone, password: ADMIN.password },
  })
  if (!res.ok()) throw new Error(`API 登录失败: ${res.status()} ${await res.text()}`)
  const { token, user } = (await res.json()).data

  await page.goto('/')
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
      if (user.systemRole) localStorage.setItem('system-role', user.systemRole)
    },
    { token, user }
  )
}

/** 清除登录态 */
async function clearAuth(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('system-role')
  })
}

test.describe('小安助手入口徽章（P1）', () => {

  test('已登录时平台名称右侧显示小安助手徽章', async ({ page }) => {
    await setupAuth(page)
    await page.goto('/workbench')

    const badge = page.locator('.agent-badge')
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText(/小安助手/)

    // 徽章紧邻平台名称右侧（x 方向起点在名称之后，纵向同一行）
    const nameBox = await page.locator('.company-name').boundingBox()
    const badgeBox = await badge.boundingBox()
    expect(nameBox).not.toBeNull()
    expect(badgeBox).not.toBeNull()
    expect(badgeBox!.x).toBeGreaterThanOrEqual(nameBox!.x + nameBox!.width)
    expect(Math.abs(badgeBox!.y + badgeBox!.height / 2 - (nameBox!.y + nameBox!.height / 2))).toBeLessThan(8)
  })

  test('徽章在新标签页打开 /agent，后台当前页保持不变', async ({ page, context }) => {
    await setupAuth(page)
    await page.goto('/workbench')
    const before = page.url()

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('.agent-badge').click(),
    ])
    await popup.waitForLoadState('domcontentloaded')
    expect(popup.url()).toContain('/agent')
    await expect(popup.locator('.brand-name')).toHaveText(/小安助手/)

    // 原页面未被替换
    expect(page.url()).toBe(before)
  })

  test('未登录时不渲染徽章', async ({ page }) => {
    await clearAuth(page)
    await page.goto('/login')
    await expect(page.locator('.agent-badge')).toHaveCount(0)
  })

  test('徽章内机器人头像完整显示且与文字中线对齐', async ({ page }) => {
    await setupAuth(page)
    await page.goto('/workbench')

    const robot = page.locator('.agent-badge-robot')
    await expect(robot).toBeVisible()
    // 位图加载成功（naturalWidth > 0 表示解码完成）
    await expect
      .poll(() => robot.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true)

    // 头像方框中心与文字中线同高（视觉中心对齐）
    const [chipBox, textBox] = await Promise.all([
      page.locator('.agent-badge-icon').boundingBox(),
      page.locator('.agent-badge-text').boundingBox(),
    ])
    expect(Math.abs(chipBox!.y + chipBox!.height / 2 - (textBox!.y + textBox!.height / 2))).toBeLessThan(1)
  })

  test('按钮上有由左至右的扫描光动画', async ({ page }) => {
    await setupAuth(page)
    await page.goto('/workbench')

    // 扫描光以 ::after 形式挂在按钮上，animationName 存在且处于 running
    const anim = await page.locator('.agent-badge').evaluate((el) => {
      const list = el.getAnimations({ subtree: true } as any)
      return list.map((a: any) => ({ name: a.animationName, state: a.playState }))
    })
    const scan = anim.find((a) => a.name?.includes('agent-badge-scan'))
    expect(scan).toBeTruthy()
    expect(scan!.state).toBe('running')

    // 光带位置单调递减 → 由左向右扫过
    const positions = await page.locator('.agent-badge').evaluate(async (el) => {
      const out: number[] = []
      for (let i = 0; i < 5; i++) {
        const cs = getComputedStyle(el, '::after')
        out.push(parseFloat(cs.backgroundPosition.split(' ')[0]))
        await new Promise((r) => setTimeout(r, 400))
      }
      return out
    })
    const desc = positions.every((v, i) => i === 0 || v <= positions[i - 1])
    expect(desc).toBe(true)
  })

})
