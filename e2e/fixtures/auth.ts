/**
 * 登录辅助函数
 * 提供两种方式：
 * 1. loginAsAdmin(page) — 通过 UI 登录（测试登录页面本身）
 * 2. setupAuthViaApi(page) — 通过 API 获取 token 并设置 localStorage（跳过登录页，提升性能）
 */
import { Page } from '@playwright/test'

/** 默认管理员凭证（由 ensureDefaultAdmin() 在服务启动时自动创建） */
const ADMIN = {
  phone: '13800000001',
  password: '3xkxr4',
  realName: '测试运营',
  systemRole: 'platform-ops',
}

/**
 * 通过登录页 UI 登录（测试登录页面功能时使用）
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.locator('input[placeholder="请输入手机号"]').fill(ADMIN.phone)
  await page.locator('input[type="password"]').fill(ADMIN.password)
  await page.locator('button:has-text("开始体验")').click()
  await page.waitForURL('/workbench', { timeout: 10000 })
}

/**
 * 直接通过 API 设置登录态，跳过登录页面
 * 用于后续测试套件（企业 CRUD、用户 CRUD 等）提升性能
 */
export async function setupAuthViaApi(page: Page) {
  const res = await page.request.post('http://localhost:3202/api/auth/login', {
    data: { phone: ADMIN.phone, password: ADMIN.password },
  })
  if (!res.ok()) {
    throw new Error(`API 登录失败: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  const { token, user } = body.data

  await page.goto('/')
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
      if (user.systemRole) {
        localStorage.setItem('system-role', user.systemRole)
      }
    },
    { token, user }
  )
}

/** 清除登录态 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('system-role')
  })
}

export { ADMIN }
