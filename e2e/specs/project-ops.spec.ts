import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * 项目管理（运营商侧）端到端用例
 *
 * 依据 docs/项目管理/product-design.md §11 P0 验收标准：
 *   1. 可创建项目，并选择「行政区划 / 空白 / 复制」初始化层级
 *   6. 点击层级节点可过滤表格；「含下级」开关生效；页签切换保持选中
 *   8. 删除节点 / 单位 / 设备 / 项目均有确认和影响说明；空态齐全
 *
 * 注意：
 *   1. 本模块数据在 Pinia 内存中演示，页面刷新后回到种子数据，
 *      因此同一用例内的断言不跨 page.goto。
 *   2. 登录用服务端启动时自动开通的默认管理员（ensureDefaultAdmin）：
 *      13800000000 / admin123（systemRole=platform-ops）。
 *      e2e/fixtures/auth.ts 里的 13800000001 / 3xkxr4 在测试库中不存在
 *      （seed.ts 未创建该用户），故本文件不共用该 fixture。
 */
const ADMIN = { phone: '13800000000', password: 'admin123' }

async function login(page: Page): Promise<void> {
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
    { token, user },
  )
}

test.describe('项目管理（运营商侧）', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('项目档案列表：加载种子项目、查询过滤、批量删除按钮受勾选控制', async ({ page }) => {
    await page.goto('/projects')

    const table = page.locator('table.fi-table')
    await expect(table).toContainText('海港区独居老人联网')
    await expect(table).toContainText('海港区燃气监测')

    // 批量删除在没有勾选时禁用
    await expect(page.getByRole('button', { name: '批量删除' })).toBeDisabled()

    // 查询过滤
    await page.getByPlaceholder('项目名称或编号').fill('燃气')
    await page.getByRole('button', { name: '查询' }).click()
    await expect(table).toContainText('海港区燃气监测')
    await expect(table).not.toContainText('海港区独居老人联网')
  })

  test('新建项目：两步抽屉 + 行政区划初始化层级', async ({ page }) => {
    await page.goto('/projects')
    const table = page.locator('table.fi-table')

    await page.getByRole('button', { name: '新增', exact: true }).click()
    const drawer = page.locator('.project-form-drawer')
    await expect(drawer).toBeVisible()

    // 第 1 步：基本信息
    await page.getByPlaceholder('请输入项目名称').fill('夜间自动化测试项目')
    await page.locator('.pf-select').first().click()
    await page.locator('.el-select-dropdown__item', { hasText: '燃气监测' }).first().click()

    // 管理范围级联：河北省 / 秦皇岛市 / 海港区 / 港西街道
    // Element Plus 级联点父节点只展开，必须点到叶子节点才会选中整条路径
    await page.locator('.pf-cascader input').click()
    await page.locator('.el-cascader-node__label', { hasText: '河北省' }).first().click()
    await page.locator('.el-cascader-node__label', { hasText: '秦皇岛市' }).first().click()
    await page.locator('.el-cascader-node__label', { hasText: '海港区' }).first().click()
    await page.locator('.el-cascader-node__label', { hasText: '港西街道' }).first().click()
    await expect(page.locator('.pf-cascader input')).toHaveValue(/海港区/)

    await page.getByPlaceholder('请输入项目负责人').fill('夜间测试')

    await page.getByRole('button', { name: '下一步' }).click()
    // 第 2 步：默认「按行政区划」，预览应给出将要生成的节点
    await expect(drawer).toContainText('将生成')
    await page.getByRole('button', { name: '保存', exact: true }).click()

    await expect(drawer).toBeHidden()
    await expect(table).toContainText('夜间自动化测试项目')
  })

  test('项目详情：头部 KPI、页签切换、层级树过滤', async ({ page }) => {
    await page.goto('/projects/pj-001')

    // 头部
    await expect(page.locator('.project-name')).toContainText('海港区独居老人联网')
    await expect(page.locator('.kpi-label').first()).toContainText('接入设备')
    await expect(page.locator('.kpi-label').nth(1)).toContainText('接入单位')

    // 接入单位页签：默认「全部」
    const unitTable = page.locator('table.fi-table')
    await expect(unitTable).toContainText('张桂芳家庭')
    await expect(unitTable).toContainText('王秀英家庭')

    // 点层级节点 → 表格按节点过滤（红旗街道下挂 老孙头饺子馆）
    await page.locator('.tree-node', { hasText: '红旗街道' }).first().click()
    await expect(page.locator('.scope-bar')).toContainText('红旗街道')
    await expect(unitTable).toContainText('老孙头饺子馆')
    await expect(unitTable).not.toContainText('张桂芳家庭')

    // 切页签后树选中保持
    await page.getByRole('button', { name: '接入设备' }).click()
    await expect(page.locator('.scope-bar')).toContainText('红旗街道')
    await expect(unitTable).toContainText('老孙头饺子馆烟感')
    await expect(unitTable).not.toContainText('张桂芳家烟感')
  })

  test('接入单位抽屉：从台账选择 → 选择归属层级 → 确认接入', async ({ page }) => {
    await page.goto('/projects/pj-002')

    // 页签与工具栏都有「接入单位」，这里取工具栏那个
    await page.locator('.filter-right').getByRole('button', { name: '接入单位' }).click()
    const drawer = page.locator('.add-unit-drawer')
    await expect(drawer).toBeVisible()

    // 第 1 步：台账里勾选一个未接入的单位
    // 台账列表分页（design.md §6.4.2），先按关键字筛出目标行
    await drawer.getByPlaceholder('单位名称').fill('海港便利店')
    const ledgerRow = drawer.locator('table.fi-table tbody tr', { hasText: '海港便利店' })
    await ledgerRow.locator('.el-checkbox').click()
    await expect(drawer).toContainText('已选 1 个')

    await page.getByRole('button', { name: '下一步' }).click()

    // 第 2 步：选择归属层级
    await drawer.locator('.el-tree-node__content', { hasText: '港西街道' }).first().click()
    await expect(drawer).toContainText('将接入到')
    await page.getByRole('button', { name: /确认接入/ }).click()

    await expect(drawer).toBeHidden()
    await expect(page.locator('table.fi-table')).toContainText('海港便利店')
  })

  test('新增设备抽屉：选单位 → 录入设备 → 保存后单位设备数更新', async ({ page }) => {
    await page.goto('/projects/pj-001')

    await page.getByRole('button', { name: '接入设备' }).click()
    await page.getByRole('button', { name: '新增设备' }).click()
    const drawer = page.locator('.add-device-drawer')
    await expect(drawer).toBeVisible()

    // 第 1 步：选归属单位
    await drawer.locator('.unit-option', { hasText: '张桂芳家庭' }).click()

    // 第 2 步：设备信息
    await drawer.getByPlaceholder('请输入设备名称').fill('夜间测试烟感')
    await drawer.getByPlaceholder('请输入设备编码').fill('SB-E2E-0001')
    await page.getByRole('button', { name: '保存', exact: true }).click()

    await expect(drawer).toBeHidden()
    await expect(page.locator('table.fi-table')).toContainText('夜间测试烟感')
  })

  test('单位行「添加设备」：带入单位跳过选单位步，保存后 toast 带「查看设备」并可跳转', async ({ page }) => {
    await page.goto('/projects/pj-001')

    // 单位行操作列有 4 个按钮（§7.2.3）
    const row = page.locator('table.fi-table tbody tr', { hasText: '港南消防队' }).first()
    await row.locator('[title="添加设备"]').click()

    const drawer = page.locator('.add-device-drawer')
    await expect(drawer).toBeVisible()
    // 单位已带入 → 直接进第 2 步（没有单位选择列表）
    await expect(drawer.locator('.chosen-name')).toHaveText('港南消防队')
    await expect(drawer.locator('.unit-list')).toHaveCount(0)

    await drawer.getByPlaceholder('请输入设备名称').fill('夜间测试烟感B')
    await drawer.getByPlaceholder('请输入设备编码').fill('SB-E2E-0002')
    await drawer.getByRole('button', { name: '保存', exact: true }).click()
    await expect(drawer).toBeHidden()

    // §6.5.3：toast 带「查看设备」→ 切到设备页签并按该单位筛选
    const link = page.locator('.device-saved-msg__link')
    await expect(link).toBeVisible()
    await link.click()
    await expect(page.locator('.tab-item.active')).toHaveText('接入设备')
    await expect(page.locator('.filter-chip')).toContainText('港南消防队')
  })

  test('设备行「编辑」：改名称生效；编码重复被拦截', async ({ page }) => {
    await page.goto('/projects/pj-001')
    await page.getByRole('button', { name: '接入设备' }).click()

    const row = page.locator('table.fi-table tbody tr', { hasText: '港南消防队烟感' }).first()
    await row.locator('[title="编辑设备"]').click()

    const drawer = page.locator('.add-device-drawer')
    await expect(drawer).toBeVisible()
    await expect(drawer.locator('.el-drawer__title')).toHaveText('编辑设备')
    // 编辑模式：不可更换归属单位，无「保存并继续」
    await expect(drawer.locator('.edit-hint')).toBeVisible()
    await expect(drawer.getByRole('button', { name: '保存并继续' })).toHaveCount(0)

    // 编码重复 → 红字提示 + 不保存
    await drawer.getByPlaceholder('请输入设备编码').fill('SX-A1-0009')
    await drawer.getByRole('button', { name: '保存', exact: true }).click()
    await expect(drawer.locator('.form-error')).toHaveText('设备编码重复')

    // 改成合法编码 + 改名 → 生效
    await drawer.getByPlaceholder('请输入设备名称').fill('港南消防队烟感改名')
    await drawer.getByPlaceholder('请输入设备编码').fill('SB-E2E-0003')
    await drawer.getByRole('button', { name: '保存', exact: true }).click()
    await expect(drawer).toBeHidden()
    await expect(page.locator('table.fi-table')).toContainText('港南消防队烟感改名')
  })

  test('单位行「编辑」：只改项目级字段（标签 / 备注 / 项目内联系人），基础信息只读', async ({ page }) => {
    await page.goto('/projects/pj-001')

    const row = page.locator('table.fi-table tbody tr', { hasText: '港南消防队' }).first()
    await row.locator('[title="编辑项目内信息"]').click()

    const drawer = page.locator('.unit-edit-drawer')
    await expect(drawer).toBeVisible()
    // 基础信息只读 + 给「去台账编辑」链接（§6.4.4）
    await expect(drawer.locator('.base-link')).toHaveText('去台账编辑')
    await expect(drawer.locator('.base-tip')).toContainText('项目内只读')

    await drawer.getByPlaceholder('本项目内的对接人').fill('夜间对接人')
    await drawer.getByPlaceholder('备注').fill('夜间备注')
    await drawer.getByRole('button', { name: '保存', exact: true }).click()
    await expect(drawer).toBeHidden()

    // 重新打开确认已落库
    await row.locator('[title="编辑项目内信息"]').click()
    await expect(drawer.getByPlaceholder('本项目内的对接人')).toHaveValue('夜间对接人')
    await expect(drawer.getByPlaceholder('备注')).toHaveValue('夜间备注')
  })

  test('台账行「加入项目」：先选项目再选层级，反向接入生效', async ({ page }) => {
    await page.goto('/managed/key-units')

    // 接入前：海港区政府不属于任何项目
    const row = page.locator('table.fi-table tbody tr', { hasText: '海港区政府' }).first()
    await expect(row).toContainText('0 个')

    await row.locator('[title="加入项目"]').click()

    const drawer = page.locator('.join-project-drawer')
    await expect(drawer).toBeVisible()

    // 第 1 步：选项目
    await drawer.locator('.project-option', { hasText: '海港区燃气监测' }).click()
    // 第 2 步：选层级（先选项目后才出现层级树）
    await drawer.locator('.el-tree-node__label', { hasText: '港西街道' }).first().click()
    await expect(drawer.locator('.foot-text')).toContainText('海港区 / 港西街道')
    await drawer.getByRole('button', { name: '确认接入' }).click()
    await expect(drawer).toBeHidden()

    // 本模块数据在 Pinia 内存中，page.goto 会重置种子数据 →
    // 在台账页原地断言「所属项目数」由 0 变 1
    await expect(page.locator('table.fi-table tbody tr', { hasText: '海港区政府' }).first()).toContainText('1 个')
  })

  test('三个台账列表可打开并列出对应类型单位', async ({ page }) => {
    await page.goto('/managed/key-units')
    await expect(page.locator('table.fi-table')).toContainText('港南消防队')

    await page.goto('/managed/families')
    await expect(page.locator('table.fi-table')).toContainText('张桂芳家庭')

    await page.goto('/managed/small-venues')
    await expect(page.locator('table.fi-table')).toContainText('老孙头饺子馆')
  })

  test('删除项目：二次确认并说明影响', async ({ page }) => {
    await page.goto('/projects/pj-002')
    await expect(page.locator('.project-name')).toContainText('海港区燃气监测')

    await page.getByRole('button', { name: '删除', exact: true }).click()
    const dialog = page.locator('.el-message-box')
    await expect(dialog).toContainText('仍保留在台账')
    await expect(dialog).toContainText('可视化配置将一并删除')
    await dialog.getByRole('button', { name: '取消' }).click()
    await expect(page.locator('.project-name')).toContainText('海港区燃气监测')
  })
})
