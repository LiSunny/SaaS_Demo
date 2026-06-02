import type { TemplateItem, TemplateQuery, TemplateForm, TemplateDetail, FlowDefinition } from '@/types/workflow'

const mockData: TemplateItem[] = [
  { id: 1, name: '示例模版：安全生产督办流程（监管方）', status: 1, nodeCount: 4, fieldCount: 10, code: 'WF-SP-001', creator: '张监管', createdAt: '2026-05-15 09:00', updatedAt: '2026-05-30 14:30' },
  { id: 2, name: '示例模版：督办整改执行流程（被监管方）', status: 1, nodeCount: 4, fieldCount: 8, code: 'WF-SP-002', creator: '李整改', createdAt: '2026-05-15 09:00', updatedAt: '2026-05-28 10:00' },
]

let dataStore = [...mockData]
let nextId = 3

// 草稿存储（内存）
const draftStore = new Map<number, TemplateDetail>()

// ===== 督办示意流程演示数据 =====

const supervisorDetail: TemplateDetail = {
  id: 1,
  baseInfo: {
    name: '安全生产督办流程（监管方）',
    code: 'WF-SP-001',
    description: '监管方发起督办任务，跨企业下发至被监管方，审核整改结果后归档',
    initiatorScope: 'specified',
    slaPriority: 'urgent',
    defaultTtrMinutes: 120,
    defaultTtsMinutes: 2880,
    amberThreshold: 80,
  },
  formSchema: {
    start_1: {
      fields: [
        { id: 'f1',  type: 'input',    label: '督办标题',     required: true,  source: 'manual', span: 24 },
        { id: 'f2',  type: 'textarea', label: '督办事项描述', required: true,  source: 'manual', span: 24 },
        { id: 'f3',  type: 'textarea', label: '整改标准',     required: true,  source: 'manual', span: 24 },
        { id: 'f4',  type: 'input',    label: '整改期限',     required: true,  source: 'manual', span: 12 },
        { id: 'f5',  type: 'input',    label: '督办类型',     required: true,  source: 'manual', span: 12 },
        { id: 'f6',  type: 'input',    label: '被监管企业',   required: true,  source: 'manual', span: 12 },
        { id: 'f7',  type: 'input',    label: '紧急程度',     required: true,  source: 'manual', span: 12 },
        { id: 'f8',  type: 'input',    label: '督办依据',     required: false, source: 'manual', span: 12 },
        { id: 'f9',  type: 'input',    label: '抄送人',       required: false, source: 'auto',    span: 12 },
        { id: 'f10', type: 'input',    label: '附件',         required: false, source: 'manual', span: 24 },
      ],
    },
  },
  flowDefinition: {
    nodes: [
      { id: 'start_1',    type: 'start',    name: '发起督办' },
      { id: 'external_1', type: 'external', name: '下发至被监管企业' },
      {
        id: 'confirm_1',
        type: 'confirm',
        name: '审核整改结果',
        assignSource: 'static',
        assignConfig: { strategy: 'user', targetIds: [1], multipleMode: 'anyone' },
        actions: [
          { name: '审核通过', targetNodeId: 'close_1' },
          { name: '驳回整改', targetNodeId: 'external_1' },
        ],
        slaLimits: { ttrMinutes: 120, amberThreshold: 80 },
      },
      { id: 'close_1', type: 'close', name: '关闭归档' },
    ],
    edges: [
      { from: 'start_1',    to: 'external_1' },
      { from: 'external_1', to: 'confirm_1' },
      { from: 'confirm_1',  to: 'close_1' },
    ],
  },
}

const regulatedDetail: TemplateDetail = {
  id: 2,
  baseInfo: {
    name: '督办整改执行流程（被监管方）',
    code: 'WF-SP-002',
    description: '接收监管方督办任务，内部指派整改人，执行整改后提交结果',
    initiatorScope: 'specified',
    slaPriority: 'normal',
    defaultTtrMinutes: 480,
    defaultTtsMinutes: 4320,
    amberThreshold: 80,
  },
  formSchema: {
    start_1: {
      fields: [
        { id: 'f1', type: 'input',    label: '督办标题',     required: true,  source: 'inherited', span: 24 },
        { id: 'f2', type: 'textarea', label: '督办事项描述', required: true,  source: 'inherited', span: 24 },
        { id: 'f3', type: 'textarea', label: '整改标准',     required: true,  source: 'inherited', span: 24 },
        { id: 'f4', type: 'input',    label: '整改期限',     required: true,  source: 'inherited', span: 12 },
        { id: 'f5', type: 'textarea', label: '整改计划',     required: true,  source: 'manual',    span: 24 },
        { id: 'f6', type: 'textarea', label: '整改结果描述', required: true,  source: 'manual',    span: 24 },
        { id: 'f7', type: 'input',    label: '整改照片',     required: true,  source: 'manual',    span: 24 },
        { id: 'f8', type: 'input',    label: '处理人签名',   required: false, source: 'manual',    span: 12 },
      ],
    },
  },
  flowDefinition: {
    nodes: [
      { id: 'start_1',   type: 'start',   name: '接收督办' },
      {
        id: 'assign_1',
        type: 'assign',
        name: '指派整改人',
        assignSource: 'static',
        assignConfig: { strategy: 'user', targetIds: [2, 3, 4], multipleMode: 'anyone' },
        slaLimits: { ttrMinutes: 240, amberThreshold: 80 },
      },
      {
        id: 'execute_1',
        type: 'execute',
        name: '执行整改',
        slaLimits: { ttsMinutes: 2880, amberThreshold: 80 },
      },
      { id: 'close_1', type: 'close', name: '提交结果' },
    ],
    edges: [
      { from: 'start_1',   to: 'assign_1' },
      { from: 'assign_1',  to: 'execute_1' },
      { from: 'execute_1', to: 'close_1' },
    ],
  },
}

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
  const item = dataStore.find(i => i.id === id)
  if (!item) return Promise.resolve(undefined)
  if (id === 1) return Promise.resolve(supervisorDetail)
  if (id === 2) return Promise.resolve(regulatedDetail)
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
