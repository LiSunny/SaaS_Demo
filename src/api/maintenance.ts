import request from '@/utils/request'
import type { MaintenancePlan, PlanQuery, PaginatedData } from '@/types/maintenance'

// --- Mock 数据（无后端时使用）---
const mockData: MaintenancePlan[] = [
  { id: 1, planName: '回流焊炉日保养计划', status: 'running', deviceCount: 2, maintenanceItems: 10, maintenanceType: 'daily', executor: '杨婷彤', nextGenTime: '2025-10-09 09:40', enabled: true },
  { id: 2, planName: '回流焊炉周保养计划', status: 'pending', deviceCount: 2, maintenanceItems: 10, maintenanceType: 'weekly', executor: '维修一部', nextGenTime: '2025-10-09 09:40', enabled: true },
  { id: 3, planName: '回流焊炉月保养计划', status: 'stopped', deviceCount: 2, maintenanceItems: 10, maintenanceType: 'monthly', executor: '电工', nextGenTime: '2025-10-09 09:40', enabled: false },
  { id: 4, planName: '回流焊炉季保养计划', status: 'expired', deviceCount: 2, maintenanceItems: 10, maintenanceType: 'quarterly', executor: '梁冬', nextGenTime: '2025-10-09 09:40', enabled: false },
  { id: 5, planName: '灭火器保养计划', status: 'pending', deviceCount: 168, maintenanceItems: 5, maintenanceType: 'yearly', executor: '陈洪燕', nextGenTime: '2025-10-09 09:40', enabled: true },
]

let dataStore = [...mockData]

// --- 实际 API 调用（mock 实现）---
export function getPlanList(params: PlanQuery): Promise<PaginatedData<MaintenancePlan>> {
  let list = [...dataStore]
  if (params.planName) list = list.filter((i) => i.planName.includes(params.planName!))
  if (params.status) list = list.filter((i) => i.status === params.status)
  if (params.cycle) list = list.filter((i) => i.maintenanceType === params.cycle)
  const total = list.length
  const start = (params.page - 1) * params.size
  const data = list.slice(start, start + params.size)
  return Promise.resolve({ data, total })
}

export function getPlanDetail(id: number): Promise<MaintenancePlan | undefined> {
  return Promise.resolve(dataStore.find((i) => i.id === id))
}

export function createPlan(data: Partial<MaintenancePlan>): Promise<MaintenancePlan> {
  const plan = { id: Date.now(), ...data } as MaintenancePlan
  dataStore.unshift(plan)
  return Promise.resolve(plan)
}

export function updatePlan(id: number, data: Partial<MaintenancePlan>): Promise<MaintenancePlan | undefined> {
  const idx = dataStore.findIndex((i) => i.id === id)
  if (idx > -1) dataStore[idx] = { ...dataStore[idx], ...data }
  return Promise.resolve(dataStore[idx])
}

export function deletePlan(id: number) {
  dataStore = dataStore.filter((i) => i.id !== id)
  return Promise.resolve()
}

export function copyPlan(id: number): Promise<MaintenancePlan> {
  const source = dataStore.find((i) => i.id === id)!
  const plan = { ...source, id: Date.now(), planName: source.planName + ' (副本)' }
  dataStore.unshift(plan)
  return Promise.resolve(plan)
}

export function togglePlanStatus(id: number, enabled: boolean) {
  const plan = dataStore.find((i) => i.id === id)
  if (plan) plan.enabled = enabled
  return Promise.resolve()
}
