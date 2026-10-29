/**
 * scene-config-http.ts — 组态画面 HTTP Adapter
 *
 * 画面主体与布局在后端（/api/scenes），节点只存图元 ID 引用。
 * 时间戳统一转 epoch ms，与前端既有 SceneConfig 类型一致。
 */
import request from '@/utils/request'
import type {
  SceneConfig,
  SceneDraft,
  SceneEdge,
  SceneNode,
  ScenePageData,
  SceneQuery,
  SceneStatus,
  SceneStyle,
  SceneSymbolReference,
} from '@/types/scene-config'

/** ISO 时间串 → epoch ms */
function toMs(v: unknown): number {
  if (!v) return Date.now()
  const t = new Date(String(v)).getTime()
  return Number.isFinite(t) ? t : Date.now()
}

/** 后端 DTO → 前端 SceneConfig */
function toScene(raw: any): SceneConfig {
  const draft = raw?.draft
  return {
    id: raw.id,
    name: raw.name,
    systemKey: raw.systemKey,
    scope: raw.scope || '',
    width: raw.width,
    height: raw.height,
    style: raw.style as SceneStyle,
    status: raw.status as SceneStatus,
    nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
    edges: Array.isArray(raw.edges) ? raw.edges : [],
    draft:
      draft && Array.isArray(draft.nodes) && Array.isArray(draft.edges)
        ? { ...draft, updatedAt: toMs(draft.updatedAt) }
        : null,
    remark: raw.remark || '',
    enterpriseId: raw.enterpriseId ?? null,
    createdBy: raw.createdBy,
    createdAt: toMs(raw.createdAt),
    updatedAt: toMs(raw.updatedAt),
  }
}

/** 画面列表（服务端分页 + 筛选） */
export async function fetchSceneList(query: SceneQuery): Promise<ScenePageData> {
  const res = await request.get('/scenes', {
    params: {
      name: query.name || undefined,
      status: query.status || undefined,
      systemKey: query.systemKey || undefined,
      page: query.page,
      size: query.size,
    },
  })
  const body = (res as any).data ?? { data: [], total: 0 }
  return {
    data: (body.data ?? []).map(toScene),
    total: body.total ?? 0,
  }
}

/** 单个画面 */
export async function fetchSceneDetail(sceneId: string): Promise<SceneConfig> {
  const res = await request.get(`/scenes/${encodeURIComponent(sceneId)}`)
  return toScene((res as any).data)
}

/** 画面候选（编辑器「读取画面」下拉，只要 id 与名称） */
export async function fetchSceneOptions(): Promise<Array<{ id: string; name: string }>> {
  const res = await request.get('/scenes/options')
  return ((res as any).data ?? []) as Array<{ id: string; name: string }>
}

/** 画面表单 */
export interface SceneFormPayload {
  name: string
  systemKey?: string
  scope?: string
  width?: number
  height?: number
  style?: SceneStyle
  status?: SceneStatus
  remark?: string
  enterpriseId?: number | null
}

/** 新增画面 */
export async function createScene(form: SceneFormPayload): Promise<SceneConfig> {
  const res = await request.post('/scenes', form)
  return toScene((res as any).data)
}

/** 更新画面字段（不含布局） */
export async function updateScene(
  sceneId: string,
  form: Partial<SceneFormPayload>,
): Promise<SceneConfig> {
  const res = await request.put(`/scenes/${encodeURIComponent(sceneId)}`, form)
  return toScene((res as any).data)
}

/** 保存画面布局（编辑器「保存」），服务端同时清空草稿 */
export async function saveSceneLayout(
  sceneId: string,
  nodes: SceneNode[],
  edges: SceneEdge[],
): Promise<SceneConfig> {
  const res = await request.put(`/scenes/${encodeURIComponent(sceneId)}/layout`, { nodes, edges })
  return toScene((res as any).data)
}

/** 保存草稿（未保存的改动），不动正式布局 */
export async function saveSceneDraft(sceneId: string, draft: SceneDraft): Promise<void> {
  await request.put(`/scenes/${encodeURIComponent(sceneId)}/draft`, draft)
}

/**
 * 保存草稿（keepalive 模式）
 *
 * 页面卸载时用：keepalive 让请求在页面关闭后继续发出，避免丢掉最后一次改动。
 * 不走 axios —— XHR 不支持 keepalive。
 */
export async function saveSceneDraftKeepalive(sceneId: string, draft: SceneDraft): Promise<void> {
  const token = localStorage.getItem('auth_token')
  await fetch(`/api/scenes/${encodeURIComponent(sceneId)}/draft`, {
    method: 'PUT',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(draft),
  })
}

/** 切换启停：草稿 ↔ 已停用 */
export async function toggleSceneStatus(sceneId: string): Promise<SceneConfig> {
  const res = await request.patch(`/scenes/${encodeURIComponent(sceneId)}/status`)
  return toScene((res as any).data)
}

/** 删除画面（服务端软删除） */
export async function removeScene(sceneId: string): Promise<void> {
  await request.delete(`/scenes/${encodeURIComponent(sceneId)}`)
}

/** 图元被哪些画面引用 */
export async function fetchSymbolReferences(symbolId: string): Promise<SceneSymbolReference[]> {
  const res = await request.get(`/scenes/references/${encodeURIComponent(symbolId)}`)
  return ((res as any).data ?? []) as SceneSymbolReference[]
}

/** 清理图元在所有画面中的残留节点 */
export async function purgeSymbolReferences(
  symbolId: string,
): Promise<{ scenes: number; nodes: number }> {
  const res = await request.post(`/scenes/references/${encodeURIComponent(symbolId)}/purge`)
  return (res as any).data ?? { scenes: 0, nodes: 0 }
}

/** 本地历史数据一次性导入载荷 */
export interface SceneImportPayload {
  scenes: Array<{
    id: string
    name: string
    systemKey?: string
    scope?: string
    width?: number
    height?: number
    style?: string
    status?: string
    remark?: string
    nodes?: SceneNode[]
    edges?: SceneEdge[]
    createdAt?: number
    updatedAt?: number
  }>
  drafts?: Record<string, SceneDraft>
}

/** 导入浏览器本地历史画面（幂等，已存在的画面 ID 跳过） */
export async function importLocalScenes(
  payload: SceneImportPayload,
): Promise<{ imported: number; skipped: number }> {
  const res = await request.post('/scenes/import', payload)
  return (res as any).data ?? { imported: 0, skipped: 0 }
}
