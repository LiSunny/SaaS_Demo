/**
 * 导航数据结构
 *
 * 侧栏主导航：按"使用群体"组织（四方用户视角），工作台固定。
 *
 * 群体分组：
 *   regulator → 区域监管（监管机构）
 *   unit      → 安全管理（社会单位-普通）
 *   operator  → 项目管理（社会单位-运营商）
 *   service   → 技术服务（技术服务机构）
 *   platform  → 系统管理（平台方，按 systemRole）
 *
 * 过滤逻辑（DefaultLayout）：
 *   系统角色用户 → 只显示 visibleTo 含其 systemRole 的分组
 *   普通用户     → 按当前企业的 groups（无企业时按岗位 group 兜底）过滤分组，
 *                  组内子节点按岗位 key 过滤（visibleTo）
 *
 * @see docs/design/navigation-design.md
 */

// ===== 类型定义 =====

export interface NavNode {
  key: string
  label: string
  icon?: string
  route?: string
  children?: NavNode[]
  /** 岗位 key 白名单，缺省 = 全员可见 */
  visibleTo?: string[]
}

export interface NavGroup {
  key: string
  label: string
  icon?: string
  defaultOpen: boolean
  children: NavNode[]
  /** 使用群体标签白名单：regulator|unit|operator|service，缺省 = 全员可见 */
  visibleTo?: string[]
}

// ===== 导出常量 =====

/** 工作台固定项（独立于任何分组，始终显示在搜索下方） */
export const WORKBENCH_ITEM: NavNode = {
  key: 'workbench',
  label: '工作台',
  icon: 'menuicon-53',
  route: '/workbench',
}

/**
 * 按使用群体组织的导航分组
 */
