/**
 * 平台岗位定义
 *
 * 消防安全管理多租户 SaaS 平台，四方协同场景。
 * 11 个岗位覆盖物业方、服务方、监管方、平台方。
 *
 * @see docs/design/平台岗位设计.md
 */

// ===== 类型定义 =====

/** 数据范围 */
export type DataScope =
  | { type: 'self'; orgId: number }
  | { type: 'assigned'; assigneeId: number }
  | { type: 'service'; serviceOrgId: number }
  | { type: 'all' }
  | { type: 'platform' }

/** 岗位 key */
export type PositionKey =
  | 'fire-safety-responsible'
  | 'fire-safety-manager'
  | 'duty-officer'
  | 'org-admin-property'
  | 'project-lead'
  | 'tech-lead'
  | 'maintenance-engineer'
  | 'org-admin-service'
  | 'safety-supervisor'
  | 'org-admin-supervisor'
  | 'platform-admin'

/** 岗位定义 */
export interface PositionDef {
  key: PositionKey
  name: string
  orgName: string // 所属组织
  orgId: number
  user: {
    id: number
    name: string
  }
  dataScope: DataScope
  description: string
}

/** 组织分组（岗位切换器按此分组显示） */
export interface OrgGroup {
  name: string
  positions: PositionDef[]
}

// ===== 岗位数据 =====

export const ALL_POSITIONS: PositionDef[] = [
  // ===== 物业方 — 阳光物业管理有限公司 =====
  {
    key: 'fire-safety-responsible',
    name: '消防安全责任人',
    orgName: '阳光物业管理有限公司',
    orgId: 1,
    user: { id: 1, name: '周志远' },
    dataScope: { type: 'self', orgId: 1 },
    description: '法定负责人，对单位消防安全全面负责',
  },
  {
    key: 'fire-safety-manager',
    name: '消防安全管理人',
    orgName: '阳光物业管理有限公司',
    orgId: 1,
    user: { id: 2, name: '张建国' },
    dataScope: { type: 'self', orgId: 1 },
    description: '日常消防管理，发起工单，组织验收',
  },
  {
    key: 'duty-officer',
    name: '消控值班员',
    orgName: '阳光物业管理有限公司',
    orgId: 1,
    user: { id: 3, name: '李明辉' },
    dataScope: { type: 'self', orgId: 1 },
    description: '告警核实，紧急工单发起，24小时值守',
  },
  {
    key: 'org-admin-property',
    name: '企业管理员',
    orgName: '阳光物业管理有限公司',
    orgId: 1,
    user: { id: 4, name: '赵丽萍' },
    dataScope: { type: 'self', orgId: 1 },
    description: '管理本企业账号与权限，企业信息配置',
  },

  // ===== 服务方 — 蓝盾消防技术服务公司 =====
  {
    key: 'project-lead',
    name: '项目负责人',
    orgName: '蓝盾消防技术服务公司',
    orgId: 2,
    user: { id: 5, name: '刘建华' },
    dataScope: { type: 'service', serviceOrgId: 2 },
    description: '对接甲方，SLA 第一责任人，团队工单全貌',
  },
  {
    key: 'tech-lead',
    name: '技术负责人',
    orgName: '蓝盾消防技术服务公司',
    orgId: 2,
    user: { id: 6, name: '孙工' },
    dataScope: { type: 'service', serviceOrgId: 2 },
    description: '技术把关，审核处置结果，强制改派',
  },
  {
    key: 'maintenance-engineer',
    name: '维保工程师',
    orgName: '蓝盾消防技术服务公司',
    orgId: 2,
    user: { id: 7, name: '王志强' },
    dataScope: { type: 'assigned', assigneeId: 7 },
    description: '接单，现场处置，拍照留痕，转单',
  },
  {
    key: 'org-admin-service',
    name: '企业管理员',
    orgName: '蓝盾消防技术服务公司',
    orgId: 2,
    user: { id: 8, name: '郑晓峰' },
    dataScope: { type: 'service', serviceOrgId: 2 },
    description: '管理本公司账号与权限，资质证书管理',
  },

  // ===== 监管方 — 应急管理局安全管理中心 =====
  {
    key: 'safety-supervisor',
    name: '安全监管员',
    orgName: '应急管理局安全管理中心',
    orgId: 3,
    user: { id: 9, name: '陈浩然' },
    dataScope: { type: 'all' },
    description: '督办超时工单，核查验收，生成监管报告',
  },
  {
    key: 'org-admin-supervisor',
    name: '企业管理员',
    orgName: '应急管理局安全管理中心',
    orgId: 3,
    user: { id: 10, name: '王蕾' },
    dataScope: { type: 'all' },
    description: '管理本机关内部账号与权限',
  },

  // ===== 平台方 =====
  {
    key: 'platform-admin',
    name: '平台管理员',
    orgName: '平台运营方',
    orgId: 0,
    user: { id: 11, name: '赵启明' },
    dataScope: { type: 'platform' },
    description: '租户管理，流程模板配置，全局参数',
  },
]

