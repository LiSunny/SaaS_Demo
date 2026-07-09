import request from '@/utils/request'
import type { PositionItem, PositionQuery, PositionForm, PositionDetail, PermissionConfig, PaginatedData } from '@/types/position-admin'

function BASE(enterpriseId: number) {
  return `/enterprise/${enterpriseId}/positions`
}

export async function getEnterprisePositionList(enterpriseId: number, query: PositionQuery): Promise<PaginatedData<PositionItem>> {
  const res = await request.get(`${BASE(enterpriseId)}/list`, { params: query })
  const result = res as any
  if (Array.isArray(result)) return { data: result, total: result.length }
  return result.data ?? result
}

export async function getEnterprisePositionDetail(enterpriseId: number, id: number): Promise<PositionDetail> {
  const res = await request.get(`${BASE(enterpriseId)}/${id}`)
  return (res as any).data
}

export async function createEnterprisePosition(enterpriseId: number, form: PositionForm): Promise<PositionItem> {
  const res = await request.post(BASE(enterpriseId), form)
  return (res as any).data
}

export async function updateEnterprisePosition(enterpriseId: number, id: number, form: PositionForm): Promise<PositionItem> {
  const res = await request.put(`${BASE(enterpriseId)}/${id}`, form)
  return (res as any).data
}

export async function deleteEnterprisePosition(enterpriseId: number, id: number): Promise<void> {
  await request.delete(`${BASE(enterpriseId)}/${id}`)
}

export async function saveEnterprisePositionPermissions(enterpriseId: number, id: number, config: PermissionConfig): Promise<PositionDetail> {
  const res = await request.put(`${BASE(enterpriseId)}/${id}/permissions`, config)
  return (res as any).data
}
