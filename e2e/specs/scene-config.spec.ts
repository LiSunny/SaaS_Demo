/**
 * 组态配置（P1）
 *
 * 覆盖「设备设施管理 › 规则配置 › 组态配置」的新增 → 编辑器 → 图元管理全链路：
 * - 列表页渲染（列头 + 新增按钮）
 * - 新增弹窗 → 进入编辑器
 * - 画布放置图元、改属性
 * - 草稿刷新恢复
 * - 导入 JSON 后画布尺寸跟随画面 width/height
 * - 图元管理入口 → 两级分类（系统 / 部件类别）
 *
 * 计数断言一律用「页面自己声明的数字」互相校验（标题声明数 = 实际渲染数），
 * 不写死图元总数，新增图元时本用例不必改。
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

/** 从「共 46 个图元 / 4 个系统 / 14 个分类」这类标题文案里取数字 */
function declared(text: string | null, label: string) {
  const m = text?.match(new RegExp(`(\\d+)\\s*个${label}`))
  if (!m) throw new Error(`标题里找不到「个${label}」：${text}`)
  return Number(m[1])
}

test.describe('组态配置（P1）', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('列表页渲染 + 新增进入编辑器 + 放置图元 + 草稿恢复', async ({ page }) => {
    // ===== 列表页 =====
    await page.goto('/device-facility/rule/scene-config')
    await expect(page.locator('.content-card')).toBeVisible()
    await expect(page.getByRole('button', { name: '新增组态' })).toBeVisible()
    for (const col of ['画面名称', '归属系统', '图元数', '连线数', '更新时间']) {
      await expect(page.locator('.fi-th', { hasText: col }).first()).toBeVisible()
    }

    // ===== 新增 → 弹窗 → 编辑器 =====
    await page.getByRole('button', { name: '新增组态' }).click()
    await expect(page.locator('.el-dialog')).toBeVisible()
    await page.locator('.el-dialog input[placeholder="请输入画面名称"]').fill('e2e 消防给水总貌')
    await page.locator('.el-dialog').getByRole('button', { name: '确定' }).click()
    await expect(page).toHaveURL(/\/device-facility\/rule\/scene-config\/[^/]+\/editor$/)

    // ===== 编辑器三区 =====
    await expect(page.locator('.scene-canvas__svg')).toBeVisible()
    await expect(page.locator('.sym-picker')).toBeVisible()
    await expect(page.locator('.prop-panel')).toBeVisible()

    // ===== 图元库两级分类：一级系统标签 + 二级部件类别 =====
    const sysTabs = page.locator('.sym-picker__sys')
    await expect(sysTabs).toHaveCount(5) // 全部 + 4 个系统
    await expect(sysTabs.first()).toHaveText('全部')
    // 各分类计数之和 = 图元总数（无漏挂分类、无空分类）
    const pickerTotal = Number((await page.locator('.sym-picker__count').textContent())?.match(/(\d+)/)?.[1])
    const catSum = (await page.locator('.sym-picker__cat-count').allTextContents()).reduce(
      (n, t) => n + Number(t),
      0,
    )
    expect(catSum).toBe(pickerTotal)
    await expect(page.locator('.sym-picker__item')).toHaveCount(pickerTotal)

    // ===== 放置图元 =====
    await page.locator('.sym-picker__item').first().click()
    await expect(page.locator('.scene-canvas__status').first()).toContainText('模式：放置')
    await page.locator('.scene-canvas__svg').click({ position: { x: 300, y: 220 } })
    await expect(page.locator('.scene-node')).toHaveCount(1)

    // ===== 属性面板改标签 → 画布同步 =====
    await page.locator('.prop-panel .el-input__inner').first().fill('e2e 水池')
    await expect(page.locator('.scene-node__label').first()).toHaveText('e2e 水池')

    // ===== 草稿刷新恢复 =====
    await page.reload()
    await expect(page.locator('.scene-node')).toHaveCount(1)
    await expect(page.locator('.scene-node__label').first()).toHaveText('e2e 水池')
  })

  test('导入 JSON 后画布尺寸跟随画面 width/height', async ({ page }) => {
    await page.goto('/device-facility/rule/scene-config')
    await page.getByRole('button', { name: '新增组态' }).click()
    await page.locator('.el-dialog input[placeholder="请输入画面名称"]').fill('e2e 导入尺寸')
    await page.locator('.el-dialog').getByRole('button', { name: '确定' }).click()
    await expect(page).toHaveURL(/\/editor$/)

    const svg = page.locator('.scene-canvas__svg')
    await expect(svg).toHaveAttribute('viewBox', '0 0 1200 700')

    // 取一个真实图元 ID，避免写死
    const title = (await page.locator('.sym-picker__item').first().getAttribute('title')) ?? ''
    const symbol = title.split(' · ')[0]
    expect(symbol).not.toBe('')

    // 导入一张 1400×920 的画面
    const payload = {
      version: 1,
      name: 'e2e 气体灭火导入',
      width: 1400,
      height: 920,
      nodes: [{ id: 'n1', symbol, x: 120, y: 840, size: 60 }],
      edges: [],
    }
    await page.locator('.scene-editor__file').setInputFiles({
      name: 'gas.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(payload)),
    })
    await expect(page.locator('.el-message--success', { hasText: '已导入' })).toBeVisible()
    await expect(svg).toHaveAttribute('viewBox', '0 0 1400 920')
    await expect(page.locator('.scene-node')).toHaveCount(1)
  })

  test('图元管理入口：两级分类与数量自洽，图片版与线框版都可渲染', async ({ page }) => {
    await page.goto('/device-facility/rule/symbol-library')

    // 标题声明的图元数 / 分类数 / 系统数 = 实际渲染数
    const desc = await page.locator('.symbol-page__desc').textContent()
    const total = declared(desc, '图元')
    const sysCount = declared(desc, '系统')
    const catCount = declared(desc, '分类')
    await expect(page.locator('.symbol-page__card')).toHaveCount(total)
    await expect(page.locator('.symbol-page__sys-btn')).toHaveCount(sysCount + 1) // + 全部
    await expect(page.locator('.symbol-page__cat')).toHaveCount(catCount + 1) // + 全部分类

    // 分类计数之和 = 图元总数（每个图元恰好属于一个分类）
    const catCounts = await page.locator('.symbol-page__cat .symbol-page__cat-count').allTextContents()
    expect(catCounts.slice(1).reduce((n, t) => n + Number(t), 0)).toBe(total)
    // 系统计数之和 = 图元总数（每个图元恰好归属一个系统）
    const sysCounts = await page.locator('.symbol-page__sys-btn .symbol-page__cat-count').allTextContents()
    expect(sysCounts.slice(1).reduce((n, t) => n + Number(t), 0)).toBe(total)

    await expect(page.locator('.symbol-page__card svg.sym-root').first()).toBeVisible()

    // 切线框版后仍能渲染
    await page.getByRole('button', { name: '图片版' }).click()
    await expect(page.locator('.symbol-page__card svg.sym-root').first()).toHaveAttribute('data-style', 'line')
  })

  test('编辑器内「图元管理」入口可跳转', async ({ page }) => {
    await page.goto('/device-facility/rule/scene-config')
    await page.getByRole('button', { name: '新增组态' }).click()
    await page.locator('.el-dialog input[placeholder="请输入画面名称"]').fill('e2e 入口')
    await page.locator('.el-dialog').getByRole('button', { name: '确定' }).click()
    await expect(page).toHaveURL(/\/editor$/)

    await page.locator('.sym-picker__manage').click()
    await expect(page).toHaveURL(/\/device-facility\/rule\/symbol-library/)
    const total = declared(await page.locator('.symbol-page__desc').textContent(), '图元')
    await expect(page.locator('.symbol-page__card')).toHaveCount(total)

    // 返回编辑器 → 回到同一画面的编辑器
    await page.getByRole('button', { name: '返回编辑器' }).click()
    await expect(page).toHaveURL(/\/device-facility\/rule\/scene-config\/[^/]+\/editor$/)
  })
})
