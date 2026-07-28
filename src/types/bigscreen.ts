/**
 * bigscreen.ts — 可视化大屏类型定义
 */

export type BigscreenType = 'landing' | 'gongmao' | 'enterprise-cockpit'

/** 大屏类型显示名称 */
export const BIGSCREEN_TYPE_LABELS: Record<BigscreenType, string> = {
  landing: '港南\u201C人工智能+工贸企业\u201D自律远程监管平台',
  gongmao: '工贸企业驾驶舱',
  'enterprise-cockpit': '泉州\u201C人工智能+应消联勤\u201D一体化管控平台',
}

/** 应用场景预设选项 */
export const BIGSCREEN_SCENARIO_OPTIONS = [
  '政府区域监管',
  '消防监控',
  '街道治理',
  '应急指挥',
  '维保调度',
  '安防监控',
  '园区管理',
]

/** 大屏本身 */
export interface BigscreenItem {
  id: number
  name: string
  type: BigscreenType
  scenario: string
  thumbnail: string
  description: string
  tags: string[]
  status: number
  sortOrder: number
  enterpriseCount: number
  createdBy: number
  createdAt: string
}

/** 大屏-企业关联项 */
export interface BigscreenEnterpriseItem {
  id: number
  enterpriseId: number
  enterpriseName: string
  isDefault: boolean
  status: number
  createdAt: string
}

/** 大屏详情（含关联企业列表） */
export interface BigscreenDetail extends BigscreenItem {
  enterprises: BigscreenEnterpriseItem[]
}

/** 创建/编辑大屏表单 */
export interface BigscreenForm {
  name: string
  type: BigscreenType
  scenario: string
  thumbnail: string
  description: string
  tags: string[]
  status: number
  sortOrder: number
}

/** 关联企业表单 */
export interface AssociateEnterpriseForm {
  enterpriseId: number
  isDefault: boolean
}

/** 列表查询参数 */
export interface BigscreenQuery {
  page: number
  size: number
  keyword?: string
  type?: string
  scenario?: string
}

/** 分页数据 */
export interface PaginatedData<T> {
  data: T[]
  total: number
}

/** 企业端：用户可用大屏（含关联企业信息） */
export interface UserBigscreenItem extends BigscreenItem {
  enterpriseId: number
  enterpriseName: string
  isDefault: boolean
  relationId: number
}
