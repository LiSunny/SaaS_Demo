/**
 * workflow-dao.ts — 流程模板 DAO 适配器
 *
 * PoC 模式（默认）：
 * 标准 CRUD → Dao 引擎 → db-adapter (localStorage)，持久化、跨刷新保留
 * 业务逻辑（草稿、发布、校验）→ 手工实现，不塞进 Dao 引擎
 *
 * 切换方式：设置环境变量 VITE_API_MODE=real 即可走 HTTP 适配器
 */

import { Dao, type PageResult } from '@/utils/dao-engine'
import { createPersistentStore, type PersistentStore } from '@/utils/db-adapter'
import type {
  TemplateItem, TemplateQuery, TemplateForm,
  TemplateDetail, FlowDefinition,
} from '@/types/workflow'

// ===== 种子数据 =====
const SEED_TEMPLATES: TemplateItem[] = [
  { id: 1, name: '示例模版：安全生产督办流程（监管方）', status: 1, nodeCount: 4, fieldCount: 10, code: 'WF-SP-001', creator: '张监管', createdAt: '2026-05-15 09:00', updatedAt: '2026-05-30 14:30' },
  { id: 2, name: '示例模版：督办整改执行流程（被监管方）', status: 1, nodeCount: 4, fieldCount: 8, code: 'WF-SP-002', creator: '李整改', createdAt: '2026-05-15 09:00', updatedAt: '2026-05-28 10:00' },
  { id: 3, name: '示例模版：故障维修流程', status: 1, nodeCount: 5, fieldCount: 6, code: 'WF-SP-003', creator: '系统', createdAt: '2026-05-20 10:00', updatedAt: '2026-06-01 14:00' },
]

// ===== 持久化 Store =====
const store: PersistentStore<TemplateItem> = createPersistentStore<TemplateItem>('workflow', SEED_TEMPLATES)

// ===== DAO 引擎 =====
const dao = new Dao<TemplateItem, TemplateQuery>(store, {
  filterMap: (q) => {
    const rules: import('@/utils/dao-engine').FilterRule<TemplateItem>[] = []
    if (q.status !== '' && q.status !== undefined) {
      rules.push({ field: 'status', op: 'eq' as const, value: q.status })
    }
    return rules
  },
  /** keyword 跨字段搜索（name / code / creator） */
  transform: (items, q) => {
    if (!q.keyword) return items
    const kw = q.keyword.toLowerCase()
    return items.filter(i =>
      i.name.toLowerCase().includes(kw) ||
      i.code.toLowerCase().includes(kw) ||
      i.creator.toLowerCase().includes(kw),
    )
  },
  defaultSort: [{ field: 'updatedAt', dir: 'desc' }],
})

// ===== 草稿持久化（与 DAO Engine 的 CRUD 隔离存储） =====
const DRAFT_PREFIX = 'db:workflow:draft:'
const CONFIG_PREFIX = 'db:workflow:config:' // ← 发布后永久存储

