import type { TemplateItem, TemplateQuery, TemplateForm, TemplateDetail, FlowDefinition } from '@/types/workflow'

const mockData: TemplateItem[] = [
  { id: 1, name: '设备报修流程', status: 1, nodeCount: 4, fieldCount: 8, code: 'WF-001', creator: '杨婷彤', createdAt: '2025-10-09 09:40', updatedAt: '2025-12-09 09:40' },
  { id: 2, name: '安全巡检流程', status: 1, nodeCount: 3, fieldCount: 5, code: 'WF-002', creator: '谢东', createdAt: '2025-10-09 09:40', updatedAt: '2025-12-09 09:40' },
  { id: 3, name: '隐患上报流程', status: 0, nodeCount: 5, fieldCount: 12, code: 'WF-003', creator: '陈洪燕', createdAt: '2025-11-15 14:20', updatedAt: '2025-12-01 10:00' },
  { id: 4, name: '设备报废流程', status: 2, nodeCount: 6, fieldCount: 15, code: 'WF-004', creator: '梁冬', createdAt: '2025-08-20 08:00', updatedAt: '2025-11-20 08:00' },
  { id: 5, name: '应急响应流程', status: 3, nodeCount: 8, fieldCount: 20, code: 'WF-005', creator: '马达', createdAt: '2025-06-01 10:00', updatedAt: '2025-09-01 10:00' },
  { id: 6, name: '常规检查流程', status: 1, nodeCount: 2, fieldCount: 3, code: 'WF-006', creator: '杨伟', createdAt: '2025-12-01 09:00', updatedAt: '2025-12-15 09:00' },
  { id: 7, name: '物料申领流程', status: 0, nodeCount: 3, fieldCount: 6, code: 'WF-007', creator: '高楠', createdAt: '2026-01-05 11:00', updatedAt: '2026-01-05 11:00' },
  { id: 8, name: '设备调拨流程', status: 1, nodeCount: 4, fieldCount: 10, code: 'WF-008', creator: '杨婷彤', createdAt: '2026-01-10 08:30', updatedAt: '2026-02-10 08:30' },
]

let dataStore = [...mockData]
let nextId = 9

// 草稿存储（内存）
const draftStore = new Map<number, TemplateDetail>()

// ===== 列表 & 基础 CRUD =====

export function getTemplateList(params: TemplateQuery): Promise<import('@/types/workflow').PaginatedData<TemplateItem>> {
  let list = [...dataStore]
  if (params.keyword) list = list.filter(i => i.name.includes(params.keyword!))
  if (params.status !== '' && params.status !== undefined) list = list.filter(i => i.status === params.status)
  const total = list.length
  const start = (params.page - 1) * params.size
  return Promise.resolve({ data: list.slice(start, start + params.size), total })
}

export function getTemplate(id: number): Promise<TemplateItem | undefined> {
  return Promise.resolve(dataStore.find(i => i.id === id))
}

export function createTemplate(data: TemplateForm): Promise<TemplateItem> {
  const item: TemplateItem = {
    id: nextId++, name: data.name, status: 0,
    nodeCount: 0, fieldCount: 0, code: data.code || `WF-${String(nextId - 1).padStart(3, '0')}`,
    creator: '当前用户', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  }
  dataStore.unshift(item)
  return Promise.resolve(item)
}

