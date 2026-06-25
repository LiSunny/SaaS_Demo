// ===== 枚举 =====

/** 企业状态 */
export type EnterpriseStatus = 1 | 0 | 2 // 有效 | 已锁定 | 已过期

/** 维度 A — 平台管理角色（三级） */
export type DimALevel1 = 'supervisor' | 'manager' | 'social_unit' | 'service_unit' | 'platform_operator'
export type DimALevel2 = 'space_manager' | 'group_manager' | null
export type DimALevel3 =
  | 'fire_rescue' | 'emergency_mgmt' | 'local_gov' | 'industry_supervisor'
  | 'property_mgr' | 'park_mgr' | 'market_mgr' | 'complex_mgr' | 'commercial_street_mgr'
  | 'fire_tech_service'
  | null

export interface DimA {
  level1: DimALevel1
  level2: DimALevel2
  level3: DimALevel3
}

export interface DimC {
  code: string
  name: string
}

// ===== 列表相关 =====

export interface EnterpriseItem {
  id: string
  name: string
  code: string
  dimA: DimA
  dimB: string
  dimC: DimC
  dimD: string
  region: string
  contactName: string
  contactPhone: string
  status: EnterpriseStatus
  validFrom: string
  validTo: string
  parentId: string
  parentName: string
  tags: string[]
  address: string
  remark: string
  logo: string
  qrcode: string
  creatorName: string
  staffCount: number
  unitCount: number
  relCount: number
  createdAt: string
  updatedAt: string
}

export interface EnterpriseQuery {
  keyword?: string
  dimALevel1?: DimALevel1
  dimB?: string
  dimC?: string
  dimD?: string
  page: number
  size: number
}

// ===== 表单相关 =====

export interface EnterpriseForm {
  name: string
  contactName: string
  contactPhone: string
  tags: string
  validFrom: string
  validTo: string
  region: string
  parentId: string
  address: string
  remark: string
  logo: string
  dimA: DimA
  dimB: string
  dimC: string
  dimD: string
  appConfig: Record<string, string[]>
}

// ===== 关联实体 =====

export interface SubordinateItem {
  id: string
  enterpriseId: string
  enterpriseName: string
  dimALevel1: DimALevel1
  tags: string[]
  relatedAt: string
  operatorName: string
}

export interface PartnerItem {
  id: string
  enterpriseId: string
  enterpriseName: string
  tags: string[]
  contactName: string
  contactPhone: string
  relatedAt: string
  operatorName: string
  authUnits: string[]
  allowOperation: boolean
}

export interface OperationLogItem {
  id: string
  action: string
  timestamp: string
  operatorName: string
  details: { label: string; value: string }[]
}

// ===== 字典 =====

export interface DictItem {
  value: string
  label: string
  children?: DictItem[]
}

export interface ModuleTreeNode {
  key: string
  label: string
  children?: ModuleTreeNode[]
}

// ===== 分页 =====

export interface PaginatedData<T> {
  data: T[]
  total: number
}
