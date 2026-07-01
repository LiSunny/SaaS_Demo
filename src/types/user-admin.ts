// ===== 用户管理 M0 类型 =====

export interface UserItem {
  id: number
  phone: string
  realName: string
  email: string
  status: number          // 1=启用, 0=停用
  systemRole: string | null  // null=普通用户, platform-ops=运营管理, platform-admin=技术管理
  enterpriseCount: number  // 关联企业数（系统角色用户为 0）
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
  systemRole?: string | null  // 系统角色，非空时跳过企业关联
}

export interface UpdateUserForm {
  realName: string
  email: string
  systemRole?: string | null  // 系统角色，非空时跳过企业关联
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
