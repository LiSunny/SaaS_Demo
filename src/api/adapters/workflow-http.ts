/**
 * workflow-http.ts — 流程模板 HTTP 适配器
 *
 * 生产模式：通过 request.ts (axios) 发真实 HTTP 请求到后端。
 * 所有函数签名与 workflow-dao.ts 完全一致，Store/View 零改动。
 *
 * 使用方式：
 *   1. 后端实现 RESTful API（路由见注释）
 *   2. vite.config.ts 配置 server.proxy 指向后端地址
 *   3. 构建时设置 VITE_API_MODE=real
 *
 * 路由约定（与当前 API 函数一一对应）：
 *   GET    /api/workflow/templates        → getTemplateList
 *   GET    /api/workflow/templates/:id    → getTemplate
 *   POST   /api/workflow/templates        → createTemplate
 *   PUT    /api/workflow/templates/:id    → updateTemplate
 *   DELETE /api/workflow/templates/:id    → deleteTemplate
 *   POST   /api/workflow/templates/batch  → batchDeleteTemplates
 *   PATCH  /api/workflow/templates/:id/status → updateTemplateStatus
 *   GET    /api/workflow/templates/:id/detail  → getTemplateDetail
 *   POST   /api/workflow/templates/draft       → saveTemplateDraft
 *   POST   /api/workflow/templates/:id/publish → publishTemplate
 *   POST   /api/workflow/validate              → validateFlowDefinition
 *   POST   /api/upload/files                   → uploadFile
 */

import request from '@/utils/request'
import type { TemplateItem, TemplateQuery, TemplateForm, TemplateDetail, FlowDefinition } from '@/types/workflow'
import type { PageResult } from '@/utils/dao-engine'

// 首次加载时输出日志，方便确认当前模式
console.log('[workflow-http] HTTP adapter active — requests go to /api/')

export async function getTemplateList(params: TemplateQuery): Promise<PageResult<TemplateItem>> {
  const res = await request.get('/workflow/templates', { params })
  return res as unknown as PageResult<TemplateItem>
}

export async function getTemplate(id: number): Promise<TemplateItem | undefined> {
  const res = await request.get(`/workflow/templates/${id}`)
  return res as unknown as TemplateItem | undefined
}

export async function createTemplate(data: TemplateForm): Promise<TemplateItem> {
  const res = await request.post('/workflow/templates', data)
  return res as unknown as TemplateItem
}

export async function updateTemplate(id: number, data: Partial<TemplateForm>): Promise<TemplateItem | undefined> {
  const res = await request.put(`/workflow/templates/${id}`, data)
  return res as unknown as TemplateItem | undefined
}

export async function deleteTemplate(id: number): Promise<void> {
  await request.delete(`/workflow/templates/${id}`)
}

export async function batchDeleteTemplates(ids: number[]): Promise<void> {
  await request.post('/workflow/templates/batch-delete', { ids })
}

export async function updateTemplateStatus(id: number, status: number): Promise<void> {
  await request.patch(`/workflow/templates/${id}/status`, { status })
}

export async function getTemplateDetail(id: number): Promise<TemplateDetail | undefined> {
  const res = await request.get(`/workflow/templates/${id}/detail`)
  return res as unknown as TemplateDetail | undefined
}

export async function saveTemplateDraft(data: TemplateDetail): Promise<{ id: number }> {
  const res = await request.post('/workflow/templates/draft', data)
  return res as unknown as { id: number }
}

export async function publishTemplate(id: number): Promise<TemplateItem> {
  const res = await request.post(`/workflow/templates/${id}/publish`)
  return res as unknown as TemplateItem
}

export async function validateFlowDefinition(def: FlowDefinition): Promise<{ valid: boolean; errors: string[] }> {
  const res = await request.post('/workflow/validate', def)
  return res as unknown as { valid: boolean; errors: string[] }
}

export async function uploadFile(formData: FormData): Promise<{ url: string }> {
  const res = await request.post('/upload/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res as unknown as { url: string }
}