export const NAV_GROUPS: NavGroup[] = [
  // ===== 1. 区域监管（监管机构） =====
  {
    key: 'regulator',
    label: '区域监管',
    icon: 'dashboard',
    defaultOpen: true,
    visibleTo: ['regulator'],
    children: [
      {
        key: 'reg-situation',
        label: '态势总览',
        icon: 'menuicon-48',
        children: [
          { key: 'reg-bigscreen', label: '监管大屏', route: '/landing' },
          { key: 'reg-report', label: '智能报表' },
        ],
      },
      {
        key: 'reg-supervise',
        label: '督办管理',
        icon: 'menuicon-30',
        children: [
          { key: 'reg-urge', label: '超时督办' },
          { key: 'reg-ranking', label: '红黑榜考核' },
        ],
      },
      {
        key: 'reg-inspect',
        label: '监管检查',
        icon: 'menuicon-25',
        children: [
          { key: 'reg-whitelist', label: '白名单管理' },
          { key: 'reg-check-record', label: '检查记录' },
        ],
      },
      {
        key: 'reg-system',
        label: '系统管理',
        icon: 'menuicon-43',
        visibleTo: ['org-admin'],
        children: [
          { key: 'reg-members', label: '部门成员', route: '/enterprise/members' },
          { key: 'reg-positions', label: '部门岗位', route: '/enterprise/positions' },
        ],
      },
    ],
  },

  // ===== 2. 安全管理 — 日常使用（社会单位：学校/企业/商户/物业） =====
  {
    key: 'unit-daily',
    label: '安全管理',
    icon: 'shield',
    defaultOpen: true,
    visibleTo: ['unit'],
    children: [
      {
        key: 'unit-overview',
        label: '安全概览',
        icon: 'menuicon-48',
        children: [
          { key: 'unit-dashboard', label: '安全态势', route: '/unit/dashboard' },
          { key: 'unit-data', label: '数据看板', route: '/unit/data' },
          { key: 'unit-bigscreen', label: '可视化大屏', route: '/enterprise-cockpit' },
        ],
      },
      {
        key: 'unit-patrol',
        label: '巡查检查',
        icon: 'menuicon-25',
        children: [
          { key: 'unit-patrol-task', label: '巡查任务', route: '/unit/patrol/tasks' },
          { key: 'unit-patrol-location', label: '点位管理', route: '/unit/patrol/locations' },
        ],
      },
      {
        key: 'unit-hazard',
        label: '隐患管理',
        icon: 'menuicon-29',
        children: [
          { key: 'unit-hazard-ledger', label: '隐患台账', route: '/unit/hazards' },
          { key: 'unit-hazard-report', label: '自查上报', route: '/unit/hazards/report' },
        ],
      },
      {
        key: 'unit-device',
        label: '设备管理',
        icon: 'menuicon-45',
        children: [
          { key: 'unit-device-ledger', label: '设备台账', route: '/device/list' },
          { key: 'unit-device-maint-task', label: '保养任务', route: '/unit/device/tasks' },
          { key: 'unit-device-maint-record', label: '保养记录', route: '/unit/device/records' },
        ],
      },
      {
        key: 'unit-maintenance',
        label: '维保管理',
        icon: 'menuicon-9',
        children: [
          { key: 'unit-maint-contract', label: '维保合同', route: '/unit/maintenance/contracts' },
          { key: 'unit-maint-ledger', label: '维保台账', route: '/unit/maintenance/ledger' },
          { key: 'unit-maint-record', label: '维保记录', route: '/unit/maintenance/records' },
          { key: 'unit-maint-report', label: '维保报告', route: '/unit/maintenance/reports' },
        ],
      },
      {
        key: 'unit-alarm',
        label: '告警处置',
        icon: 'menuicon-24',
        children: [
          { key: 'unit-alarm-list', label: '告警列表', route: '/unit/alarms' },
          { key: 'unit-alarm-record', label: '处置记录', route: '/unit/alarms/records' },
        ],
      },
      {
        key: 'unit-danger',
        label: '危险作业',
        icon: 'menuicon-27',
        children: [
          { key: 'unit-danger-apply', label: '作业申请', route: '/unit/danger/apply' },
          { key: 'unit-danger-record', label: '作业记录', route: '/unit/danger/records' },
        ],
      },
      {
        key: 'unit-order',
        label: '我的工单',
        icon: 'menuicon-2',
        children: [
          { key: 'unit-order-list', label: '工单列表', route: '/unit/orders' },
          { key: 'unit-order-stats', label: '工单统计', route: '/unit/orders/stats' },
        ],
      },
      {
        key: 'unit-training',
        label: '培训演练',
        icon: 'menuicon-6',
        children: [
          { key: 'unit-training-knowledge', label: '知识库', route: '/unit/training/knowledge' },
          { key: 'unit-training-record', label: '培训记录', route: '/unit/training/records' },
          { key: 'unit-training-exercise', label: '演练记录', route: '/unit/training/exercises' },
        ],
      },
      {
        key: 'unit-notify',
        label: '通知提醒',
        icon: 'menuicon-34',
        children: [
          { key: 'unit-notify-list', label: '推送记录', route: '/unit/notifications' },
        ],
      },
    ],
  },

  // ===== 2b. 安全管理 — 单位设置（社会单位管理员） =====
  {
    key: 'unit-settings',
    label: '单位设置',
    icon: 'setting',
    defaultOpen: false,
    visibleTo: ['unit'],
    children: [
      {
        key: 'unit-set-patrol',
        label: '巡查设置',
        icon: 'menuicon-25',
        children: [
          { key: 'unit-set-patrol-items', label: '巡查项目', route: '/unit/settings/patrol/items' },
          { key: 'unit-set-patrol-plan', label: '巡查计划', route: '/unit/settings/patrol/plans' },
          { key: 'unit-set-patrol-report', label: '巡查报表', route: '/unit/settings/patrol/reports' },
        ],
      },
      {
        key: 'unit-set-device',
        label: '设备设置',
        icon: 'menuicon-45',
        children: [
          { key: 'unit-set-device-standard', label: '保养规范', route: '/unit/settings/device/standards' },
          { key: 'unit-set-device-plan', label: '保养计划', route: '/unit/settings/device/plans' },
          { key: 'unit-set-device-monitor', label: '运行监控', route: '/unit/settings/device/monitor' },
          { key: 'unit-set-device-report', label: '设备报表', route: '/unit/settings/device/reports' },
          { key: 'unit-set-device-config', label: '设备配置', route: '/unit/settings/device/config' },
          { key: 'unit-set-device-log', label: '系统日志', route: '/unit/settings/device/logs' },
        ],
      },
      {
        key: 'unit-set-alarm',
        label: '告警设置',
        icon: 'menuicon-24',
        children: [
          { key: 'unit-set-alarm-config', label: '告警配置', route: '/unit/settings/alarms/config' },
          { key: 'unit-set-alarm-report', label: '值守报表', route: '/unit/settings/alarms/reports' },
          { key: 'unit-set-alarm-plan', label: '预案管理', route: '/unit/settings/alarms/plans' },
        ],
      },
      {
        key: 'unit-set-notify',
        label: '通知设置',
        icon: 'menuicon-34',
        children: [
          { key: 'unit-set-notify-config', label: '通知配置', route: '/unit/settings/notifications/config' },
          { key: 'unit-set-notify-push', label: '告警推送', route: '/unit/settings/notifications/push' },
        ],
      },
      {
        key: 'unit-set-org',
        label: '组织管理',
        icon: 'menuicon-43',
        children: [
          { key: 'unit-set-org-unit', label: '管理单元', route: '/unit/settings/org/units' },
          { key: 'unit-set-org-building', label: '建筑管理', route: '/unit/settings/org/buildings' },
          { key: 'unit-set-org-focus', label: '重点部位', route: '/unit/settings/org/focus' },
          { key: 'unit-set-org-members', label: '人员管理', route: '/enterprise/members' },
          { key: 'unit-set-org-perms', label: '权限管理', route: '/unit/settings/org/permissions' },
          { key: 'unit-set-org-dept', label: '部门管理', route: '/unit/settings/org/departments' },
          { key: 'unit-set-org-positions', label: '岗位管理', route: '/enterprise/positions' },
        ],
      },
      {
        key: 'unit-set-policy',
        label: '制度管理',
        icon: 'menuicon-8',
        route: '/unit/settings/policies',
      },
      {
        key: 'unit-set-announce',
        label: '通知公告',
        icon: 'menuicon-7',
        route: '/unit/settings/announcements',
      },
      {
        key: 'unit-set-enterprise',
        label: '企业配置',
        icon: 'menuicon-37',
        children: [
          { key: 'unit-set-ent-info', label: '基础信息', route: '/unit/settings/enterprise/info' },
          { key: 'unit-set-ent-custom', label: '个性化', route: '/unit/settings/enterprise/custom' },
        ],
      },
      {
        key: 'unit-set-log',
        label: '日志管理',
        icon: 'menuicon-42',
        route: '/unit/settings/logs',
      },
      {
        key: 'unit-set-form',
        label: '动态表单',
        icon: 'menuicon-47',
        children: [
          { key: 'unit-set-form-mgmt', label: '表单管理', route: '/unit/settings/forms' },
          { key: 'unit-set-form-records', label: '填写记录', route: '/unit/settings/forms/records' },
        ],
      },
      {
        key: 'unit-set-manual',
        label: '使用手册',
        icon: 'menuicon-50',
        route: '/unit/settings/manual',
      },
    ],
  },

  // ===== 3. 项目管理（社会单位-运营商） =====
  {
    key: 'operator',
    label: '项目管理',
    icon: 'briefcase',
    defaultOpen: true,
    visibleTo: ['operator'],
    children: [
      {
        key: 'op-overview',
        label: '项目总览',
        icon: 'menuicon-30',
        children: [
          { key: 'op-dashboard', label: '项目看板' },
          { key: 'op-bigscreen', label: '项目大屏' },
        ],
      },
      {
        key: 'op-projects',
        label: '项目列表',
        icon: 'menuicon-28',
        children: [
          { key: 'op-project-list', label: '全部项目', route: '/projects' },
          { key: 'op-member-delivery', label: '成员交付', route: '/projects/:id/members' },
        ],
      },
      {
        key: 'op-orders',
        label: '项目工单',
        icon: 'menuicon-2',
        children: [
          { key: 'op-order-monitor', label: '工单监控', route: '/system/monitor' },
        ],
      },
      {
        key: 'op-system',
        label: '系统管理',
        icon: 'menuicon-43',
        visibleTo: ['org-admin'],
        children: [
          { key: 'op-members', label: '企业成员', route: '/enterprise/members' },
          { key: 'op-positions', label: '企业岗位', route: '/enterprise/positions' },
        ],
      },
    ],
  },

  // ===== 4. 技术服务（技术服务机构） =====
  {
    key: 'service',
    label: '技术服务',
    icon: 'tools',
    defaultOpen: false,
    visibleTo: ['service'],
    children: [
      {
        key: 'svc-order',
        label: '我的工单',
        icon: 'menuicon-2',
        children: [
          { key: 'svc-order-monitor', label: '工单监控', route: '/system/monitor' },
          { key: 'svc-order-dashboard', label: '数据看板', route: '/system/dashboard' },
        ],
      },
      {
        key: 'svc-maintain',
        label: '维保应用',
        icon: 'menuicon-9',
        children: [
          { key: 'svc-maintain-contract', label: '合同管理' },
          { key: 'svc-maintain-record', label: '维保记录', route: '/maintenance/plans' },
        ],
      },
      {
        key: 'svc-report',
        label: '服务报告',
        icon: 'menuicon-30',
        children: [
          { key: 'svc-report-list', label: '报告列表' },
        ],
      },
      {
        key: 'svc-system',
        label: '系统管理',
        icon: 'menuicon-43',
        visibleTo: ['org-admin'],
        children: [
          { key: 'svc-members', label: '企业成员', route: '/enterprise/members' },
          { key: 'svc-positions', label: '企业岗位', route: '/enterprise/positions' },
        ],
      },
    ],
  },

  // ===== 5. 运营管理（平台运营方 platform-ops） =====
  {
    key: 'platform-ops',
    label: '运营管理',
    icon: 'setting',
    defaultOpen: false,
    visibleTo: ['platform-ops'],
    children: [
      {
        key: 'plat-tenant',
        label: '租户管理',
        icon: 'menuicon-43',
        children: [
          { key: 'tenant-mgmt', label: '租户列表', route: '/admin/enterpriseManagement/index' },
        ],
      },
      {
        key: 'plat-user',
        label: '用户管理',
        icon: 'menuicon-43',
        children: [
          { key: 'user-list', label: '用户列表', route: '/admin/users' },
        ],
      },
      {
        key: 'plat-position',
        label: '岗位管理',
        icon: 'menuicon-43',
        children: [
          { key: 'position-mgmt', label: '岗位列表', route: '/admin/positions' },
        ],
      },
      {
        key: 'plat-bigscreen',
        label: '大屏配置',
        icon: 'menuicon-43',
        children: [
          { key: 'bigscreen-list', label: '大屏管理', route: '/admin/bigscreens' },
        ],
      },
      {
        key: 'plat-process',
        label: '流程模板',
        icon: 'menuicon-42',
        children: [
          { key: 'flow-template', label: '流程模板', route: '/system/template' },
        ],
      },
      {
        key: 'plat-member-type',
        label: '类型注册',
        icon: 'menuicon-43',
        children: [
          { key: 'member-type-list', label: '成员类型', route: '/admin/member-types' },
        ],
      },
    ],
  },

  // ===== 6. 平台管理（技术管理 platform-admin；platform-ops 兼看） =====
  {
    key: 'platform-admin',
    label: '平台管理',
    icon: 'server',
    defaultOpen: false,
    visibleTo: ['platform-admin', 'platform-ops'],
    children: [
      {
        key: 'plat-tech',
        label: '技术配置',
        icon: 'server',
        children: [
          { key: 'route-config', label: '路由配置' },
          { key: 'menu-config', label: '菜单管理' },
          { key: 'system-params', label: '系统参数' },
          { key: 'upgrade-mgmt', label: '升级管理' },
        ],
      },
      {
        key: 'plat-test-data',
        label: 'Agent 测试数据',
        icon: 'menuicon-43',
        children: [
          { key: 'test-data-list', label: '测试数据管理', route: '/test-data' },
        ],
      },
    ],
  },
]

