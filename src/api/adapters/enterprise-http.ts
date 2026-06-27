/**
 * enterprise-http.ts — 租户管理 HTTP 适配器
 *
 * 生产模式：通过 axios 发真实 HTTP 请求到后端。
 */
import request from '@/utils/request'
import type { EnterpriseItem, EnterpriseQuery, EnterpriseForm, SubordinateItem, PartnerItem, OperationLogItem, PaginatedData, DictItem, ModuleTreeNode } from '@/types/enterprise'

console.log('[enterprise-http] HTTP adapter active')

export async function getEnterpriseList(query: EnterpriseQuery): Promise<PaginatedData<EnterpriseItem>> {
  const res: any = await request.get('/enterprise/list', { params: query })
  return res.data
}

export async function getEnterpriseDetail(id: string): Promise<EnterpriseItem> {
  const res: any = await request.get(`/enterprise/${id}`)
  return res.data
}

export async function createEnterprise(form: EnterpriseForm): Promise<EnterpriseItem> {
  const res: any = await request.post('/enterprise', form)
  return res.data
}

export async function updateEnterprise(id: string, form: Partial<EnterpriseForm>): Promise<EnterpriseItem> {
  const res: any = await request.put(`/enterprise/${id}`, form)
  return res.data
}

export async function lockEnterprise(id: string): Promise<EnterpriseItem> {
  const res: any = await request.post(`/enterprise/${id}/lock`)
  return res.data
}

export async function extendEnterprise(id: string, validTo: string): Promise<EnterpriseItem> {
  const res: any = await request.post(`/enterprise/${id}/extend`, { validTo })
  return res.data
}

export async function batchDeleteEnterprises(ids: string[]): Promise<void> {
  await request.post('/enterprise/batch-delete', { ids })
}

export async function getSubordinates(enterpriseId: string, query: { keyword?: string; page: number; size: number }): Promise<PaginatedData<SubordinateItem>> {
  const res: any = await request.get(`/enterprise/${enterpriseId}/subordinates`, { params: query })
  return res.data
}

export async function addSubordinates(enterpriseId: string, enterpriseIds: string[]): Promise<void> {
  await request.post(`/enterprise/${enterpriseId}/subordinates`, { ids: enterpriseIds })
}

export async function removeSubordinates(enterpriseId: string, relationIds: string[]): Promise<void> {
  await request.delete(`/enterprise/${enterpriseId}/subordinates`, { data: { ids: relationIds } })
}

export async function getPartners(enterpriseId: string, query: { keyword?: string; tag?: string; page: number; size: number }): Promise<PaginatedData<PartnerItem>> {
  const res: any = await request.get(`/enterprise/${enterpriseId}/partners`, { params: query })
  return res.data
}

export async function addPartners(enterpriseId: string, enterpriseIds: string[]): Promise<void> {
  await request.post(`/enterprise/${enterpriseId}/partners`, { ids: enterpriseIds })
}

export async function removePartners(enterpriseId: string, relationIds: string[]): Promise<void> {
  await request.delete(`/enterprise/${enterpriseId}/partners`, { data: { ids: relationIds } })
}

export async function savePartnerAuth(relationId: string, data: { authUnits: string[]; allowOperation: boolean }): Promise<PartnerItem> {
  const res: any = await request.put(`/enterprise/partners/${relationId}/auth`, data)
  return res.data
}

export async function getOperationLogs(enterpriseId: string, query: { page: number; size: number }): Promise<PaginatedData<OperationLogItem>> {
  const res: any = await request.get(`/enterprise/${enterpriseId}/logs`, { params: query })
  return res.data
}

export async function getEnterpriseQrcode(id: string): Promise<string> {
  const res: any = await request.get(`/enterprise/${id}/qrcode`)
  return res.data?.url || ''
}

export async function regenerateQrcode(id: string): Promise<string> {
  const res: any = await request.post(`/enterprise/${id}/qrcode/regenerate`)
  return res.data?.url || ''
}

export async function searchEnterprises(keyword: string): Promise<EnterpriseItem[]> {
  const res: any = await request.get('/enterprise/search', { params: { keyword } })
  return res.data || res
}

export async function getRelationRoleDict(): Promise<{ data: { value: string; label: string; description: string }[] }> {
  const res: any = await request.get('/enterprise/dict/relation-roles')
  return { data: res }
}

export async function getDictB(): Promise<{ data: DictItem[] }> {
  const res: any = await request.get('/enterprise/dict/b')
  return { data: res }
}

export async function getDictC(): Promise<{ data: DictItem[] }> {
  const res: any = await request.get('/enterprise/dict/c')
  return { data: res }
}

export async function getDictD(): Promise<{ data: DictItem[] }> {
  const res: any = await request.get('/enterprise/dict/d')
  return { data: res }
}

export async function getModuleTree(): Promise<{ data: ModuleTreeNode[] }> {
  const res: any = await request.get('/enterprise/dict/module-tree')
  return { data: res }
}
