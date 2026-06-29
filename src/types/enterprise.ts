// ===== 枚举 =====

/** 企业状态 */
export type EnterpriseStatus = 1 | 0 | 2 // 有效 | 已锁定 | 已过期

/** 维度 C 行业分类 */
export interface DimC {
  code: string
  name: string
}

/** 关系角色（相关方关联时指定，"我的"视角，v1.1） */
export type PartnerRole = 'my_supervisor' | 'my_manager' | 'social_unit' | 'my_service_unit' | 'my_operator'

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
  mapLng: number
  mapLat: number
  mapLocation: string
  mapAddress: string
  creatorName: string
  staffCount: number
  unitCount: number
  relCount: number
  createdAt: string
  updatedAt: string
  /** 软删除标记，非空表示已删除 */
  deletedAt?: string
  /** 企业管理员账号信息（创建/详情时返回） */
  adminAccount?: {
    phone: string
    name: string
    isNewUser?: boolean
    initialPassword?: string
  } | null
}

export interface EnterpriseQuery {
  keyword?: string
  dimB?: string
  dimC?: string
  dimD?: string
  page: number
  size: number
  /** 是否包含已软删除的记录 */
  includeDeleted?: boolean
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
  // GIS 地图标注
  mapLng: number | string
  mapLat: number | string
  mapAddress: string
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
  roleLabel: string
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

// ===== 相关方查询/表单 =====

export interface PartnerQuery {
  keyword?: string
  role?: string
  page: number
  size: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PartnerBindForm {
  enterpriseId: string
  role: PartnerRole
  tags?: string[]
}

export interface PartnerAuthForm {
  authUnits: string[]
  allowOperation: boolean
}

export interface PartnerRoleOption {
  value: string
  label: string
  description: string
}

export interface PartnerRoleNode {
  value: string
  label: string
  children?: PartnerRoleNode[]
}

// ===== 企业搜索(关联弹窗用) =====

export interface EnterpriseSearchItem {
  id: string
  name: string
  tags?: string[]
}

// ===== M1 企业用户管理 =====

export interface MemberItem {
  id: number
  userId: number
  phone: string
  realName: string
  positions: string[]       // position key 列表
  status: number
  joinedAt: string
  inviterName: string
  remark: string
}

export interface MemberQuery {
  keyword?: string
  positionKey?: string
  page: number
  size: number
}

export interface AddMemberForm {
  phone: string
  realName?: string
  positions: string[]
}

export interface UpdateMemberForm {
  positions?: string[]
  remark?: string
}
