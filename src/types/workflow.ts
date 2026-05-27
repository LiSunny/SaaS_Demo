// ===== 枚举 =====
export type TemplateStatus = 0 | 1 | 2 | 3 // 待生效 | 执行中 | 已停用 | 已过期

export type SlaPriority = 'urgent' | 'normal' | 'low'
export type InitiatorScope = 'all' | 'specified'
export type NodeType = 'start' | 'assign' | 'execute' | 'confirm' | 'close' | 'condition'
export type AssignStrategy = 'position' | 'user' | 'role' | 'dept' | 'external'
export type AssignMultipleMode = 'anyone' | 'each'
export type FieldSource = 'manual' | 'auto' | 'inherited' | 'callback'

// ===== 列表相关 =====
export interface TemplateItem {
  id: number
  name: string
  status: TemplateStatus
  nodeCount: number
  fieldCount: number
  code: string
  creator: string
  createdAt: string
  updatedAt: string
}

export interface TemplateQuery {
  keyword?: string
  status?: TemplateStatus | ''
  page: number
  size: number
}

export interface PaginatedData<T> {
  data: T[]
  total: number
}

// ===== 基础设置 =====
export interface TemplateBase {
  name: string
  code?: string
  description?: string
  initiatorScope: InitiatorScope
  initiatorUserIds?: number[]
  slaPriority: SlaPriority
  defaultTtrMinutes?: number
  defaultTtsMinutes?: number
  amberThreshold: number // 黄灯阈值百分比，默认 80
}

// 兼容旧版模板创建表单（逐步迁移到 TemplateBase）
export interface TemplateForm extends TemplateBase {}

// ===== 表单设计 =====
export interface FormField {
  id: string
  type: string // input, textarea, radio, checkbox, date, upload 等
  label: string
  required: boolean
  source: FieldSource
  defaultValue?: any
  validationRules?: Record<string, any>
  span?: number
}

export interface FormSchema {
  [nodeId: string]: {
    fields: FormField[]
  }
}

// ===== 流程定义 =====
export interface AssignConfig {
  strategy: AssignStrategy
  targetIds: number[]
  multipleMode: AssignMultipleMode
}

export interface SlaLimits {
  ttrMinutes?: number
  ttsMinutes?: number
  amberThreshold?: number
}

export interface NodeAction {
  name: string // 按钮文字，如"通过""驳回"
  targetNodeId: string
  conditionExpression?: string
}

export interface FlowNode {
  id: string
  type: NodeType
  name: string
  assignConfig?: AssignConfig
  slaLimits?: SlaLimits
  actions?: NodeAction[] // confirm 节点操作按钮
  conditionExpression?: string // condition 节点表达式
  formFields?: string[] // 关联的表单字段 ID
}

export interface FlowEdge {
  from: string
  to: string
  condition?: string
}

export interface FlowDefinition {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

// ===== 模板完整详情 =====
export interface TemplateDetail {
  id?: number
  baseInfo: TemplateBase
  formSchema: FormSchema
  flowDefinition: FlowDefinition
}
