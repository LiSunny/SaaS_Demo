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
  { id: 4, name: '示例模版：故障报修', status: 1, nodeCount: 4, fieldCount: 5, code: 'GD-20260603-3144', creator: '系统', createdAt: '2026-06-03 00:00', updatedAt: '2026-06-03 00:00' },
  { id: 5, name: '示例模版：警情处置督办', status: 1, nodeCount: 4, fieldCount: 5, code: 'JQ-20260605-5108', creator: '系统', createdAt: '2026-06-05 00:00', updatedAt: '2026-06-05 00:00' },
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

function removeConfig(id: number): void {
  localStorage.removeItem(`${CONFIG_PREFIX}${id}`)
}

// ===== 种子数据持久化（用户手动固化的模板快照，作为默认回退） =====
const SEED_PREFIX = 'db:workflow:seed:'

function loadSeed(id: number): TemplateDetail | undefined {
  try {
    const raw = localStorage.getItem(`${SEED_PREFIX}${id}`)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function saveSeed(id: number, detail: TemplateDetail): void {
  try {
    localStorage.setItem(`${SEED_PREFIX}${id}`, JSON.stringify(detail))
  } catch (e) {
    console.warn(`[workflow-dao] 种子持久化失败 (id=${id}):`, e)
  }
}

function removeSeed(id: number): void {
  localStorage.removeItem(`${SEED_PREFIX}${id}`)
}

function hasSeed(id: number): boolean {
  return localStorage.getItem(`${SEED_PREFIX}${id}`) !== null
}

// ===== 预置模板详情（出厂默认值，不可变，仅作为最终兜底） =====
export const BUILTIN_DETAILS: Record<number, TemplateDetail> = {
  // 模板 4（故障报修）— 用户自建模板，已固化至 BUILTIN_DETAILS 作为出厂兜底
  // 运行时仍走 localStorage 持久化路径（草稿 → 已发布配置 → 种子 → 此处兜底）
  4: {
    "id": 4,
    "baseInfo": {
        "name": "示例模版：故障报修",
        "code": "GD-20260603-3144",
        "description": "故障报修工单",
        "initiatorScope": "all",
        "initiatorUserIds": [],
        "slaPriority": "normal",
        "amberThreshold": 80
    },
    "formSchema": {
        "start": {
            "fields": [
                {
                    "id": "Feqcmpz7ldykabc",
                    "type": "input",
                    "label": "故障描述",
                    "source": "manual",
                    "required": false
                },
                {
                    "id": "F4pumpz7ll1uaec",
                    "type": "upload",
                    "label": "现场图片",
                    "source": "manual",
                    "required": false
                },
                {
                    "id": "F75ompz7lvqjakc",
                    "type": "select",
                    "label": "维修人员",
                    "source": "manual",
                    "required": false,
                    "options": [
                        { "value": "zhangsan", "label": "张三" },
                        { "value": "lisi", "label": "李四" },
                        { "value": "wangwu", "label": "王五" },
                        { "value": "zhaoliu", "label": "赵六" },
                        { "value": "sunqi", "label": "孙七" }
                    ]
                },
                {
                    "id": "Fskkmpz7m3jjanc",
                    "type": "radio",
                    "label": "维修结果",
                    "source": "manual",
                    "required": true,
                    "options": [
                        { "value": "repaired", "label": "已修复" },
                        { "value": "unrepaired", "label": "未修复" },
                        { "value": "partial", "label": "部分修复" }
                    ]
                },
                {
                    "id": "F9ltmpz7mn57aqc",
                    "type": "upload",
                    "label": "维修后图片",
                    "source": "manual",
                    "required": false
                },
                {
                    "id": "Foewmpz7mv4catc",
                    "type": "radio",
                    "label": "验收审核",
                    "source": "manual",
                    "required": true,
                    "options": [
                        { "value": "approved", "label": "通过" },
                        { "value": "rejected", "label": "驳回" }
                    ]
                }
            ]
        }
    },
    "flowDefinition": {
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "name": "发起工单",
                "formFields": [
                    {
                        "fieldId": "F75ompz7lvqjakc",
                        "mode": "hidden"
                    },
                    {
                        "fieldId": "Fskkmpz7m3jjanc",
                        "mode": "hidden"
                    },
                    {
                        "fieldId": "F9ltmpz7mn57aqc",
                        "mode": "hidden"
                    },
                    {
                        "fieldId": "Foewmpz7mv4catc",
                        "mode": "hidden"
                    }
                ]
            },
            {
                "id": "assign_1780560343559",
                "type": "assign",
                "name": "指派人员",
                "formFields": [
                    {
                        "fieldId": "F75ompz7lvqjakc",
                        "mode": "editable"
                    },
                    {
                        "fieldId": "Fskkmpz7m3jjanc",
                        "mode": "hidden"
                    },
                    {
                        "fieldId": "F9ltmpz7mn57aqc",
                        "mode": "hidden"
                    },
                    {
                        "fieldId": "Foewmpz7mv4catc",
                        "mode": "hidden"
                    }
                ],
                "assignSource": "dynamic",
                "dynamicAssignFieldId": "F75ompz7lvqjakc"
            },
            {
                "id": "execute_1780560370108",
                "type": "execute",
                "name": "现场维修",
                "formFields": [
                    {
                        "fieldId": "F75ompz7lvqjakc",
                        "mode": "hidden"
                    },
                    {
                        "fieldId": "Fskkmpz7m3jjanc",
                        "mode": "editable"
                    },
                    {
                        "fieldId": "F9ltmpz7mn57aqc",
                        "mode": "editable"
                    },
                    {
                        "fieldId": "Foewmpz7mv4catc",
                        "mode": "hidden"
                    }
                ],
                "assignSource": "dynamic",
                "dynamicAssignFieldId": "F75ompz7lvqjakc"
            },
            {
                "id": "confirm_1780560387291",
                "type": "confirm",
                "name": "验收审核",
                "formFields": [
                    {
                        "fieldId": "F75ompz7lvqjakc",
                        "mode": "readonly"
                    },
                    {
                        "fieldId": "Fskkmpz7m3jjanc",
                        "mode": "readonly"
                    },
                    {
                        "fieldId": "F9ltmpz7mn57aqc",
                        "mode": "readonly"
                    },
                    {
                        "fieldId": "Foewmpz7mv4catc",
                        "mode": "editable"
                    }
                ],
                "assignSource": "static",
                "dynamicAssignFieldId": "F75ompz7lvqjakc",
                "actions": [
                    {
                        "name": "通过",
                        "targetNodeId": "close"
                    },
                    {
                        "name": "驳回",
                        "targetNodeId": "execute_1780560370108"
                    }
                ],
                "assignConfig": {
                    "strategy": "user",
                    "targetIds": [
                        1
                    ],
                    "multipleMode": "anyone"
                }
            },
            {
                "id": "close",
                "type": "close",
                "name": "结束"
            }
        ],
        "edges": [
            {
                "from": "start",
                "to": "assign_1780560343559"
            },
            {
                "from": "assign_1780560343559",
                "to": "execute_1780560370108"
            },
            {
                "from": "execute_1780560370108",
                "to": "confirm_1780560387291"
            },
            {
                "from": "confirm_1780560387291",
                "to": "close"
            }
        ]
    }
},
    // 模板 5（警情处置督办）— 发起 → 指派 → 执行 → 结束
    5: {
        "id": 5,
        "baseInfo": {
            "name": "示例模版：警情处置督办",
            "code": "JQ-20260605-5108",
            "description": "警情处置督办公单",
            "initiatorScope": "all",
            "initiatorUserIds": [],
            "slaPriority": "normal",
            "amberThreshold": 80
        },
        "formSchema": {
            "start": {
                "fields": [
                    {
                        "id": "Fjq1npz8abc1def",
                        "type": "input",
                        "label": "警情描述",
                        "source": "manual",
                        "required": false
                    },
                    {
                        "id": "Fjq2npz8abc2def",
                        "type": "upload",
                        "label": "现场图片",
                        "source": "manual",
                        "required": false
                    },
                    {
                        "id": "Fjq3npz8abc3def",
                        "type": "select",
                        "label": "处置人员",
                        "source": "manual",
                        "required": false,
                        "options": [
                            { "value": "zhao_police", "label": "赵警官" },
                            { "value": "qian_police", "label": "钱警官" },
                            { "value": "sun_police", "label": "孙警官" },
                            { "value": "li_police", "label": "李警官" },
                            { "value": "zhou_police", "label": "周警官" }
                        ]
                    },
                    {
                        "id": "Fjq4npz8abc4def",
                        "type": "radio",
                        "label": "处置结果",
                        "source": "manual",
                        "required": true,
                        "options": [
                            { "value": "resolved", "label": "已处置" },
                            { "value": "unresolved", "label": "未处置" },
                            { "value": "partial", "label": "部分处置" }
                        ]
                    },
                    {
                        "id": "Fjq5npz8abc5def",
                        "type": "upload",
                        "label": "处置后图片",
                        "source": "manual",
                        "required": false
                    }
                ]
            }
        },
        "flowDefinition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "name": "发起警情",
                    "formFields": [
                        {
                            "fieldId": "Fjq3npz8abc3def",
                            "mode": "hidden"
                        },
                        {
                            "fieldId": "Fjq4npz8abc4def",
                            "mode": "hidden"
                        },
                        {
                            "fieldId": "Fjq5npz8abc5def",
                            "mode": "hidden"
                        }
                    ]
                },
                {
                    "id": "assign_1780600123456",
                    "type": "assign",
                    "name": "指派人员",
                    "formFields": [
                        {
                            "fieldId": "Fjq3npz8abc3def",
                            "mode": "editable"
                        },
                        {
                            "fieldId": "Fjq4npz8abc4def",
                            "mode": "hidden"
                        },
                        {
                            "fieldId": "Fjq5npz8abc5def",
                            "mode": "hidden"
                        }
                    ],
                    "assignSource": "dynamic",
                    "dynamicAssignFieldId": "Fjq3npz8abc3def"
                },
                {
                    "id": "execute_1780600234567",
                    "type": "execute",
                    "name": "现场处置",
                    "formFields": [
                        {
                            "fieldId": "Fjq3npz8abc3def",
                            "mode": "readonly"
                        },
                        {
                            "fieldId": "Fjq4npz8abc4def",
                            "mode": "editable"
                        },
                        {
                            "fieldId": "Fjq5npz8abc5def",
                            "mode": "editable"
                        }
                    ],
                    "assignSource": "dynamic",
                    "dynamicAssignFieldId": "Fjq3npz8abc3def"
                },
                {
                    "id": "close",
                    "type": "close",
                    "name": "结束"
                }
            ],
            "edges": [
                {
                    "from": "start",
                    "to": "assign_1780600123456"
                },
                {
                    "from": "assign_1780600123456",
                    "to": "execute_1780600234567"
                },
                {
                    "from": "execute_1780600234567",
                    "to": "close"
                }
            ]
        }
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
  removeConfig(id)
  removeSeed(id)
  return Promise.resolve()
}