// ===== 组织分组 =====

/** 按组织名称分组（用于岗位切换器显示） */
export function groupPositionsByOrg(): OrgGroup[] {
  const map = new Map<string, PositionDef[]>()
  for (const pos of ALL_POSITIONS) {
    const arr = map.get(pos.orgName) || []
    arr.push(pos)
    map.set(pos.orgName, arr)
  }
  return Array.from(map.entries()).map(([name, positions]) => ({
    name,
    positions,
  }))
}

// ===== 查找工具 =====

export function findPosition(key: PositionKey): PositionDef | undefined {
  return ALL_POSITIONS.find(p => p.key === key)
}

/** 默认岗位 */
export const DEFAULT_POSITION: PositionKey = 'fire-safety-manager'

// ===== 平台通用岗位（所有企业适用，跨企业模板配置用） =====

/** 平台通用岗位角色名称 */
export const UNIVERSAL_POSITION_ROLES = [
  '安全主管',
  '消防责任人',
  '部门负责人',
  '值班经理',
  '值班主管',
  '企业管理员',
] as const

export type UniversalPositionRole = (typeof UNIVERSAL_POSITION_ROLES)[number]

/** 企业 × 通用岗位 → 具体人员（Mock 数据，后续从企业配置中读取） */
const ENTERPRISE_POSITION_MAP: Record<number, Record<string, { id: number; name: string }>> = {
  // 阳光物业管理有限公司（orgId=1，值守中心 / 业主单位 A）
  1: {
    '安全主管': { id: 2, name: '张建国' },
    '消防责任人': { id: 1, name: '周志远' },
    '部门负责人': { id: 4, name: '赵丽萍' },
    '值班经理': { id: 3, name: '李明辉' },
    '值班主管': { id: 2, name: '张建国' },
    '企业管理员': { id: 4, name: '赵丽萍' },
  },
  // 蓝盾消防技术服务公司（orgId=2，服务方 / 业主单位 B）
  2: {
    '安全主管': { id: 5, name: '刘建华' },
    '消防责任人': { id: 6, name: '孙工' },
    '部门负责人': { id: 5, name: '刘建华' },
    '值班经理': { id: 7, name: '王志强' },
    '值班主管': { id: 6, name: '孙工' },
    '企业管理员': { id: 8, name: '郑晓峰' },
  },
  // 应急管理局安全管理中心（orgId=3，监管方）
  3: {
    '安全主管': { id: 9, name: '陈浩然' },
    '消防责任人': { id: 10, name: '王蕾' },
    '部门负责人': { id: 9, name: '陈浩然' },
    '值班经理': { id: 10, name: '王蕾' },
    '值班主管': { id: 9, name: '陈浩然' },
    '企业管理员': { id: 10, name: '王蕾' },
  },
}

/**
 * 运行时：企业 ID + 通用岗位角色名称 → 具体人员
 * @returns 人员信息，未匹配时返回 null
 */
export function resolvePositionAssignee(
  enterpriseId: number,
  roleName: string,
): { id: number; name: string } | null {
  const enterprise = ENTERPRISE_POSITION_MAP[enterpriseId]
  if (!enterprise) return null
  return enterprise[roleName] || null
}

/**
 * 获取指定企业的所有通用岗位人员列表
 */
export function getEnterprisePositions(enterpriseId: number): { roleName: string; person: { id: number; name: string } }[] {
  const enterprise = ENTERPRISE_POSITION_MAP[enterpriseId]
  if (!enterprise) return []
  return Object.entries(enterprise).map(([roleName, person]) => ({ roleName, person }))
}
