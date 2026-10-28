/**
 * 图元管理 · 自定义图元增删
 *
 * 覆盖平台内新增图元的完整闭环：
 * - 服务端新增自定义图元（API 直写，避免依赖 OSS 上传）
 * - 图元管理页出现该图元，标记「自定义」，图片版渲染出 <image href=产品图地址>
 * - 内置图元不提供删除入口，自定义图元提供
 * - 页面删除 → 二次确认 → 图元消失，服务端记录清空
 * - 图元 ID 命名规范在服务端被拒
 *
 * 图片地址用占位 URL：本用例验证的是「href 不被 imageBase 覆盖」这条渲染约定，
 * 不是图片本身的可达性。
 */
import { test, expect } from '@playwright/test'

/** e2e 后端端口（见 e2e/setup.mjs） */
const API = process.env.E2E_API ?? 'http://localhost:3202'

/** 种子企业用户（非平台角色，可访问业务域路由） */
const USER = { phone: '13300001111', password: 'admin123!@#' }

/** 自定义图元样例 */
const SYMBOL = {
  symbolId: 'CUS-TEST-01',
  name: 'e2e 自定义泵',
  system: 'pipeline',
  category: '泵组',
  desc: 'e2e 专用自定义图元',
  imageUrl: 'https://example.com/e2e-symbol.png',
  bbox: [100, 100, 400, 400],
  ports: [
    { x: 4, y: 32, dir: 'left' },
    { x: 60, y: 32, dir: 'right' },
  ],
  bindings: [{ name: '运行', kind: 'bool', point: 'CUS_TEST_01_RUN', onClass: ['is-run'] }],
}

/** 登录并返回 token（同时写入浏览器登录态） */
async function login(page: import('@playwright/test').Page): Promise<string> {
  const res = await page.request.post(`${API}/api/auth/login`, { data: USER })
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
  return token
}

/** 列出服务端自定义图元 */
async function listSymbols(token: string) {
  const res = await fetch(`${API}/api/symbols/custom`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await res.json()
  return (body.data ?? []) as Array<{ id: number; symbolId: string }>
}

/** 删除服务端自定义图元 */
async function deleteSymbol(token: string, id: number) {
  await fetch(`${API}/api/symbols/custom/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

test.describe('图元管理 · 自定义图元增删', () => {
  let token = ''

  test.beforeEach(async ({ page }) => {
    token = await login(page)
  })

  test.afterEach(async () => {
    // 兜底清理：无论用例成败都不留残留记录
    for (const s of await listSymbols(token)) {
      if (s.symbolId === SYMBOL.symbolId) await deleteSymbol(token, s.id)
    }
  })

  test('新增自定义图元 → 图元管理页可见可渲染 → 删除后消失', async ({ page }) => {
    // ===== 服务端新增 =====
    const created = await page.request.post(`${API}/api/symbols/custom`, {
      headers: { Authorization: `Bearer ${token}` },
      data: SYMBOL,
    })
    expect(created.ok()).toBeTruthy()

    // ===== 图元管理页 =====
    await page.goto('/device-facility/rule/symbol-library')

    const card = page.locator('.symbol-page__card-wrap').filter({
      has: page.locator(`.symbol-page__card-id:text-is("${SYMBOL.symbolId}")`),
    })
    await expect(card).toHaveCount(1)
    await expect(card.locator('.symbol-page__card-name')).toHaveText(SYMBOL.name)
    await expect(card.locator('.symbol-page__card-tag')).toHaveText('自定义')

    // 图片版渲染：<image href> 保持产品图公网地址（不被 imageBase 覆盖）
    const img = card.locator('svg.sym-root image')
    await expect(img).toHaveAttribute('href', SYMBOL.imageUrl)

    // 标题声明的图元数 = 实际渲染数（含自定义图元）
    const desc = await page.locator('.symbol-page__desc').textContent()
    const total = Number(desc?.match(/(\d+)\s*个图元/)?.[1])
    expect(total).toBeGreaterThan(0)
    await expect(page.locator('.symbol-page__card')).toHaveCount(total)

    // ===== 删除入口：自定义图元有，内置图元没有 =====
    await expect(card.locator('.symbol-page__card-del')).toHaveCount(1)
    const builtin = page.locator('.symbol-page__card-wrap').filter({
      hasNot: page.locator('.symbol-page__card-tag'),
    })
    await expect(builtin.first().locator('.symbol-page__card-del')).toHaveCount(0)

    // ===== 页面删除 → 二次确认 =====
    await card.locator('.symbol-page__card-del').click()
    await expect(page.locator('.el-message-box')).toBeVisible()
    await page.locator('.el-message-box').getByRole('button', { name: '确认删除' }).click()

    await expect(
      page.locator('.symbol-page__card-wrap').filter({
        has: page.locator(`.symbol-page__card-id:text-is("${SYMBOL.symbolId}")`),
      }),
    ).toHaveCount(0)

    // ===== 服务端记录已清空 =====
    const rest = await listSymbols(token)
    expect(rest.filter((s) => s.symbolId === SYMBOL.symbolId)).toHaveLength(0)
  })

  test('图元 ID 不符命名规范时服务端拒绝', async ({ page }) => {
    const res = await page.request.post(`${API}/api/symbols/custom`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { ...SYMBOL, symbolId: 'bad-id' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('命名规范')
  })
})
