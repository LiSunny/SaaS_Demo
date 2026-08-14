/**
 * test-data.ts — 测试数据管理 API（告警/隐患/设备）
 * 走真实 HTTP API（Agent 数据链测试工具）
 */
import request from '@/utils/request'

export interface TestEnterprise {
  id: number
  name: string
  groups: string[]
}

export interface AlarmItem {
  id: number
  point: string
  type: string
  level: string
  status: string
  occurredAt: string
  enterpriseId: number
  enterpriseName: string
}

export interface HazardItem {
  id: number
  location: string
  category: string
  level: string
  status: string
  foundAt: string
  description: string
  enterpriseId: number
  enterpriseName: string
}

export interface DeviceItem {
  id: number
  name: string
  type: string
  status: string
  location: string
  enterpriseId: number
  enterpriseName: string
}

export interface Paginated<T> {
  data: T[]
  total: number
}

export interface Query {
  page?: number
  size?: number
  keyword?: string
  enterpriseId?: number
  status?: string
}

// ===== 企业（下拉） =====
export async function getEnterprises(): Promise<TestEnterprise[]> {
  const res = await request.get('/test-data/enterprises')
  return (res as any).data
}

// ===== 告警 =====
export async function getAlarms(q: Query): Promise<Paginated<AlarmItem>> {
  const res = await request.get('/test-data/alarms', { params: q })
  return (res as any).data
}
export async function createAlarm(form: any) {
  const res = await request.post('/test-data/alarms', form)
  return (res as any).data
}
export async function updateAlarm(id: number, form: any) {
  const res = await request.put(`/test-data/alarms/${id}`, form)
  return (res as any).data
}
export async function deleteAlarm(id: number) {
  await request.delete(`/test-data/alarms/${id}`)
}

// ===== 隐患 =====
export async function getHazards(q: Query): Promise<Paginated<HazardItem>> {
  const res = await request.get('/test-data/hazards', { params: q })
  return (res as any).data
}
export async function createHazard(form: any) {
  const res = await request.post('/test-data/hazards', form)
  return (res as any).data
}
export async function updateHazard(id: number, form: any) {
  const res = await request.put(`/test-data/hazards/${id}`, form)
  return (res as any).data
}
export async function deleteHazard(id: number) {
  await request.delete(`/test-data/hazards/${id}`)
}

// ===== 设备 =====
export async function getDevices(q: Query): Promise<Paginated<DeviceItem>> {
  const res = await request.get('/test-data/devices', { params: q })
  return (res as any).data
}
export async function createDevice(form: any) {
  const res = await request.post('/test-data/devices', form)
  return (res as any).data
}
export async function updateDevice(id: number, form: any) {
  const res = await request.put(`/test-data/devices/${id}`, form)
  return (res as any).data
}
export async function deleteDevice(id: number) {
  await request.delete(`/test-data/devices/${id}`)
}
