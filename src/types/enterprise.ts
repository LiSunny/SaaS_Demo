// ===== 枚举 =====

/** 企业状态 */
export type EnterpriseStatus = 1 | 0 | 2 // 有效 | 已锁定 | 已过期

/** 维度 C 行业分类 */
export interface DimC {
  code: string
  name: string
}

/** 关系角色（相关方关联时指定，"我的"视角） */
export type PartnerRole = 'my_supervisor' | 'my_manager' | 'my_service_provider' | 'my_customer' | 'my_collaborator'

// ===== 列表相关 =====

export interface EnterpriseItem {
  id: string
  name: string
  code: string
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
  tags: string[]
  relatedAt: string
  operatorName: string
}

export interface PartnerItem {
  id: string
  enterpriseId: string
  enterpriseName: string
  role: PartnerRole
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