// ===== 映射表 =====

/** 路由路径 → 侧栏节点 key */
export const ROUTE_TO_NAV_KEY: Record<string, string> = {
  '/workbench': 'workbench',
  '/system/template': 'flow-template',
  '/system/monitor': 'unit-order-list',
  '/system/order': 'unit-order-list',
  '/system/dashboard': 'unit-order-stats',
  '/maintenance/plans': 'svc-maintain-record',
  '/maintenance/plans/detail': 'svc-maintain-record',
  '/device': 'unit-device',
  '/device/list': 'unit-device-ledger',
  '/iot': 'unit-device',
  '/platform': 'platform-admin',
  '/admin': 'tenant-mgmt',
  '/admin/enterpriseManagement': 'tenant-mgmt',
  '/admin/enterpriseManagement/index': 'tenant-mgmt',
  '/admin/users': 'user-list',
  '/admin/positions': 'position-mgmt',
  '/admin/bigscreens': 'bigscreen-list',
  '/admin/member-types': 'member-type-list',
  '/test-data': 'test-data-list',
  '/enterprise/members': 'unit-set-org-members',
  '/enterprise/positions': 'unit-set-org-positions',
  '/resumption': 'unit-hazard-report',
  '/resumption-bigscreen': 'unit-bigscreen',
  '/enterprise-cockpit': 'unit-bigscreen',
}