function loadDraft(id: number): TemplateDetail | undefined {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${id}`)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function saveDraft(id: number, detail: TemplateDetail): void {
  try {
    localStorage.setItem(`${DRAFT_PREFIX}${id}`, JSON.stringify(detail))
  } catch (e) {
    console.warn(`[workflow-dao] 草稿持久化失败 (id=${id}):`, e)
  }
}

function removeDraft(id: number): void {
  localStorage.removeItem(`${DRAFT_PREFIX}${id}`)
}

// ===== 已发布配置持久化（发布时从草稿迁移至此） =====

function loadConfig(id: number): TemplateDetail | undefined {
  try {
    const raw = localStorage.getItem(`${CONFIG_PREFIX}${id}`)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function saveConfig(id: number, detail: TemplateDetail): void {
  try {
    localStorage.setItem(`${CONFIG_PREFIX}${id}`, JSON.stringify(detail))
  } catch (e) {
    console.warn(`[workflow-dao] 配置持久化失败 (id=${id}):`, e)
  }
}

// ===== 预置模板详情（只读，不持久化） =====
const BUILTIN_DETAILS: Record<number, TemplateDetail> = {
  1: {
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
  },
  2: {
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
  },
  3: {
    id: 3,
    baseInfo: {
      name: '故障维修流程',
      code: 'WF-SP-003',
      description: '设备故障报修、派单维修、验收关闭的完整闭环流程',
      initiatorScope: 'all',
      slaPriority: 'urgent',
      defaultTtrMinutes: 30,
      defaultTtsMinutes: 480,
      amberThreshold: 80,
    },
    formSchema: {
      start_1: {
        fields: [
          { id: 'f1', type: 'input', label: '设备名称', required: true, source: 'manual', span: 12 },
          { id: 'f2', type: 'input', label: '设备编号', required: true, source: 'manual', span: 12 },
          { id: 'f3', type: 'select', label: '故障类型', required: true, source: 'manual', span: 12, options: [{ value: 'mechanical', label: '机械故障' }, { value: 'electrical', label: '电气故障' }, { value: 'leak', label: '渗漏' }, { value: 'other', label: '其他' }] },
          { id: 'f4', type: 'textarea', label: '故障描述', required: true, source: 'manual', span: 24 },
          { id: 'f5', type: 'upload', label: '现场照片', required: false, source: 'manual', span: 24 },
          { id: 'f6', type: 'textarea', label: '维修结果', required: false, source: 'manual', span: 24 },
        ],
      },
    },
    flowDefinition: {
      nodes: [
        {
          id: 'start_1', type: 'start', name: '发起报修',
          formFields: [
            { fieldId: 'f1', mode: 'editable' },
            { fieldId: 'f2', mode: 'editable' },
            { fieldId: 'f3', mode: 'editable' },
            { fieldId: 'f4', mode: 'editable' },
            { fieldId: 'f5', mode: 'editable' },
            { fieldId: 'f6', mode: 'hidden' },
          ],
        },
        { id: 'assign_1', type: 'assign', name: '派单调度', assignSource: 'static', assignConfig: { strategy: 'user', targetIds: [1, 2, 3], multipleMode: 'anyone' } },
        {
          id: 'execute_1', type: 'execute', name: '现场维修',
          formFields: [
            { fieldId: 'f1', mode: 'readonly' },
            { fieldId: 'f2', mode: 'readonly' },
            { fieldId: 'f3', mode: 'readonly' },
            { fieldId: 'f4', mode: 'readonly' },
            { fieldId: 'f5', mode: 'readonly' },
            { fieldId: 'f6', mode: 'editable' },
          ],
        },
        { id: 'confirm_1', type: 'confirm', name: '验收确认', assignSource: 'static', assignConfig: { strategy: 'user', targetIds: [1], multipleMode: 'anyone' }, actions: [{ name: '验收通过', targetNodeId: 'close_1' }, { name: '退回整改', targetNodeId: 'execute_1' }] },
        { id: 'close_1', type: 'close', name: '关闭归档' },
      ],
      edges: [
        { from: 'start_1', to: 'assign_1' },
        { from: 'assign_1', to: 'execute_1' },
        { from: 'execute_1', to: 'confirm_1' },
        { from: 'confirm_1', to: 'close_1' },
      ],
    },
  },
}

// ===== API 函数 =====

export async function getTemplateList(params: TemplateQuery): Promise<PageResult<TemplateItem>> {
  return Promise.resolve(dao.list(params))
}

export async function getTemplate(id: number): Promise<TemplateItem | undefined> {
  return Promise.resolve(dao.getById(id))
}

export async function createTemplate(data: TemplateForm): Promise<TemplateItem> {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const item: TemplateItem = {
    id: store.nextId(),
    name: data.name,
    status: 0,
    nodeCount: 0,
    fieldCount: 0,
    code: data.code || 'WF-' + String(store.nextId()).padStart(3, '0'),
    creator: '当前用户',
    createdAt: now,
    updatedAt: now,
  }
  // 用 store 直接 add，因为 Dao 不暴露 nextId()
  store.add(item)
  return Promise.resolve(item)
}

export async function updateTemplate(id: number, data: Partial<TemplateForm>): Promise<TemplateItem | undefined> {
  const patch: Partial<TemplateItem> = {
    ...data,
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  }
  return Promise.resolve(dao.update(id, patch))
}

export async function deleteTemplate(id: number): Promise<void> {
  dao.remove(id)
  removeDraft(id)
  return Promise.resolve()
}

export async function batchDeleteTemplates(ids: number[]): Promise<void> {
  dao.removeMany(ids)
  ids.forEach(removeDraft)
  return Promise.resolve()
}

export async function updateTemplateStatus(id: number, status: number): Promise<void> {
  dao.update(id, { status: status as TemplateItem['status'] })
  return Promise.resolve()
}

// ===== 配置页业务接口 =====

export async function getTemplateDetail(id: number): Promise<TemplateDetail | undefined> {
  // 1. 草稿优先（编辑中未发布的内容）
  const cached = loadDraft(id)
  if (cached) return Promise.resolve(cached)

  // 2. 已发布的永久配置
  const published = loadConfig(id)
  if (published) return Promise.resolve(published)

  const item = dao.getById(id)
  if (!item) return Promise.resolve(undefined)

  // 3. 预置模板有默认详情
  if (BUILTIN_DETAILS[id]) return Promise.resolve(JSON.parse(JSON.stringify(BUILTIN_DETAILS[id])))

  // 4. 全新模板返回空配置
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

export async function saveTemplateDraft(data: TemplateDetail): Promise<{ id: number }> {
  // 从表单/流程数据计算配置进度
  const calcFieldCount = (): number => {
    return Object.values(data.formSchema || {}).reduce(
      (sum, node) => sum + (node.fields?.length || 0), 0,
    )
  }
  const calcNodeCount = (): number => data.flowDefinition?.nodes?.length || 0
  const nodeCount = calcNodeCount()
  const fieldCount = calcFieldCount()

  const id = data.id
  if (!id) {
    // 新增模板：先在列表中建一条，再保存草稿
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const newId = store.nextId()
    const item: TemplateItem = {
      id: newId,
      name: data.baseInfo.name,
      status: 0,
      nodeCount,
      fieldCount,
      code: data.baseInfo.code || 'WF-' + String(newId).padStart(3, '0'),
      creator: '当前用户',
      createdAt: now,
      updatedAt: now,
    }
    store.add(item)
    saveDraft(newId, { ...data, id: newId })
    return Promise.resolve({ id: newId })
  }

  // 更新已有草稿
  saveDraft(id, { ...data, id })
  dao.update(id, {
    name: data.baseInfo.name,
    code: data.baseInfo.code || undefined,
    nodeCount,
    fieldCount,
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  })
  return Promise.resolve({ id })
}

export async function publishTemplate(id: number): Promise<TemplateItem> {
  // 将草稿迁移到已发布配置（发布后编辑时仍能加载完整配置）
  const draft = loadDraft(id)
  if (draft) {
    saveConfig(id, draft)
    removeDraft(id)
  }

  dao.update(id, {
    status: 1,
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  })
  const item = dao.getById(id)!
  return Promise.resolve(item)
}

// ===== 工具接口 =====

export async function validateFlowDefinition(def: FlowDefinition): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  const startNodes = def.nodes.filter(n => n.type === 'start')
  if (startNodes.length === 0) errors.push('缺少开始节点')
  if (startNodes.length > 1) errors.push('开始节点只能有一个')
  if (startNodes.length === 1) {
    const outEdges = def.edges.filter(e => e.from === startNodes[0].id)
    if (outEdges.length !== 1) errors.push('开始节点必须有且仅有一个出口')
  }

  const closeNodes = def.nodes.filter(n => n.type === 'close')
  if (closeNodes.length === 0) errors.push('缺少关闭节点')
  if (closeNodes.length > 1) errors.push('关闭节点只能有一个')
  if (closeNodes.length === 1) {
    const inEdges = def.edges.filter(e => e.to === closeNodes[0].id)
    if (inEdges.length === 0) errors.push('关闭节点必须至少有一个入口')
  }

  const confirmNodes = def.nodes.filter(n => n.type === 'confirm')
  confirmNodes.forEach(n => {
    if (!n.actions || n.actions.length < 2) {
      errors.push(`审批节点"${n.name}"至少需要两个操作按钮（如通过/驳回）`)
    }
  })

  const assignableNodes = def.nodes.filter(n => n.type === 'assign' || n.type === 'confirm')
  assignableNodes.forEach(n => {
    const source = n.assignSource || 'static'
    if (source === 'static') {
      if (!n.assignConfig?.targetIds?.length) {
        errors.push(`节点"${n.name}"指派来源为静态，必须指定指派目标`)
      }
    } else if (!n.dynamicAssignFieldId) {
      errors.push(`节点"${n.name}"指派来源为动态，必须绑定表单字段`)
    }
  })

  const conditionNodes = def.nodes.filter(n => n.type === 'condition')
  conditionNodes.forEach(n => {
    if (!n.conditionExpression) {
      errors.push(`条件节点"${n.name}"必须配置条件表达式`)
    }
  })

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

export async function uploadFile(_formData: FormData): Promise<{ url: string }> {
  return Promise.resolve({ url: `https://cdn.example.com/uploads/${Date.now()}.png` })
}
