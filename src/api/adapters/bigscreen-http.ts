/**
 * bigscreen-http.ts — 大屏管理 HTTP 适配器
 */
import request from '@/utils/request'
import type { BigscreenItem, BigscreenDetail, BigscreenForm, BigscreenEnterpriseItem, AssociateEnterpriseForm, BigscreenQuery, PaginatedData, UserBigscreenItem } from '@/types/bigscreen'

console.log('[bigscreen-http] HTTP adapter active')

// ===== 大屏 CRUD（运营管理端） =====

export async function getBigscreenList(params: BigscreenQuery): Promise<PaginatedData<BigscreenItem>> {
  const res = await request.get('/admin/bigscreens', { params })
  return (res as any).data
}

export async function getBigscreenDetail(id: number): Promise<BigscreenDetail> {
  const res = await request.get(`/admin/bigscreens/${id}`)
  return (res as any).data
}

export async function createBigscreen(form: BigscreenForm): Promise<BigscreenItem> {
  const res = await request.post('/admin/bigscreens', form)
  return (res as any).data
}

export async function updateBigscreen(id: number, form: Partial<BigscreenForm>): Promise<BigscreenItem> {
  const res = await request.put(`/admin/bigscreens/${id}`, form)
  return (res as any).data
}

export async function deleteBigscreen(id: number): Promise<void> {
  await request.delete(`/admin/bigscreens/${id}`)
}

// ===== 大屏关联企业管理 =====

export async function getBigscreenEnterprises(id: number): Promise<BigscreenEnterpriseItem[]> {
  const res = await request.get(`/admin/bigscreens/${id}/enterprises`)
  return (res as any).data
}

export async function addBigscreenEnterprise(id: number, form: AssociateEnterpriseForm): Promise<BigscreenEnterpriseItem> {
  const res = await request.post(`/admin/bigscreens/${id}/enterprises`, form)
  return (res as any).data
}

export async function updateBigscreenEnterprise(bigscreenId: number, enterpriseId: number, form: { isDefault?: boolean }): Promise<BigscreenEnterpriseItem> {
  const res = await request.put(`/admin/bigscreens/${bigscreenId}/enterprises/${enterpriseId}`, form)
  return (res as any).data
}

export async function removeBigscreenEnterprise(bigscreenId: number, enterpriseId: number): Promise<void> {
  await request.delete(`/admin/bigscreens/${bigscreenId}/enterprises/${enterpriseId}`)
}

// ===== 企业端查询 =====

export async function getUserBigscreens(): Promise<UserBigscreenItem[]> {
  const res = await request.get('/user/bigscreens')
  return (res as any).data
}

export async function getUserDefaultBigscreen(): Promise<BigscreenItem | null> {
  try {
    const res = await request.get('/user/bigscreens/default')
    return (res as any).data
  } catch (err: any) {
    if (err?.response?.status === 204) return null
    throw err
  }
}
