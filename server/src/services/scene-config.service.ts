import db from '../config/db.js'

// ============================================================
// 组态画面 Service
//
// 画面主体与布局入 Prisma：节点只存图元 ID 引用（symbol），
// 产品图在 OSS，布局是 KB 级 JSON，无需拆表。
//
// 归属口径与自定义图元一致：enterpriseId=null → 平台级共享；
// 否则企业私有，仅所属企业可见。
//
// 删除为软删除（deletedAt）：组态画面是配置资产，误删代价高。
// ============================================================

/** 画面节点 */
export interface SceneNode {
  id: string
  symbol: string
  x: number
  y: number
  size?: number
  label?: string
  point?: string
  value?: string
  state?: Record<string, boolean>
}

/** 连线 */
export interface SceneEdge {
  id: string
  from: { node: string; port?: number }
  to: { node: string; port?: number }
  via?: [number, number][]
  kind?: 'pipe' | 'control'
  routeMode?: string
  flow?: string
}

/** 编辑器草稿 */
export interface SceneDraft {
  name?: string
  style?: string
  width?: number
  height?: number
  nodes: SceneNode[]
  edges: SceneEdge[]
  /** 草稿时间戳（epoch ms），与画面 updatedAt 比较决定是否恢复 */
  updatedAt: number
}

/** 新增 / 编辑表单 */
export interface SceneForm {
  name: string
  systemKey?: string
  scope?: string
  width?: number
  height?: number
  style?: string
  status?: string
  remark?: string
  enterpriseId?: number | null
}

/** 列表查询 */
export interface SceneQuery {
  name?: string
  status?: string
  systemKey?: string
  page: number
  size: number
}

/** 批量导入载荷（浏览器本地历史数据一次性入库） */
export interface SceneImportPayload {
  scenes: Array<
    Partial<SceneForm> & {
      id: string
      nodes?: SceneNode[]
      edges?: SceneEdge[]
      createdAt?: number
      updatedAt?: number
    }
  >
  /** 按画面 ID 索引的草稿 */
  drafts?: Record<string, SceneDraft>
}

const STATUSES = ['draft', 'published', 'disabled']
const STYLES = ['image', 'line']

function bad(message: string): never {
  throw Object.assign(new Error(message), { statusCode: 400 })
}

function parseJSON<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw)
    return (v ?? fallback) as T
  } catch {
    return fallback
  }
}

/** 生成画面业务 ID */
function newSceneId(): string {
  return 'scene-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function toItem(r: any) {
  return {
    id: r.sceneId,
    name: r.name,
    systemKey: r.systemKey,
    scope: r.scope || '',
    width: r.width,
    height: r.height,
    style: r.style,
    status: r.status,
    nodes: parseJSON<SceneNode[]>(r.nodesJson, []),
    edges: parseJSON<SceneEdge[]>(r.edgesJson, []),
    draft: parseJSON<SceneDraft | null>(r.draftJson, null),
    remark: r.remark || '',
    enterpriseId: r.enterpriseId,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

/** 用户可见的企业 ID 列表 */
async function visibleEnterpriseIds(userId: number): Promise<number[]> {
  const relations = await db.userEnterprise.findMany({
    where: { userId, status: 1 },
    select: { enterpriseId: true },
  })
  return relations.map((r) => r.enterpriseId)
}

/** 可见性条件：平台级共享 + 本人所属企业私有 */
async function visibilityWhere(userId: number) {
  const enterpriseIds = await visibleEnterpriseIds(userId)
  return {
    deletedAt: null,
    OR: [{ enterpriseId: null }, { enterpriseId: { in: enterpriseIds } }],
  }
}

/** 校验并归一化表单 */
function normalizeForm(form: SceneForm, base?: Partial<SceneForm>) {
  const name = (form.name ?? base?.name ?? '').trim()
  if (!name) bad('请填写画面名称')
  if (name.length > 50) bad('画面名称不超过 50 字')

  const status = form.status ?? base?.status ?? 'draft'
  if (!STATUSES.includes(status)) bad('画面状态非法')

  const style = form.style ?? base?.style ?? 'image'
  if (!STYLES.includes(style)) bad('图形风格非法')

  const width = form.width ?? base?.width ?? 1200
  const height = form.height ?? base?.height ?? 700
  if (!Number.isFinite(width) || width < 600 || width > 4000) bad('画布宽度需在 600~4000 之间')
  if (!Number.isFinite(height) || height < 400 || height > 3000) bad('画布高度需在 400~3000 之间')

  return {
    name,
    systemKey: form.systemKey ?? base?.systemKey ?? 'pipeline',
    scope: form.scope ?? base?.scope ?? '',
    width: Math.round(width),
    height: Math.round(height),
    style,
    status,
    remark: form.remark ?? base?.remark ?? '',
    enterpriseId: form.enterpriseId === undefined ? base?.enterpriseId ?? null : form.enterpriseId,
  }
}

// ===== 列表 =====

/**
 * 画面列表（服务端分页 + 筛选）
 */
export async function getList(userId: number, query: SceneQuery) {
  const where: any = await visibilityWhere(userId)

  if (query.name) where.name = { contains: query.name.trim() }
  if (query.status) where.status = query.status
  if (query.systemKey) where.systemKey = query.systemKey

  const size = Math.min(Math.max(query.size || 20, 1), 100)
  const page = Math.max(query.page || 1, 1)

  const [rows, total] = await Promise.all([
    db.sceneConfig.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * size,
      take: size,
    }),
    db.sceneConfig.count({ where }),
  ])

  return { data: rows.map(toItem), total }
}

