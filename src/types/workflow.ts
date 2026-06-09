// ===== 枚举 =====
export type TemplateStatus = 0 | 1 | 2 | 3 // 待生效 | 执行中 | 已停用 | 已过期

export type SlaPriority = 'urgent' | 'high' | 'normal' | 'low'
export type InitiatorScope = 'all' | 'specified'
export type NodeType = 'start' | 'assign' | 'execute' | 'confirm' | 'close' | 'condition' | 'external'
export type AssignStrategy = 'position' | 'user' | 'role' | 'dept' | 'external'
export type AssignMultipleMode = 'anyone' | 'each'
export type AssignSource = 'static' | 'dynamic' | 'initiator'
export type FieldSource = 'manual' | 'auto' | 'inherited' | 'callback'
export type NotifyChannel = 'in_app' | 'sms' | 'voice'

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
  /** 默认抄送岗位名称列表，节点可继承或覆盖 */
  defaultCcPositionNames?: string[]
}

// 兼容旧版模板创建表单（逐步迁移到 TemplateBase）
export interface TemplateForm extends TemplateBase {}

// ===== 动态数据源配置 =====
export interface CallbackConfig {
  type: 'person' | 'department' | 'position'
}

// ===== 表单设计 =====
export interface FormField {
  id: string
  type: string // input, textarea, radio, checkbox, date, upload 等
  label: string
  required: boolean
  source: FieldSource
  defaultValue?: any
  options?: { value: string; label: string }[]
  validationRules?: Record<string, any>
  span?: number
  /** 动态数据源配置（source === 'callback' 时生效） */
  callbackConfig?: CallbackConfig
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

/** SLA 超时通知配置 */
export interface SlaNotification {
  enabled: boolean
  channels: NotifyChannel[]
  ccSource: 'template' | 'custom'
  /** 自定义抄送岗位名称列表（ccSource='custom' 时生效） */
  ccPositionNames?: string[]
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
  assignSource?: AssignSource
  assignConfig?: AssignConfig
  dynamicAssignFieldId?: string
  /** @deprecated 使用 assignSource='initiator' 代替。仅 confirm 节点：勾选后运行时负责人 = 发起人 */
  assignToInitiator?: boolean
  slaLimits?: SlaLimits
  actions?: NodeAction[]
  conditionExpression?: string
  formFields?: FieldPermission[]
  /** 节点完成时通知下一节点处理人 */
  notifyOnComplete?: boolean
  /** SLA 超时通知配置 */
  slaNotification?: SlaNotification
}

export interface FieldPermission {
  fieldId: string
  mode?: string // 'hidden' | 'readonly' | 'editable'，默认 'readonly'
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
