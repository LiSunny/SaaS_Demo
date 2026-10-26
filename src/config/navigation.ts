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
  /** 分组默认路由：点击分组标题/默认跳转入口；缺省 = 仅展开不跳转 */
  defaultRoute?: string
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


  // ===== 2. 隐患排查治理（社会单位：消防安全管理人） =====
  {
    key: 'unit-hazard',
    label: '隐患排查治理',
    icon: 'menuicon-29',
    defaultOpen: true,
    visibleTo: ['unit'],
    children: [
      // 模块介绍（分组首项，进入该分组的明确入口）
      {
        key: 'unit-hazard-intro',
        label: '模块介绍',
        icon: 'menuicon-50',
        route: '/workbench/hazard-intro',
      },
      {
        key: 'unit-hazard-check',
        label: '隐患排查',
        icon: 'menuicon-30',
        children: [
          { key: 'unit-hazard-ledger', label: '隐患台账', route: '/unit/hazards' },
          { key: 'unit-hazard-report', label: '隐患上报', route: '/unit/hazards/report' },
          { key: 'unit-hazard-task', label: '排查任务', route: '/unit/hazards/tasks' },
        ],
      },
      {
        key: 'unit-hazard-rectify',
        label: '隐患整改',
        icon: 'menuicon-34',
        children: [
          { key: 'unit-hazard-board', label: '整改看板', route: '/unit/hazards/board' },
        ],
      },
      {
        key: 'unit-hazard-rule',
        label: '制度与计划',
        icon: 'menuicon-37',
        children: [
          { key: 'unit-hazard-system', label: '制度建设', route: '/unit/hazards/system' },
          { key: 'unit-hazard-plan', label: '排查计划', route: '/unit/hazards/plan' },
          { key: 'unit-hazard-checklist', label: '排查清单', route: '/unit/hazards/checklist' },
        ],
      },
      {
        key: 'unit-hazard-stat',
        label: '报表与统计',
        icon: 'menuicon-47',
        children: [
          { key: 'unit-hazard-dashboard', label: '数字看板', route: '/unit/hazards/dashboard' },
          {
            key: 'unit-hazard-periodic',
            label: '周期报表',
            route: '/unit/hazards/reports',
            children: [
              {
                key: 'unit-hazard-report-internal',
                label: '对内报告',
                route: '/unit/hazards/reports/internal',
              },
              {
                key: 'unit-hazard-report-regulator',
                label: '监管报告',
                route: '/unit/hazards/reports/regulator',
              },
            ],
          },
        ],
      },
    ],
  },

  // ===== 2a. 巡查检查（社会单位：安全管理员 / 巡查员） =====
  // 菜单名称与层级对齐平台「巡查检查」模块（智慧消防云平台，实测 2026-10-26）
  {
    key: 'unit-patrol',
    label: '巡查检查',
    icon: 'menuicon-25',
    defaultOpen: true,
    visibleTo: ['unit'],
    children: [
      { key: 'unit-patrol-home', label: '首页', icon: 'menuicon-48', route: '/unit/patrol' },
      {
        key: 'unit-patrol-monitor',
        label: '任务监控',
        icon: 'menuicon-30',
        children: [
          { key: 'unit-patrol-task', label: '巡查任务', route: '/unit/patrol/tasks' },
        ],
      },
      { key: 'unit-patrol-forms', label: '项目配置', icon: 'menuicon-37', route: '/unit/patrol/forms' },
      { key: 'unit-patrol-locations', label: '点位管理', icon: 'menuicon-29', route: '/unit/patrol/locations' },
      {
        key: 'unit-patrol-plan-mgmt',
        label: '计划管理',
        icon: 'menuicon-9',
        children: [
          { key: 'unit-patrol-plan', label: '消防巡查', route: '/unit/patrol/plans' },
        ],
      },
      { key: 'unit-patrol-abnormal', label: '异常处置', icon: 'menuicon-24', route: '/unit/patrol/abnormal' },
      { key: 'unit-patrol-reports', label: '巡查报表', icon: 'menuicon-47', route: '/unit/patrol/reports' },
      { key: 'unit-patrol-notices', label: '通知提醒', icon: 'menuicon-34', route: '/unit/patrol/notices' },
    ],
  },

  // ===== 2b. 协同工作（社会单位：协同管理 + 我的待办/已办/发起） =====
  {
    key: 'unit-collab-work',
    label: '协同工作',
    icon: 'menuicon-2',
    defaultOpen: false,
    visibleTo: ['unit'],
    children: [
      {
        key: 'collab-mgmt',
        label: '协同管理',
        icon: 'menuicon-42',
        children: [
          { key: 'collab-flow-template', label: '流程编排', route: '/system/template' },
          { key: 'collab-monitor', label: '协同监控', route: '/system/monitor' },
        ],
      },
      { key: 'collab-pending', label: '待办事项', route: '/collab/task/pending' },
      { key: 'collab-completed', label: '已办事项', route: '/collab/task/completed' },
      { key: 'collab-started', label: '发起事项', route: '/collab/task/started' },
    ],
  },

  // ===== 2c. 安全管理（社会单位：学校/企业/商户/物业） =====
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
        key: 'unit-fire-monitor',
        label: '消防监控',
        icon: 'menuicon-29',
        children: [
          { key: 'unit-fire-pipeline', label: '消防管网系统', route: '/fire/pipeline' },
          { key: 'unit-fire-pipeline-topology', label: '消防管网 · 组态总览', route: '/fire/pipeline/topology' },
          { key: 'unit-fire-gas', label: '气体灭火系统', route: '/fire/gas' },
          { key: 'unit-fire-smoke', label: '消防防排烟系统', route: '/fire/smoke' },
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

  // ===== 2d. 安全管理 — 单位设置（社会单位管理员） =====
  {
    key: 'unit-settings',
    label: '单位设置',
    icon: 'setting',
    defaultOpen: false,
    visibleTo: ['unit'],
    children: [
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
  '/system/template': 'collab-flow-template',
  '/system/monitor': 'collab-monitor',
  '/system/order': 'collab-monitor',
  '/system/dashboard': 'svc-order-dashboard',
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
  '/workbench/hazard-intro': 'unit-hazard-intro',
  '/unit/hazards': 'unit-hazard-ledger',
  '/unit/hazards/report': 'unit-hazard-report',
  '/unit/hazards/tasks': 'unit-hazard-task',
  '/unit/hazards/board': 'unit-hazard-board',
  '/unit/hazards/system': 'unit-hazard-system',
  '/unit/hazards/plan': 'unit-hazard-plan',
  '/unit/hazards/checklist': 'unit-hazard-checklist',
  '/unit/hazards/dashboard': 'unit-hazard-dashboard',
  '/unit/hazards/reports': 'unit-hazard-periodic',
  '/unit/hazards/reports/internal': 'unit-hazard-report-internal',
  '/unit/hazards/reports/regulator': 'unit-hazard-report-regulator',
  // 巡查检查：具体路径在前，保证「路径前缀兜底匹配」时先命中子路由
  '/unit/patrol/tasks': 'unit-patrol-task',
  '/unit/patrol/forms': 'unit-patrol-forms',
  '/unit/patrol/locations': 'unit-patrol-locations',
  '/unit/patrol/plans': 'unit-patrol-plan',
  '/unit/patrol/abnormal': 'unit-patrol-abnormal',
  '/unit/patrol/reports': 'unit-patrol-reports',
  '/unit/patrol/notices': 'unit-patrol-notices',
  '/unit/patrol': 'unit-patrol-home',
  '/collab/flow/template': 'collab-flow-template',  // 兼容旧路径：/collab/flow/* 已合并到 /system/*
  '/collab/flow/monitor': 'collab-monitor',
  '/landing': 'reg-bigscreen',
  '/fire/pipeline': 'unit-fire-pipeline',
  '/fire/pipeline/topology': 'unit-fire-pipeline-topology',
  '/fire/gas': 'unit-fire-gas',
  '/fire/smoke': 'unit-fire-smoke',
  '/collab/task/pending': 'collab-pending',
  '/collab/task/completed': 'collab-completed',
  '/collab/task/started': 'collab-started',
}

/** 侧栏节点 key → 路由路径（用于导航） */
export const NAV_KEY_TO_ROUTE: Record<string, string> = {
  'workbench': '/workbench',
  'svc-order-dashboard': '/system/dashboard',
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
  'unit-hazard-intro': '/workbench/hazard-intro',
  'unit-hazard-ledger': '/unit/hazards',
  'unit-hazard-report': '/unit/hazards/report',
  'unit-hazard-task': '/unit/hazards/tasks',
  'unit-hazard-board': '/unit/hazards/board',
  'unit-hazard-system': '/unit/hazards/system',
  'unit-hazard-plan': '/unit/hazards/plan',
  'unit-hazard-checklist': '/unit/hazards/checklist',
  'unit-hazard-dashboard': '/unit/hazards/dashboard',
  'unit-hazard-periodic': '/unit/hazards/reports',
  'unit-hazard-report-internal': '/unit/hazards/reports/internal',
  'unit-hazard-report-regulator': '/unit/hazards/reports/regulator',
  'unit-patrol-home': '/unit/patrol',
  'unit-patrol-task': '/unit/patrol/tasks',
  'unit-patrol-forms': '/unit/patrol/forms',
  'unit-patrol-locations': '/unit/patrol/locations',
  'unit-patrol-plan': '/unit/patrol/plans',
  'unit-patrol-abnormal': '/unit/patrol/abnormal',
  'unit-patrol-reports': '/unit/patrol/reports',
  'unit-patrol-notices': '/unit/patrol/notices',
  'collab-flow-template': '/system/template',
  'collab-monitor': '/system/monitor',
  'collab-pending': '/collab/task/pending',
  'collab-completed': '/collab/task/completed',
  'collab-started': '/collab/task/started',
  // 同一路由被多个岗位的菜单共用，逐个登记，避免 activeNavKey 落在表外导致内容区退化成占位页
  'reg-members': '/enterprise/members',
  'reg-positions': '/enterprise/positions',
  'op-order-monitor': '/system/monitor',
  'op-members': '/enterprise/members',
  'op-positions': '/enterprise/positions',
  'svc-order-monitor': '/system/monitor',
  'svc-members': '/enterprise/members',
  'svc-positions': '/enterprise/positions',
  'flow-template': '/system/template',
  'unit-fire-pipeline': '/fire/pipeline',
  'unit-fire-pipeline-topology': '/fire/pipeline/topology',
  'unit-fire-gas': '/fire/gas',
  'unit-fire-smoke': '/fire/smoke',
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