/** 单个画面 */
export async function getDetail(userId: number, sceneId: string) {
  const row = await db.sceneConfig.findFirst({
    where: { sceneId, ...(await visibilityWhere(userId)) },
  })
  if (!row) throw Object.assign(new Error('画面不存在或已删除'), { statusCode: 404 })
  return toItem(row)
}

/** 画面候选（编辑器「读取画面」下拉，只要 id 与名称） */
export async function getOptions(userId: number) {
  const where = await visibilityWhere(userId)
  const rows = await db.sceneConfig.findMany({
    where,
    select: { sceneId: true, name: true },
    orderBy: [{ updatedAt: 'desc' }],
  })
  return rows.map((r) => ({ id: r.sceneId, name: r.name }))
}

// ===== 新增 =====

export async function create(userId: number, form: SceneForm) {
  const f = normalizeForm(form)
  const row = await db.sceneConfig.create({
    data: {
      sceneId: newSceneId(),
      name: f.name,
      systemKey: f.systemKey,
      scope: f.scope,
      width: f.width,
      height: f.height,
      style: f.style,
      status: f.status,
      nodesJson: '[]',
      edgesJson: '[]',
      remark: f.remark,
      enterpriseId: f.enterpriseId,
      createdBy: userId,
    },
  })
  return toItem(row)
}

// ===== 更新 =====

export async function update(userId: number, sceneId: string, form: Partial<SceneForm>) {
  const cur = await db.sceneConfig.findFirst({
    where: { sceneId, ...(await visibilityWhere(userId)) },
  })
  if (!cur) throw Object.assign(new Error('画面不存在或已删除'), { statusCode: 404 })

  const f = normalizeForm(form as SceneForm, {
    name: cur.name,
    systemKey: cur.systemKey,
    scope: cur.scope,
    width: cur.width,
    height: cur.height,
    style: cur.style,
    status: cur.status,
    remark: cur.remark,
    enterpriseId: cur.enterpriseId,
  })

  const row = await db.sceneConfig.update({
    where: { id: cur.id },
    data: {
      name: f.name,
      systemKey: f.systemKey,
      scope: f.scope,
      width: f.width,
      height: f.height,
      style: f.style,
      status: f.status,
      remark: f.remark,
      enterpriseId: f.enterpriseId,
    },
  })
  return toItem(row)
}

// ===== 保存布局 =====

/**
 * 保存画面布局（编辑器「保存」）：写入节点与连线，并清空草稿
 */