export function updateTemplate(id: number, data: Partial<TemplateForm>): Promise<TemplateItem | undefined> {
  const idx = dataStore.findIndex(i => i.id === id)
  if (idx > -1) {
    dataStore[idx] = { ...dataStore[idx], ...data, updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
  }
  return Promise.resolve(dataStore[idx])
}

export function deleteTemplate(id: number) {
  dataStore = dataStore.filter(i => i.id !== id)
  return Promise.resolve()
}

export function batchDeleteTemplates(ids: number[]) {
  dataStore = dataStore.filter(i => !ids.includes(i.id))
  return Promise.resolve()
}

export function updateTemplateStatus(id: number, status: number) {
  const item = dataStore.find(i => i.id === id)
  if (item) item.status = status as TemplateItem['status']
  return Promise.resolve()
}

// ===== 配置页接口 =====

/** 获取模板完整配置 */
export function getTemplateDetail(id: number): Promise<TemplateDetail | undefined> {
  const cached = draftStore.get(id)
  if (cached) return Promise.resolve(cached)
  // 无草稿时返回空 detail
  const item = dataStore.find(i => i.id === id)
  if (!item) return Promise.resolve(undefined)
  return Promise.resolve({
    id: item.id,
    baseInfo: {
      name: item.name,
      code: item.code,
      description: '',
      initiatorScope: 'all',
      slaPriority: 'normal',
      amberThreshold: 80,
    },
    formSchema: {},
    flowDefinition: { nodes: [], edges: [] },
  })
}

/** 保存模板草稿 */
export function saveTemplateDraft(data: TemplateDetail): Promise<{ id: number }> {
  const id = data.id ?? nextId
  if (!data.id) {
    const item: TemplateItem = {
      id: nextId++, name: data.baseInfo.name, status: 0,
      nodeCount: 0, fieldCount: 0,
      code: data.baseInfo.code || `WF-${String(nextId - 1).padStart(3, '0')}`,
      creator: '当前用户',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    dataStore.unshift(item)
    draftStore.set(item.id, { ...data, id: item.id })
    return Promise.resolve({ id: item.id })
  }
  // 更新已有草稿
  draftStore.set(id, { ...data })
  const item = dataStore.find(i => i.id === id)
  if (item) {
    item.name = data.baseInfo.name
    item.code = data.baseInfo.code || item.code
    item.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  }
  return Promise.resolve({ id })
}

/** 发布模板 */
export function publishTemplate(id: number): Promise<TemplateItem> {
  const item = dataStore.find(i => i.id === id)
  if (item) {
    item.status = 1
    item.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  }
  // 清除草稿
  draftStore.delete(id)
  return Promise.resolve(item!)
}

/** 校验流程定义 */
export function validateFlowDefinition(def: FlowDefinition): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  // 开始节点必须存在且只有一个
  const startNodes = def.nodes.filter(n => n.type === 'start')
  if (startNodes.length === 0) errors.push('缺少开始节点')
  if (startNodes.length > 1) errors.push('开始节点只能有一个')

  // 开始节点出度为 1
  if (startNodes.length === 1) {
    const outEdges = def.edges.filter(e => e.from === startNodes[0].id)
    if (outEdges.length !== 1) errors.push('开始节点必须有且仅有一个出口')
  }

  // 关闭节点必须存在且只有一个
  const closeNodes = def.nodes.filter(n => n.type === 'close')
  if (closeNodes.length === 0) errors.push('缺少关闭节点')
  if (closeNodes.length > 1) errors.push('关闭节点只能有一个')

  // 关闭节点入度至少为 1
  if (closeNodes.length === 1) {
    const inEdges = def.edges.filter(e => e.to === closeNodes[0].id)
    if (inEdges.length === 0) errors.push('关闭节点必须至少有一个入口')
  }

  // 确认/审批节点必须配置至少两个操作按钮
  const confirmNodes = def.nodes.filter(n => n.type === 'confirm')
  confirmNodes.forEach(n => {
    if (!n.actions || n.actions.length < 2) {
      errors.push(`审批节点"${n.name}"至少需要两个操作按钮（如通过/驳回）`)
    }
  })

  // assign / confirm 节点指派校验
  const assignableNodes = def.nodes.filter(n => n.type === 'assign' || n.type === 'confirm')
  assignableNodes.forEach(n => {
    const source = n.assignSource || 'static'
    if (source === 'static') {
      if (!n.assignConfig || !n.assignConfig.targetIds || n.assignConfig.targetIds.length === 0) {
        errors.push(`节点"${n.name}"指派来源为静态，必须指定指派目标`)
      }
    } else {
      if (!n.dynamicAssignFieldId) {
        errors.push(`节点"${n.name}"指派来源为动态，必须绑定表单字段`)
      }
    }
  })

  // 条件节点必须配置条件表达式
  const conditionNodes = def.nodes.filter(n => n.type === 'condition')
  conditionNodes.forEach(n => {
    if (!n.conditionExpression) {
      errors.push(`条件节点"${n.name}"必须配置条件表达式`)
    }
  })

  // 检查悬空节点
  const nodeIds = new Set(def.nodes.map(n => n.id))
  const fromIds = new Set(def.edges.map(e => e.from))
  const toIds = new Set(def.edges.map(e => e.to))
  const connectedIds = new Set([...fromIds, ...toIds])

  nodeIds.forEach(id => {
    if (!connectedIds.has(id) && def.nodes.length > 1) {
      const node = def.nodes.find(n => n.id === id)
      if (node && node.type !== 'start' && node.type !== 'close') {
        errors.push(`节点"${node.name}"未连接（悬空节点）`)
      }
    }
  })

  return Promise.resolve({ valid: errors.length === 0, errors })
}

/** 上传文件（模拟） */
export function uploadFile(_formData: FormData): Promise<{ url: string }> {
  return Promise.resolve({ url: `https://cdn.example.com/uploads/${Date.now()}.png` })
}