export async function batchDeleteTemplates(ids: number[]): Promise<void> {
  dao.removeMany(ids)
  ids.forEach(id => {
    removeDraft(id)
    removeConfig(id)
    removeSeed(id)
  })
  return Promise.resolve()
}

export async function updateTemplateStatus(id: number, status: number): Promise<void> {
  dao.update(id, { status: status as TemplateItem['status'] })
  return Promise.resolve()
}

// ===== 配置页业务接口 =====

export async function getTemplateDetail(id: number): Promise<TemplateDetail | undefined> {
  // 统一回退链：草稿 → 已发布配置 → 种子数据 → 出厂默认值 → 空

  // 1. 草稿优先（编辑中未发布的内容）
  const cached = loadDraft(id)
  if (cached) return Promise.resolve(cached)

  // 2. 已发布的永久配置
  const published = loadConfig(id)
  if (published) return Promise.resolve(published)

  // 3. 种子数据（用户手动固化的快照）
  const seed = loadSeed(id)
  if (seed) return Promise.resolve(seed)

  // 4. 出厂默认值（仅作为最终兜底，不变异原对象）
  if (BUILTIN_DETAILS[id]) {
    return Promise.resolve(JSON.parse(JSON.stringify(BUILTIN_DETAILS[id])))
  }

  const item = dao.getById(id)
  if (!item) return Promise.resolve(undefined)

  // 5. 全新模板返回空配置
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

// ===== 种子模版接口 =====

/** 将已发布配置固化为种子数据 */
export async function saveAsSeed(id: number): Promise<void> {
  const config = loadConfig(id)
  if (!config) {
    // 如果没有已发布配置，尝试用草稿
    const draft = loadDraft(id)
    if (!draft) throw new Error(`模板 ${id} 没有可用的配置`)
    saveSeed(id, draft)
  } else {
    saveSeed(id, config)
  }
}

/** 直接写入指定数据到种子 */
export async function updateSeed(id: number, detail: TemplateDetail): Promise<void> {
  saveSeed(id, detail)
}

/** 检查模板是否有种子数据 */
export async function isSeedTemplate(id: number): Promise<boolean> {
  return hasSeed(id)
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