export async function saveLayout(
  userId: number,
  sceneId: string,
  payload: { nodes?: SceneNode[]; edges?: SceneEdge[] },
) {
  const cur = await db.sceneConfig.findFirst({
    where: { sceneId, ...(await visibilityWhere(userId)) },
  })
  if (!cur) throw Object.assign(new Error('画面不存在或已删除'), { statusCode: 404 })

  const nodes = payload.nodes ?? []
  const edges = payload.edges ?? []
  validateLayout(nodes, edges)

  const row = await db.sceneConfig.update({
    where: { id: cur.id },
    data: {
      nodesJson: JSON.stringify(nodes),
      edgesJson: JSON.stringify(edges),
      draftJson: '',
    },
  })
  return toItem(row)
}

/**
 * 保存编辑器草稿（未保存的改动）：不动正式布局
 */
export async function saveDraft(userId: number, sceneId: string, draft: SceneDraft) {
  const cur = await db.sceneConfig.findFirst({
    where: { sceneId, ...(await visibilityWhere(userId)) },
  })
  if (!cur) throw Object.assign(new Error('画面不存在或已删除'), { statusCode: 404 })

  const nodes = draft.nodes ?? []
  const edges = draft.edges ?? []
  validateLayout(nodes, edges)

  const row = await db.sceneConfig.update({
    where: { id: cur.id },
    data: { draftJson: JSON.stringify({ ...draft, updatedAt: draft.updatedAt || Date.now() }) },
  })
  return toItem(row)
}

// ===== 启停 =====

/** 切换启停：草稿 ↔ 已停用 */
export async function toggleStatus(userId: number, sceneId: string) {
  const cur = await db.sceneConfig.findFirst({
    where: { sceneId, ...(await visibilityWhere(userId)) },
  })
  if (!cur) throw Object.assign(new Error('画面不存在或已删除'), { statusCode: 404 })

  const next = cur.status === 'disabled' ? 'draft' : 'disabled'
  const row = await db.sceneConfig.update({ where: { id: cur.id }, data: { status: next } })
  return toItem(row)
}

// ===== 删除 =====

/**
 * 删除画面（软删除）
 *
 * 关联分析：
 * - CustomSymbol：画面节点引用图元 ID，画面删除不影响图元 → 保留不动
 * - 无其他模型外键指向本表 → 无级联
 */
export async function remove(userId: number, sceneId: string) {
  const cur = await db.sceneConfig.findFirst({
    where: { sceneId, ...(await visibilityWhere(userId)) },
  })
  if (!cur) throw Object.assign(new Error('画面不存在或已删除'), { statusCode: 404 })

  await db.sceneConfig.update({ where: { id: cur.id }, data: { deletedAt: new Date() } })
}

// ===== 图元引用 =====

/**
 * 某图元被哪些画面引用
 *
 * 画面入库后，后端可自查引用关系，图元删除前的引用检查不再依赖浏览器本地数据。
 */
export async function findSymbolReferences(userId: number, symbolId: string) {
  const where = await visibilityWhere(userId)
  const rows = await db.sceneConfig.findMany({
    where: { ...where, nodesJson: { contains: symbolId } },
    select: { sceneId: true, name: true, nodesJson: true, draftJson: true },
  })

  const out: Array<{ id: string; name: string; count: number }> = []
  for (const r of rows) {
    const nodes = parseJSON<SceneNode[]>(r.nodesJson, [])
    const count = nodes.filter((n) => n.symbol === symbolId).length
    if (count > 0) out.push({ id: r.sceneId, name: r.name, count })
  }
  return out
}

/**
 * 清理图元在所有画面中的残留节点（配合图元删除）
 *
 * 节点被删后，两端指向它的连线一并移除，避免画布渲染报错。
 */
