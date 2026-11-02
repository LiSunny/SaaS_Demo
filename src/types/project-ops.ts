/**
 * project-ops.ts — 项目管理（运营商侧）数据类型
 *
 * 口径见 docs/项目管理/product-design.md：
 *   项目 → 管理层级树（区划 / 自定义节点）→ 被管单位（企业 / 家庭 / 小场所）→ 设备
 *   台账单位全局唯一，一个单位可加入多个项目（§8.2 跨项目允许）
 */

/** 项目状态：待启动 / 进行中 / 已完成 */
export type ProjectStatus = 'pending' | 'running' | 'done'

/** 层级节点类型：区划节点 / 自定义节点 */
export type HierarchyNodeType = 'region' | 'custom'

/** 台账类型：企业 / 家庭 / 九小场所 */
export type UnitKind = 'enterprise' | 'family' | 'venue'

/** 单位性质（§5.2） */
export type UnitNature =
  | '党政机关'
  | '社会单位'
  | '技术服务机构'
  | '九小场所·个人'
  | '家庭'
  | '其它'

/** 设备类型（§6.5.2） */
export type DeviceType = '烟感' | '燃气' | '电气' | '摄像头' | '网关' | '其他'

/** 项目档案 */
export interface Project {
  id: string
  /** 项目编号，自动生成，不可改 */
  code: string
  name: string
  /** 项目类型 */
  type: string
  status: ProjectStatus
  /** 管理范围（省 / 市 / 区），与层级根对应 */
  region: string
  /** 管理范围级联路径 */
  regionPath: string[]
  /** 负责人 */
  owner: string
  startDate: string
  endDate: string
  remark: string
  createdAt: string
  creator: string
  /** 项目可视化：大屏 / 看板模板 id，未配置为 null */
  visual: { bigscreen: string | null; dashboard: string | null }
}

/** 层级节点（扁平存储，parentId 指向父节点） */
export interface HierarchyNode {
  id: string
  projectId: string
  parentId: string | null
  name: string
  type: HierarchyNodeType
  /** 同级排序号 */
  order: number
  /** 区划节点来源编码（自定义节点为空） */
  regionCode: string
}

/** 台账单位（全局，不属于任何项目） */
export interface ManagedUnit {
  id: string
  name: string
  kind: UnitKind
  nature: UnitNature
  /** 所属区域 */
  region: string
  address: string
  /** 负责人 / 户主 / 联系人 */
  contact: string
  phone: string
  tags: string[]
  /** 是否重点单位（重点单位台账只列企业） */
  isKeyUnit: boolean
  /** 九小场所类型 */
  venueType: string
  createdAt: string
}

/** 项目 ↔ 单位关联（接入记录） */
export interface ProjectUnit {
  projectId: string
  unitId: string
  /** 归属层级节点 id；null = 未分配 */
  nodeId: string | null
  addedAt: string
  operator: string
  /** 项目内备注 */
  remark: string
  /** 项目内标签（项目级字段，台账标签改这里不影响台账） */
  tags: string[]
  /** 项目内联系人（项目级字段） */
  contact: string
}

/** 项目设备 */
export interface ProjectDevice {
  id: string
  projectId: string
  /** 归属单位，设备不允许项目直属（§8.3） */
  unitId: string
  name: string
  type: DeviceType
  code: string
  location: string
  online: boolean
  connectedAt: string
  remark: string
}

/** 可视化模板 */
export interface VisualTemplate {
  id: string
  kind: 'bigscreen' | 'dashboard'
  name: string
  /** 应用场景 */
  scene: string
  desc: string
  /** 缩略图（CSS 渐变占位，演示用） */
  thumb: string
}

/** 项目内单位行（台账单位 + 接入信息） */
export interface ProjectUnitRow extends ManagedUnit {
  nodeId: string | null
  addedAt: string
  operator: string
  projectRemark: string
  /** 项目内标签（项目级字段） */
  projectTags: string[]
  /** 项目内联系人（项目级字段） */
  projectContact: string
  /** 设备数 */
  deviceCount: number
  /** 已加入的其他项目名 */
  otherProjects: string[]
}

/** 层级节点统计（树徽标 / 层级管理抽屉） */
export interface NodeStat {
  /** 本级直属单位数 */
  ownUnits: number
  /** 含下级单位数 */
  totalUnits: number
  ownDevices: number
  totalDevices: number
}

/** 建项：第 1 步表单 */
export interface ProjectFormPayload {
  name: string
  type: string
  regionPath: string[]
  owner: string
  startDate: string
  endDate: string
  remark: string
}

/** 建项：第 2 步——层级初始化方式 */
export type HierarchyInitMode = 'region' | 'blank' | 'copy'

/** 建项：第 2 步载荷 */
export interface HierarchyInitPayload {
  mode: HierarchyInitMode
  /** 行政区划初始化深度：市 / 区 / 街道 */
  depth: 'city' | 'district' | 'street'
  /** 复制已有项目时的来源项目 id */
  copyFromProjectId: string | null
}

/** 接入单位结果 */
export interface LinkUnitsResult {
  success: number
  skipped: number
  /** 跳过的单位名（已在本项目） */
  skippedNames: string[]
}
