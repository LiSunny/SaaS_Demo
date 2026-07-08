/**
 * P0: 登录页 & 路由守卫 测试用例
 *
 * 验证 AI 生成代码中最容易出错的部分：
 * - JWT token 存储与读取
 * - localStorage 操作
 * - 路由 beforeEach 重定向逻辑
 * - 表单校验
 */
import { test, expect } from '@playwright/test'
import { loginAsAdmin, clearAuth, ADMIN } from '../../fixtures/auth'

test.describe('登录页 & 路由守卫（P0）', () => {

  // =============================================
  // P0-1: 未登录 → 重定向到 /login
  // =============================================
  test('未登录用户访问 /workbench 应重定向到 /login', async ({ page }) => {
    await page.goto('/workbench')
    await expect(page).toHaveURL(/\/login/)
  })

  // =============================================
  // P0-2: 登录页应显示体验账号卡片
  // =============================================
  test('登录页应渲染 4 个体验账号卡片', async ({ page }) => {
    await page.goto('/login')
    const demoRoles = ['平台管理', '运营管理', '企业管理', '普通用户']
    for (const role of demoRoles) {
      await expect(page.getByText(role).first()).toBeVisible()
    }
  })

  // =============================================
  // P0-3: 默认运营管理账号手动登录
  // =============================================
  test('使用默认运营管理账号登录后跳转到工作台', async ({ page }) => {
    await loginAsAdmin(page)
    // 验证登录态持续（刷新后仍在）
    await page.reload()
    await expect(page).toHaveURL('/workbench')
  })

  // =============================================
  // P0-4: platform-ops 角色用户可访问平台运营各页面
  // =============================================
  const platformOpsPages = [
    { name: '工作台', url: '/workbench', content: '.dashboard-shell' },
    { name: '租户管理 - 企业列表', url: '/admin/enterpriseManagement/index', content: '.list-page' },
    { name: '用户管理 - 用户列表', url: '/admin/users', content: '.list-page' },
    { name: '岗位管理 - 岗位列表', url: '/admin/positions', content: '.list-page' },
    { name: '流程管理 - 流程模版', url: '/system/template', content: '.list-page' },
  ]

  for (const pageInfo of platformOpsPages) {
    test(`platform-ops 角色用户可访问「${pageInfo.name}」`, async ({ page }) => {

      await loginAsAdmin(page)

      // 导航到目标页面，路由守卫不应重定向（否则说明无访问权限）
      await page.goto(pageInfo.url)
      await expect(page).toHaveURL(new RegExp(`^${pageInfo.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))

      // 验证页面内容已渲染
      await expect(page.locator(pageInfo.content).first()).toBeVisible({ timeout: 8000 })
    })
  }

  // =============================================
  // P0-5: 登录后重定向回原始目标页面
  // =============================================
  test('登录后应重定向回原始请求的页面', async ({ page }) => {

    // 先访问受保护页面（会带 redirect 参数跳到 /login）
    await page.goto('/admin/enterpriseManagement/index')
    await expect(page).toHaveURL(/\/login\?redirect=/)

    // 登录
    await page.locator('input[placeholder="请输入手机号"]').fill(ADMIN.phone)
    await page.locator('input[type="password"]').fill(ADMIN.password)
    await page.locator('button:has-text("开始体验")').click()

    // 验证重定向回原始目标，而非固定跳到 /workbench
    await expect(page).toHaveURL(/\/admin\/enterpriseManagement\/index/, { timeout: 10000 })
  })

  // =============================================
  // P0-6: 已登录用户访问 /login → 重定向到 /workbench
  // =============================================
  test('已登录用户访问 /login 应跳转到 /workbench', async ({ page }) => {
    await loginAsAdmin(page)
    // 再去 /login
    await page.goto('/login')
    await expect(page).toHaveURL('/workbench')
  })

  // =============================================
  // P0-7: 空表单校验
  // =============================================
  test('空表单点击登录应显示校验错误', async ({ page }) => {
    await page.goto('/login')
    await page.locator('button:has-text("开始体验")').click()
    // Element Plus 会显示表单校验错误
    await expect(page.locator('.el-form-item__error').first()).toBeVisible({ timeout: 3000 })
  })

  // =============================================
  // P0-8: 错误密码提示
  // =============================================
  test('输入错误密码应显示错误提示', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[placeholder="请输入手机号"]').fill(ADMIN.phone)
    await page.locator('input[type="password"]').fill('wrong_password_123')
    await page.locator('button:has-text("开始体验")').click()

    // 错误消息：可能是 .login-error 文本或 ElMessage 弹层
    const errorIndicator = page.locator('.login-error, .el-message--error, .el-message').first()
    await expect(errorIndicator).toBeVisible({ timeout: 8000 })
  })

  // =============================================
  // P0-9: 退出登录后不可访问受保护页面
  // =============================================
  test('清除登录态后访问 /workbench 应重定向到 /login', async ({ page }) => {
    await loginAsAdmin(page)
    await clearAuth(page)

    // 清除后导航
    await page.goto('/workbench')
    await expect(page).toHaveURL(/\/login/)
  })
})
