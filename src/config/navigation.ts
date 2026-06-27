/**
 * 导航数据结构
 *
 * 侧栏主导航：6 个分组 + 工作台（固定）
 * 展开模式（≤8 模块）：侧栏内嵌 2 级子菜单
 * 跳转模式（>10 模块）：侧栏放入口，点击导航到域首页
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
}

export interface NavGroup {
  key: string
  label: string
  icon?: string
  defaultOpen: boolean
  children: NavNode[]
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
 * 6 个导航分组
 *
 * 分组规则：
 * - defaultOpen: true → 默认展开（核心高频分组）
 * - defaultOpen: false → 默认折叠
 * - NavNode 有 children 且无 route → 展开节点（点击 toggle）
 * - NavNode 无 children 且有 route → 跳转节点（点击导航）
 * - NavNode 有 route（且模块数>10） → 跳转域首页入口
 */
export const NAV_GROUPS: NavGroup[] = [
  // ===== 1. 监控与值守 =====
  {
    key: 'monitor-duty',
    label: '监控与值守',
    icon: 'monitor',
    defaultOpen: true,
    children: [
      {
        key: 'remote-duty',
        label: '远程值守',
        icon: 'menuicon-48',
        children: [
          { key: 'duty-workbench', label: '工作台' },
          { key: 'duty-alarm', label: '告警中心' },
          { key: 'duty-verify', label: '核实判定' },
          { key: 'duty-plan', label: '预案管理' },
        ],
      },
      {
        key: 'data-visual',
        label: '数据可视化',
        icon: 'menuicon-30',
        children: [
          { key: 'data-report', label: '智能报表' },
          { key: 'data-bigscreen', label: '可视化大屏' },
        ],
      },
      {
        key: 'order-mgmt',
        label: '工单管理',
        icon: 'menuicon-2',
        children: [
          { key: 'order-monitor', label: '工单监控', route: '/system/monitor' },
          { key: 'order-dashboard', label: '数据看板', route: '/system/dashboard' },
        ],
      },
    ],
  },

  // ===== 2. 设备与物联 =====
  {
    key: 'device-iot',
    label: '设备与物联',
    icon: 'device',
    defaultOpen: false,
    children: [
      { key: 'device', label: '设备管理', icon: 'menuicon-45', route: '/device' },
      { key: 'iot', label: 'IOT', icon: 'menuicon-46', route: '/iot' },
      {
        key: 'maintain-app',
        label: '维保应用',
        icon: 'menuicon-9',
        children: [
          { key: 'maintain-contract', label: '合同管理' },
          { key: 'maintenance-record', label: '维保记录', route: '/maintenance/plans' },
        ],
      },
    ],
  },

  // ===== 3. 巡查与隐患 =====
  {
    key: 'patrol-hazard',
    label: '巡查与隐患',
    icon: 'patrol',
    defaultOpen: true,
    children: [
      {
        key: 'patrol-inspect',
        label: '巡查检查',
        icon: 'menuicon-25',
        children: [
          { key: 'patrol-plan', label: '巡查计划' },
          { key: 'patrol-task', label: '巡查任务' },
          { key: 'patrol-report', label: '巡查报表' },
        ],
      },
      {
        key: 'hazard-mgmt',
        label: '隐患管理',
        icon: 'menuicon-29',
        children: [
          { key: 'hazard-ledger', label: '隐患台账' },
          { key: 'hazard-self-report', label: '自查上报' },
        ],
      },
      {
        key: 'danger-work',
        label: '危险作业',
        icon: 'menuicon-27',
        children: [
          { key: 'danger-register', label: '作业备案' },
          { key: 'danger-approve', label: '特殊作业审批' },
        ],
      },
    ],
  },

  // ===== 4. 合规与管理 =====
  {
    key: 'compliance',
    label: '合规与管理',
    icon: 'compliance',
    defaultOpen: false,
    children: [
      {
        key: 'gov-mgmt',
        label: '政务管理',
        icon: 'menuicon-3',
        children: [
          { key: 'gov-whitelist', label: '白名单管理' },
          { key: 'gov-inspect', label: '检查记录' },
        ],
      },
      {
        key: 'project-mgmt',
        label: '项目管理',
        icon: 'menuicon-28',
        children: [
          { key: 'project-list', label: '项目列表' },
          { key: 'project-task', label: '任务管理' },
        ],
      },
      {
        key: 'food-mgmt',
        label: '食品安全',
        icon: 'menuicon-40',
        children: [
          { key: 'food-ledger', label: '数字台账' },
          { key: 'food-stock', label: '出入库管理' },
          { key: 'food-sample', label: '食材留样' },
        ],
      },
    ],
  },

  // ===== 5. 培训与知识 =====
  {
    key: 'training',
    label: '培训与知识',
    icon: 'training',
    defaultOpen: false,
    children: [
      {
        key: 'training-drill',
        label: '培训与演练',
        icon: 'menuicon-6',
        children: [
          { key: 'training-knowledge', label: '知识库' },
          { key: 'training-record', label: '培训记录' },
          { key: 'training-exercise', label: '演练记录' },
        ],
      },
    ],
  },

  // ===== 6. 平台管理 =====
  {
    key: 'platform-admin',
    label: '平台管理',
    icon: 'admin',
    defaultOpen: false,
    children: [
      {
        key: 'process-mgmt',
        label: '流程管理',
        icon: 'menuicon-42',
        children: [
          { key: 'flow-template', label: '流程模板', route: '/system/template' },
        ],
      },
      { key: 'platform-config', label: '平台配置', icon: 'menuicon-51', route: '/platform' },
      {
        key: 'admin-mgmt',
        label: '系统管理',
        icon: 'menuicon-33',
        children: [
          { key: 'tenant-mgmt', label: '租户管理', icon: 'menuicon-43', route: '/admin/enterpriseManagement/index' },
          { key: 'user-mgmt', label: '用户管理', icon: 'menuicon-43', route: '/admin/users' },
          { key: 'position-mgmt', label: '岗位管理', icon: 'menuicon-43', route: '/admin/positions' },
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
  '/system/monitor': 'order-monitor',
  '/system/order': 'order-monitor',
  '/system/dashboard': 'order-dashboard',
  '/maintenance/plans': 'maintenance-record',
  '/maintenance/plans/detail': 'maintenance-record',
  '/device': 'device',
  '/iot': 'iot',
  '/platform': 'platform',
  '/admin': 'admin',
  '/admin/enterpriseManagement': 'tenant-mgmt',
  '/admin/positions': 'position-mgmt',
}

/** 侧栏节点 key → 路由路径（用于导航） */
export const NAV_KEY_TO_ROUTE: Record<string, string> = {
  'workbench': '/workbench',
  'flow-template': '/system/template',
  'order-monitor': '/system/monitor',
  'order-dashboard': '/system/dashboard',
  'maintenance-record': '/maintenance/plans',
  'device': '/device',
  'iot': '/iot',
  'platform': '/platform',
  'admin': '/admin',
  'tenant-mgmt': '/admin/enterpriseManagement/index',
  'user-mgmt': '/admin/users',
  'position-mgmt': '/admin/positions',
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