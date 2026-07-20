// ===== 枚举 =====

/** 计划状态 */
export type PlanStatus = 'preparing' | 'trial' | 'archived'

/** 步骤类型（11 步串行） */
export type StepType =
  | 'build-team'       // 建组
  | 'sign-pledge'      // 签责
  | 'safety-training'  // 安全培训
  | 'tech-disclosure'  // 技术交底
  | 'hazard-check'     // 隐患排查
  | 'device-check'     // 设备体检
  | 'rectify'          // 整改闭环
  | 'joint-acceptance' // 联合验收
  | 'issue-order'      // 签发复工令
  | 'duty-log'         // 试产值班
  | 'archive'          // 归档组卷

/** 步骤状态 */
export type StepStatus = 'pending' | 'in_progress' | 'done'

// ===== 阶段定义（4 阶段） =====

export interface StageDef {
  key: string
  label: string
  stepOrders: number[]
  isMilestone: boolean
}

export const STAGES: StageDef[] = [
  { key: 'prepare', label: '复工准备', stepOrders: [1, 2, 3, 4, 5, 6, 7], isMilestone: false },
  { key: 'review', label: '复工审核', stepOrders: [8, 9], isMilestone: true },
  { key: 'trial', label: '试产观察', stepOrders: [10], isMilestone: true },
  { key: 'production', label: '正式复产', stepOrders: [11], isMilestone: false },
]

// ===== 步骤元数据（静态配置） =====

export interface StepMeta {
  type: StepType
  order: number
  label: string
  stage: string      // 所属阶段 key
  sixOneLabel?: string  // 对应"六个一"标签
  executor: string      // 执行角色
}

/** 11 个步骤的静态元数据（不从数据库读取） */
export const STEP_META: StepMeta[] = [
  { type: 'build-team', order: 1, label: '建组', stage: 'prepare', executor: '车间主任' },
  { type: 'sign-pledge', order: 2, label: '签责', stage: 'prepare', sixOneLabel: '⑥完善安全审批管理手续', executor: '车间主任→班组长→成员' },
  { type: 'safety-training', order: 3, label: '安全培训', stage: 'prepare', sixOneLabel: '②组织安全生产教育培训', executor: '车间安全员' },
  { type: 'tech-disclosure', order: 4, label: '技术交底', stage: 'prepare', sixOneLabel: '③实施全面安全技术交底', executor: '车间安全员' },
  { type: 'hazard-check', order: 5, label: '隐患排查', stage: 'prepare', sixOneLabel: '④排查安全生产问题隐患', executor: '班组长+成员' },
  { type: 'device-check', order: 6, label: '设备体检', stage: 'prepare', sixOneLabel: '⑤进行设施设备维护保养', executor: '班组长/设备管理员' },
  { type: 'rectify', order: 7, label: '整改闭环', stage: 'prepare', sixOneLabel: '④隐患整改验收', executor: '班组长+安全员' },
  { type: 'joint-acceptance', order: 8, label: '联合验收', stage: 'review', executor: '车间主任+安全员+班组长' },
  { type: 'issue-order', order: 9, label: '签发复工令', stage: 'review', executor: '厂长/总经理' },
  { type: 'duty-log', order: 10, label: '试产值班', stage: 'trial', executor: '班组长' },
  { type: 'archive', order: 11, label: '归档组卷', stage: 'production', executor: '车间安全员' },
]

// ===== 实体 =====

/** 复工计划列表项 */
export interface ResumptionPlanItem {
  id: number
  enterpriseId: number
  /** 关联管理单元节点 ID（预留，light 阶段可选） */
  locationId?: number
  /** 复工场所名称（关联管理单元时自动填充，也可手动输入） */
  locationName: string
  status: PlanStatus
  currentStep: number // 当前步骤序号 1-11
  startedAt: string
  completedAt: string
  createdAt: string
  updatedAt: string
}

/** 复工步骤 */
export interface ResumptionStep {
  id: number
  planId: number
  stepType: StepType
  stepOrder: number
  status: StepStatus
  completedBy: string
  completedAt: string
  remark: string
  attachments: string[]
}

/** 组织小组成员 */
export interface OrgTeamMember {
  id: number
  planId: number
  role: '组长' | '副组长' | '成员'
  userName: string
  positionKey: string
}

/** 复工令 */
export interface ResumptionOrder {
  id: number
  planId: number
  conclusion: string
  issuedBy: string
  issuedAt: string
  signatureUrl: string
}

/** 复工计划详情（含步骤、小组、复工令） */
export interface ResumptionPlan extends ResumptionPlanItem {
  steps: ResumptionStep[]
  team: OrgTeamMember[]
  order: ResumptionOrder | null
}

// ===== 查询/分页 =====

export interface ResumptionQuery {
  keyword?: string
  status?: string
  page: number
  size: number
}

export interface PaginatedData<T> {
  data: T[]
  total: number
}