export async function purgeSymbolReferences(userId: number, symbolId: string) {
  const where = await visibilityWhere(userId)
  const rows = await db.sceneConfig.findMany({
    where: { ...where, nodesJson: { contains: symbolId } },
  })

  let purgedNodes = 0
  let touchedScenes = 0
  for (const r of rows) {
    const nodes = parseJSON<SceneNode[]>(r.nodesJson, [])
    const kept = nodes.filter((n) => n.symbol !== symbolId)
    if (kept.length === nodes.length) continue
    purgedNodes += nodes.length - kept.length
    touchedScenes++

    const ids = new Set(kept.map((n) => n.id))
    const edges = parseJSON<SceneEdge[]>(r.edgesJson, []).filter(
      (e) => ids.has(e.from?.node) && ids.has(e.to?.node),
    )

    const draft = parseJSON<SceneDraft | null>(r.draftJson, null)
    const patch: any = { nodesJson: JSON.stringify(kept), edgesJson: JSON.stringify(edges) }
    if (draft && Array.isArray(draft.nodes)) {
      const dKept = draft.nodes.filter((n) => n.symbol !== symbolId)
      if (dKept.length !== draft.nodes.length) {
        const dIds = new Set(dKept.map((n) => n.id))
        patch.draftJson = JSON.stringify({
          ...draft,
          nodes: dKept,
          edges: (draft.edges ?? []).filter((e) => dIds.has(e.from?.node) && dIds.has(e.to?.node)),
        })
      }
    }
    await db.sceneConfig.update({ where: { id: r.id }, data: patch })
  }

  return { scenes: touchedScenes, nodes: purgedNodes }
}

// ===== 本地历史数据导入 =====

/**
 * 一次性导入浏览器本地历史画面
 *
 * 幂等：已存在的画面 ID 跳过，不覆盖；重复调用安全。
 */
export async function importLocal(userId: number, payload: SceneImportPayload) {
  if (!Array.isArray(payload?.scenes)) bad('导入数据缺少 scenes 字段')

  const existing = await db.sceneConfig.findMany({
    where: { sceneId: { in: payload.scenes.map((s) => s.id).filter(Boolean) } },
    select: { sceneId: true },
  })
  const existingIds = new Set(existing.map((e) => e.sceneId))

  let imported = 0
  let skipped = 0
  for (const s of payload.scenes) {
    if (!s?.id) {
      skipped++
      continue
    }
    if (existingIds.has(s.id)) {
      skipped++
      continue
    }
    const f = normalizeForm({
      name: s.name ?? '未命名画面',
      systemKey: s.systemKey,
      scope: s.scope,
      width: s.width,
      height: s.height,
      style: s.style,
      status: s.status,
      remark: s.remark,
      enterpriseId: s.enterpriseId ?? null,
    })
    const nodes = s.nodes ?? []
    const edges = s.edges ?? []
    validateLayout(nodes, edges)

    const draft = payload.drafts?.[s.id] ?? null
    await db.sceneConfig.create({
      data: {
        sceneId: s.id,
        name: f.name,
        systemKey: f.systemKey,
        scope: f.scope,
        width: f.width,
        height: f.height,
        style: f.style,
        status: f.status,
        nodesJson: JSON.stringify(nodes),
        edgesJson: JSON.stringify(edges),
        draftJson: draft ? JSON.stringify(draft) : '',
        remark: f.remark,
        enterpriseId: f.enterpriseId,
        createdBy: userId,
      },
    })
    imported++
  }

  return { imported, skipped }
}

// ===== 校验 =====

/**
 * 布局校验：节点 ID 唯一、连线两端必须有节点
 */
function validateLayout(nodes: SceneNode[], edges: SceneEdge[]) {
  const ids = new Set<string>()
  for (const n of nodes) {
    if (!n || typeof n.id !== 'string' || !n.id) bad('节点 ID 非法')
    if (ids.has(n.id)) bad(`节点 ID 重复：${n.id}`)
    ids.add(n.id)
    if (!n.symbol) bad(`节点 ${n.id} 缺少图元 ID`)
    if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) bad(`节点 ${n.id} 坐标非法`)
  }
  for (const e of edges) {
    if (!e || typeof e.id !== 'string') bad('连线 ID 非法')
    if (!ids.has(e.from?.node) || !ids.has(e.to?.node)) {
      bad(`连线 ${e.id} 指向了不存在的节点`)
    }
  }
}
