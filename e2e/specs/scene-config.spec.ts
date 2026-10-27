/**
 * 组态配置（P1）
 *
 * 覆盖「设备设施管理 › 规则配置 › 组态配置」的新增 → 编辑器 → 图元管理全链路：
 * - 列表页渲染（列头 + 新增按钮）
 * - 新增弹窗 → 进入编辑器
 * - 画布放置图元、改属性
 * - 草稿刷新恢复
 * - 图元管理入口 → 27 图元 / 8 分类
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
    // 图元库按 8 个分类折叠
    await expect(page.locator('.sym-picker__cat-head')).toHaveCount(8)

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

  test('图元管理入口：27 图元 / 8 分类，图片版与线框版都可渲染', async ({ page }) => {
    await page.goto('/device-facility/rule/symbol-library')
    await expect(page.locator('.symbol-page__card')).toHaveCount(27)
    await expect(page.locator('.symbol-page__cat')).toHaveCount(9) // 全部 + 8 个分类
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
    await expect(page.locator('.symbol-page__card')).toHaveCount(27)

    // 返回编辑器 → 回到同一画面的编辑器
    await page.getByRole('button', { name: '返回编辑器' }).click()
    await expect(page).toHaveURL(/\/device-facility\/rule\/scene-config\/[^/]+\/editor$/)
  })
})
