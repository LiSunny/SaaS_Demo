export interface DeviceItem {
  id: string
  name: string
  type: string
  location: string
  status: number // 0-停用 1-启用 2-维护中
  createdAt: string
}

export interface DeviceQuery {
  keyword?: string
  status?: string
  page: number
  size: number
}

export interface PaginatedData<T> {
  data: T[]
  total: number
}
