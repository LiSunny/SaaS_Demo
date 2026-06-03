/**
 * work-order-http.ts — 工单 HTTP 适配器
 *
 * 生产模式：通过 axios 发真实 HTTP 请求。
 */

import request from '@/utils/request'
import type { WorkOrderItem, WorkOrderQuery, WorkOrderDetail, WorkOrderStats, CreateOrderParams } from '@/types/work-order'

console.log('[work-order-http] HTTP adapter active')

export async function getWorkOrderList(query: WorkOrderQuery): Promise<import('@/types/work-order').PaginatedData<WorkOrderItem>> {
  const res = await request.get('/work-order/list', { params: query })
  return res as unknown as import('@/types/work-order').PaginatedData<WorkOrderItem>
}

export async function createWorkOrder(data: CreateOrderParams): Promise<WorkOrderItem> {
  const res = await request.post('/work-order', data)
  return res as unknown as WorkOrderItem
}

export async function getWorkOrderDetail(id: number): Promise<WorkOrderDetail> {
  const res = await request.get(`/work-order/${id}`)
  return res as unknown as WorkOrderDetail
}

export async function cancelWorkOrder(id: number, reason: string): Promise<{ id: number; orderNo: string; status: string; closedAt: string; closedBy: string }> {
  const res = await request.post(`/work-order/${id}/cancel`, { reason })
  return res as unknown as { id: number; orderNo: string; status: string; closedAt: string; closedBy: string }
}

export async function reassignWorkOrder(id: number, targetUserId: number, reason: string): Promise<{ id: number; orderNo: string; previousAssigneeName: string; currentAssigneeName: string }> {
  const res = await request.post(`/work-order/${id}/reassign`, { targetUserId, reason })
  return res as unknown as { id: number; orderNo: string; previousAssigneeName: string; currentAssigneeName: string }
}

export async function getWorkOrderStats(): Promise<WorkOrderStats> {
  const res = await request.get('/work-order/stats')
  return res as unknown as WorkOrderStats
}
