import request from '@/utils/request'
import type { PositionItem, PositionQuery, PositionForm, PositionDetail, PermissionConfig, PaginatedData } from '@/types/position-admin'

const BASE = '/admin/positions'

export async function getPositionList(query: PositionQuery): Promise<PaginatedData<PositionItem>> {
  const res = await request.get(`${BASE}/list`, { params: query })
  const result = res as any
  // 兼容有些接口直接返回数组的情况
  if (Array.isArray(result)) return { data: result, total: result.length }
  return result.data ?? result
}

export async function getPositionDetail(id: number): Promise<PositionDetail> {
  const res = await request.get(`${BASE}/${id}`)
  return (res as any).data
}

export async function createPosition(form: PositionForm): Promise<PositionItem> {
  const res = await request.post(BASE, form)
  return (res as any).data
}

export async function updatePosition(id: number, form: PositionForm): Promise<PositionItem> {
  const res = await request.put(`${BASE}/${id}`, form)
  return (res as any).data
}

export async function deletePosition(id: number): Promise<void> {
  await request.delete(`${BASE}/${id}`)
}

export async function savePermissions(id: number, config: PermissionConfig): Promise<PositionDetail> {
  const res = await request.put(`${BASE}/${id}/permissions`, config)
  return (res as any).data
}
