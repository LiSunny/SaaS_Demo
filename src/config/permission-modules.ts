// ===== 权限配置常量 — M2 岗位与权限管理 =====

export interface ModuleGroup {
  label: string
  modules: { key: string; name: string }[]
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    label: '工作台',
    modules: [{ key: 'workbench', name: '工作台' }],
  },
  {
    label: '监控与值守',
    modules: [
      { key: 'remote-duty', name: '远程值守' },
      { key: 'data-visual', name: '数据可视化' },
      { key: 'order-mgmt', name: '工单管理' },
    ],
  },
  {
    label: '设备与物联',
    modules: [
      { key: 'device', name: '设备管理' },
      { key: 'iot', name: 'IOT' },
      { key: 'maintain-app', name: '维保应用' },
    ],
  },
  {
    label: '巡查与隐患',
    modules: [
      { key: 'patrol-inspect', name: '巡查检查' },
      { key: 'hazard-mgmt', name: '隐患管理' },
      { key: 'danger-work', name: '危险作业' },
    ],
  },
  {
    label: '合规与管理',
    modules: [
      { key: 'gov-mgmt', name: '政务管理' },
      { key: 'project-mgmt', name: '项目管理' },
      { key: 'food-mgmt', name: '食品安全' },
    ],
  },
  {
    label: '培训与知识',
    modules: [
      { key: 'training-drill', name: '培训与演练' },
    ],
  },
  {
    label: '平台管理',
    modules: [
      { key: 'process-mgmt', name: '流程管理' },
      { key: 'platform-config', name: '平台配置' },
      { key: 'admin-mgmt', name: '系统管理' },
    ],
  },
]

// ===== 数据操作定义 =====

export interface DataOperation {
  key: string
  name: string
  dependsOn?: string
}

export const DATA_OPERATIONS: DataOperation[] = [
  { key: 'list', name: '查看列表' },
  { key: 'detail', name: '查看详情', dependsOn: 'list' },
  { key: 'create', name: '新增' },
  { key: 'edit', name: '编辑' },
  { key: 'delete', name: '删除' },
  { key: 'export', name: '导出' },
]

// ===== 管理操作定义 =====

export interface ManagementOperation {
  key: string
  name: string
  description: string
}

export const MANAGEMENT_OPERATIONS: ManagementOperation[] = [
  { key: 'user-mgmt', name: '用户管理', description: '管理平台用户账号' },
  { key: 'enterprise-config', name: '企业配置', description: '管理企业信息和属性' },
  { key: 'position-mgmt', name: '岗位管理', description: '管理内置岗位和权限配置' },
  { key: 'audit-log', name: '操作日志', description: '查看操作审计日志' },
]

// ===== 工具函数 =====

export function getAllModuleKeys(): string[] {
  return MODULE_GROUPS.flatMap(g => g.modules.map(m => m.key))
}

/** 根据 module key 查找模块名称 */
export function getModuleName(key: string): string {
  for (const g of MODULE_GROUPS) {
    const m = g.modules.find(m => m.key === key)
    if (m) return m.name
  }
  return key
}
