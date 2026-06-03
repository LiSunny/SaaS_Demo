// ===== 枚举 =====
export type InstanceStatus = 'draft' | 'pending_assign' | 'pending_accept' | 'processing' | 'verifying' | 'closed'
export type Priority = 'urgent' | 'normal' | 'low'
export type SlaStatus = 'normal' | 'warning' | 'timeout'
export type NodeStatus = 'completed' | 'in_progress' | 'pending'

// ===== SLA 子对象 =====
export interface SlaInfo {
  ttrMinutes: number | null
  ttsMinutes: number
  ttrStartedAt: string | null
  ttrEndedAt: string | null
  ttsStartedAt: string
  ttsPausedAt: string | null
  yellowThreshold: number
  ttrProgress: number | null
  ttsProgress: number
  slaStatus: SlaStatus
}

// ===== 列表相关 =====
export interface WorkOrderItem {
  id: number
  orderNo: string
  templateId: number
  templateName: string
  templateVersion: number
  status: InstanceStatus
  priority: Priority
  currentNodeId: number | null
  currentNodeName: string | null
  currentNodeIndex: number
  totalNodes: number
  currentNodeType: string | null
  currentAssigneeId: number | null
  currentAssigneeName: string | null
  creatorId: number
  creatorName: string
  creatorOrgId: number
  creatorOrgName: string
  parentOrderId: number | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
  closedBy: string | null
  sla: SlaInfo
  formData?: FormData              // 发起时提交的表单数据
}

export interface WorkOrderQuery {
  keyword?: string
  status?: string
  templateId?: number | ''
  priority?: Priority | ''
  slaStatus?: SlaStatus | ''
  startDate?: string
  endDate?: string
  page: number
  size: number
}

// ===== 统计 =====
export interface WorkOrderStats {
  all: number
  draft: number
  pendingAssign: number
  pendingAccept: number
  processing: number
  verifying: number
  closed: number
}

// ===== 详情相关 =====
export interface WorkOrderNode {
  id: number
  name: string
  type: string
  status: NodeStatus
  assigneeName: string | null
  startedAt: string | null     // 该节点开始处理的时间
  completedAt: string | null
  order: number
}

export interface WorkOrderRecord {
  id: number
  action: string
  operatorName: string
  operatorOrgName: string | null
  content: string
  createdAt: string
}

export interface WorkOrderDetail extends WorkOrderItem {
  nodes: WorkOrderNode[]
  records: WorkOrderRecord[]
  nodeRecords?: NodeFormRecord[]   // 各节点提交的表单记录
}

// ===== 分页 =====
export interface PaginatedData<T> {
  list: T[]
  total: number
  stats?: WorkOrderStats
}

// ===== 新增：表单数据（发起工单用） =====

/** 表单数据（key 为 fieldId） */
export type FormData = Record<string, any>

/** 节点表单记录 */
export interface NodeFormRecord {
  id: number
  nodeId: string
  nodeName: string
  submittedBy: string
  submittedByOrg: string
  submittedAt: string
  data: FormData
}

/** 创建工单参数 */
export interface CreateOrderParams {
  templateId: number
  templateName: string
  templateVersion: number
  priority: string
  creatorName: string
  formData: Record<string, any>  // 用户填写的表单数据
  totalNodes: number             // 来自 flowDefinition.nodes.length
  ttrMinutes: number | null      // 来自模板 baseInfo.defaultTtrMinutes
  ttsMinutes: number             // 来自模板 baseInfo.defaultTtsMinutes
}
