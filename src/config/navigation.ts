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
  /** 岗位 key 白名单，缺省 = 全员可见 */
  visibleTo?: string[]
}

export interface NavGroup {
  key: string
  label: string
  icon?: string
  defaultOpen: boolean
  children: NavNode[]
  /** 岗位 key 白名单，缺省 = 全员可见 */
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
    icon: 'dashboard',
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
      { key: 'device', label: '设备管理', icon: 'menuicon-45', route: '/device', children: [
          { key: 'device-list', label: '设备列表', route: '/device/list' },
        ] },
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
    icon: 'map',
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
      {
        key: 'resumption-mgmt',
        label: '复工复产管理',
        icon: 'menuicon-27',
        children: [
          { key: 'resumption-list', label: '复工计划列表', route: '/resumption' },
          { key: 'resumption-dashboard', label: '复工看板', route: '/resumption/dashboard' },
        ],
      },
    ],
  },

  // ===== 4. 合规与管理 =====
  {
    key: 'compliance',
    label: '合规与管理',
    icon: 'certificate',
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
    icon: 'file',
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

  // ===== 6. 运营管理（platform-ops 可见全部；org-admin 仅见企业管理） =====
  {
    key: 'platform-ops',
    label: '运营管理',
    icon: 'setting',
    defaultOpen: true,
    visibleTo: ['platform-ops', 'org-admin'],
    children: [
      {
        key: 'tenant-mgmt-group',
        label: '租户管理',
        icon: 'menuicon-43',
        visibleTo: ['platform-ops'],
        children: [
          { key: 'tenant-mgmt', label: '租户列表', route: '/admin/enterpriseManagement/index' },
        ],
      },
      {
        key: 'user-mgmt-group',
        label: '用户管理',
        icon: 'menuicon-43',
        visibleTo: ['platform-ops'],
        children: [
          { key: 'user-list', label: '用户列表', route: '/admin/users' },
        ],
      },
      {
        key: 'position-mgmt-group',
        label: '岗位管理',
        icon: 'menuicon-43',
        visibleTo: ['platform-ops'],
        children: [
          { key: 'position-mgmt', label: '岗位列表', route: '/admin/positions' },
        ],
      },
      {
        key: 'bigscreen-config',
        label: '大屏配置',
        icon: 'menuicon-43',
        visibleTo: ['platform-ops'],
        children: [
          { key: 'bigscreen-list', label: '大屏管理', route: '/admin/bigscreens' },
        ],
      },
      {
        key: 'process-mgmt',
        label: '流程管理',
        icon: 'menuicon-42',
        visibleTo: ['platform-ops'],
        children: [
          { key: 'flow-template', label: '流程模板', route: '/system/template' },
        ],
      },
      {
        key: 'enterprise-mgmt',
        label: '企业管理',
        icon: 'menuicon-33',
        visibleTo: ['org-admin'],
        children: [
          { key: 'enterprise-members', label: '企业成员', route: '/enterprise/members' },
          { key: 'enterprise-positions', label: '岗位管理', route: '/enterprise/positions' },
        ],
      },
    ],
  },

  // ===== 7. 平台管理（platform-admin 可见：技术配置，占位） =====
  {
    key: 'platform-admin',
    label: '平台管理',
    icon: 'server',
    defaultOpen: false,
    visibleTo: ['platform-admin'],
    children: [
      { key: 'route-config', label: '路由配置' },
      { key: 'menu-config', label: '菜单管理' },
      { key: 'system-params', label: '系统参数' },
      { key: 'upgrade-mgmt', label: '升级管理' },
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
  '/device/list': 'device-list',
  '/iot': 'iot',
  '/platform': 'platform',
  '/admin': 'admin',
  '/admin/enterpriseManagement': 'tenant-mgmt',
  '/admin/enterpriseManagement/index': 'tenant-mgmt',
  '/admin/users': 'user-list',
  '/admin/positions': 'position-mgmt',
  '/admin/bigscreens': 'bigscreen-list',
  '/enterprise/members': 'enterprise-members',
  '/enterprise/positions': 'enterprise-positions',
  '/resumption': 'resumption-list',
  '/resumption/dashboard': 'resumption-dashboard',
}

/** 侧栏节点 key → 路由路径（用于导航） */
export const NAV_KEY_TO_ROUTE: Record<string, string> = {
  'workbench': '/workbench',
  'flow-template': '/system/template',
  'order-monitor': '/system/monitor',
  'order-dashboard': '/system/dashboard',
  'maintenance-record': '/maintenance/plans',
  'device': '/device',
  'device-list': '/device/list',
  'iot': '/iot',
  'platform': '/platform',
  'admin': '/admin',
  'tenant-mgmt': '/admin/enterpriseManagement/index',
  'user-list': '/admin/users',
  'position-mgmt': '/admin/positions',
  'bigscreen-list': '/admin/bigscreens',
  'enterprise-members': '/enterprise/members',
  'enterprise-positions': '/enterprise/positions',
  'resumption-list': '/resumption',
  'resumption-dashboard': '/resumption/dashboard',
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