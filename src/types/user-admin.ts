// ===== 用户管理 M0 类型 =====

export interface UserItem {
  id: number
  phone: string
  realName: string
  email: string
  status: number          // 1=启用, 0=停用
  enterpriseCount: number  // 关联企业数
  createdAt: string        // YYYY-MM-DD HH:mm
  lastLoginAt: string | null
  lastLoginIp: string | null
}

export interface UserQuery {
  keyword?: string
  page: number
  size: number
}

export interface CreateUserForm {
  phone: string
  realName: string
  password: string
}

export interface UpdateUserForm {
  realName: string
  email: string
}

export interface UserEnterpriseItem {
  enterpriseId: number
  enterpriseName: string
  positions: string[]
  joinedAt: string
}

export interface PaginatedData<T> {
  data: T[]
  total: number
}
