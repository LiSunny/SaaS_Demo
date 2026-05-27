export type PlanStatus = 'running' | 'pending' | 'stopped' | 'expired'
export type PlanCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface MaintenancePlan {
  id: number
  planName: string
  status: PlanStatus
  deviceCount: number
  maintenanceItems: number
  maintenanceType: PlanCycle
  executor: string
  nextGenTime: string
  enabled: boolean
}

export interface PlanQuery {
  planName?: string
  status?: PlanStatus
  cycle?: PlanCycle
  page: number
  size: number
}

export interface PaginatedData<T> {
  data: T[]
  total: number
}