/** 侧栏节点 key → 路由路径（用于导航） */
export const NAV_KEY_TO_ROUTE: Record<string, string> = {
  'workbench': '/workbench',
  'flow-template': '/system/template',
  'unit-order-list': '/system/monitor',
  'unit-order-stats': '/system/dashboard',
  'svc-maintain-record': '/maintenance/plans',
  'unit-device': '/device',
  'unit-device-ledger': '/device/list',
  'tenant-mgmt': '/admin/enterpriseManagement/index',
  'user-list': '/admin/users',
  'position-mgmt': '/admin/positions',
  'bigscreen-list': '/admin/bigscreens',
  'member-type-list': '/admin/member-types',
  'test-data-list': '/test-data',
  'unit-set-org-members': '/enterprise/members',
  'unit-set-org-positions': '/enterprise/positions',
  'reg-bigscreen': '/landing',
  'unit-bigscreen': '/enterprise-cockpit',
}

// ===== 工具函数 =====

/**
 * 递归搜索 nav 树中 key 对应的节点
 */
export function findNodeByKey(key: string): NavNode | null {
  for (const group of NAV_GROUPS) {
    const found = searchInTree(group.children, key)
    if (found) return found
  }
  return null
}

/**
 * 查找 key 的所有祖先路径
 * 返回 { groupKey, parentKeys }
 * 用于自动展开当前路由所属的分组和父级
 */
