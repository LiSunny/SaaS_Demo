// ===== 岗位管理 M2 类型 =====

export interface PositionItem {
  id: number
  name: string
  key: string
  description: string
  userCount: number
  isBuiltin: boolean       // M2 列表固定 true
  createdAt: string        // YYYY-MM-DD HH:mm
}

export interface PositionQuery {
  keyword?: string
  page: number
  size: number
}

export interface PositionForm {
  name: string
  key: string              // 新建时输入，编辑时不可修改
  description: string
}

export interface PositionDetail extends PositionItem {
  permissions: PermissionConfig
}

export interface PermissionConfig {
  moduleAccess: string[]
  dataOperations: Record<string, string[]>
  managementOperations: string[]
}

export interface PaginatedData<T> {
  data: T[]
  total: number
}

/** 中文名称 → 拼音 slug（简单映射，英文直接保留） */
export function nameToKey(name: string): string {
  return name
    .replace(/[^一-龥a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}