export function findAncestors(
  key: string,
): { groupKey: string; parentKeys: string[] } | null {
  for (const group of NAV_GROUPS) {
    const parentKeys: string[] = []
    const found = findInGroup(group.children, key, parentKeys)
    if (found) return { groupKey: group.key, parentKeys }
  }
  return null
}

/**
 * 收集所有可钉选的节点 key（叶子节点 + 跳转入口）
 * 用于初始化钉选面板时枚举
 */
export function collectLeafKeys(): string[] {
  const keys: string[] = []
  for (const group of NAV_GROUPS) {
    collectLeaves(group.children, keys)
  }
  keys.push(WORKBENCH_ITEM.key)
  return keys
}

/**
 * 按岗位过滤导航树。
 * 递归裁剪：visibleTo 不匹配的节点及其全部子节点被移除。
 * 空分支折叠：父节点内所有子节点都被移除后，父节点也移除。
 *
 * @param nodes  原始节点数组
 * @param positionKeys  用户当前拥有的岗位 key 数组
 * @returns 过滤后的节点数组（新引用，不修改原数组）
 */
export function filterNodesByPosition(
  nodes: NavNode[],
  positionKeys: string[],
): NavNode[] {
  const result: NavNode[] = []
  for (const node of nodes) {
    if (!isNodeVisible(node, positionKeys)) continue
    if (node.children) {
      const filteredChildren = filterNodesByPosition(node.children, positionKeys)
      if (filteredChildren.length === 0) continue // 空分支折叠
      result.push({ ...node, children: filteredChildren })
    } else {
      result.push({ ...node })
    }
  }
  return result
}

/** 单节点可见性判定 */
function isNodeVisible(node: NavNode, positionKeys: string[]): boolean {
  if (!node.visibleTo || node.visibleTo.length === 0) return true
  return positionKeys.some(k => node.visibleTo!.includes(k))
}

// ===== 内部辅助 =====

function searchInTree(nodes: NavNode[], key: string): NavNode | null {
  for (const node of nodes) {
    if (node.key === key) return node
    if (node.children) {
      const found = searchInTree(node.children, key)
      if (found) return found
    }
  }
  return null
}

function findInGroup(
  nodes: NavNode[],
  key: string,
  parentKeys: string[],
): boolean {
  for (const node of nodes) {
    if (node.key === key) return true
    if (node.children) {
      parentKeys.push(node.key)
      if (findInGroup(node.children, key, parentKeys)) return true
      parentKeys.pop()
    }
  }
  return false
}

function collectLeaves(nodes: NavNode[], keys: string[]): void {
  for (const node of nodes) {
    if (node.route && !node.children) {
      keys.push(node.key)
    }
    if (node.children) {
      collectLeaves(node.children, keys)
    }
  }
}
