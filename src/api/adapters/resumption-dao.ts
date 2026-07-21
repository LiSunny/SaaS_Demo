/**
 * resumption-dao.ts — 复工复产管理 DAO 适配器（Mock 数据，localStorage 持久化）
 */
import type {
  ResumptionPlanItem,
  ResumptionPlan,
  PlanStatus,
  ResumptionQuery,
  PaginatedData,
  ResumptionStep,
  StepStatus,
  OrgTeamMember,
  ResumptionOrder,
} from '@/types/resumption'
import { STEP_META } from '@/types/resumption'
import { createPersistentStore } from '@/utils/db-adapter'

// ===== Mock 管理单元数据（企业层，enterpriseId=1 的物理空间树） =====

export interface ManagementUnit {
  id: number
  enterpriseId: number
  name: string
  parentId: number | null
}

const MOCK_UNITS: ManagementUnit[] = [
  { id: 1, enterpriseId: 1, name: '原料大车间', parentId: null },
  { id: 2, enterpriseId: 1, name: '冲压车间', parentId: 1 },
  { id: 3, enterpriseId: 1, name: '喷涂车间', parentId: 1 },
  { id: 4, enterpriseId: 1, name: '组装车间', parentId: 1 },
  { id: 5, enterpriseId: 1, name: '成品车间', parentId: 1 },
  { id: 6, enterpriseId: 1, name: '锅炉房', parentId: 1 },
  { id: 7, enterpriseId: 1, name: '员工食堂', parentId: null },
  { id: 8, enterpriseId: 1, name: '大门口充电站', parentId: null },
  { id: 9, enterpriseId: 1, name: '消防控制室', parentId: null },
  { id: 10, enterpriseId: 1, name: '公共区', parentId: null },
]

// ===== 默认模板 =====

/** 步骤 2 签责 — 默认责任状模板 */
export const DEFAULT_PLEDGE_CONTENT = `为贯彻"安全第一、预防为主、综合治理"方针，确保春节后复工复产安全有序，本车间全体从业人员郑重承诺：

一、严格遵守安全生产法律法规和本岗位操作规程，不违章指挥、不违章作业、不违反劳动纪律。

二、积极参加安全生产教育培训，掌握本岗位所需的安全知识和操作技能，未经培训合格不上岗。

三、发现事故隐患或者其他不安全因素，立即向现场管理人员报告，并积极参与隐患整改。

四、正确佩戴和使用劳动防护用品，拒绝在不具备安全条件的场所作业。

五、自觉接受安全生产监督检查，对提出的问题及时整改到位。

六、发生事故时，立即如实报告，不迟报、不瞒报、不漏报。`

// ===== 种子数据 =====

const SEED_STEPS: ResumptionStep[] = [
  // 计划 1 — 冲压车间（prepare，完成到第4步）
  { id: 1, planId: 1, stepType: 'build-team', stepOrder: 1, status: 'done', completedBy: '王志刚', completedAt: '2026-02-05 09:30:00', remark: '组建复工小组', attachments: [] },
  { id: 2, planId: 1, stepType: 'sign-pledge', stepOrder: 2, status: 'done', completedBy: '王志刚', completedAt: '2026-02-05 10:15:00', remark: '全员签署完毕', attachments: [], formData: { title: '2026年春节后安全生产责任状', content: DEFAULT_PLEDGE_CONTENT, signers: [{ name: '王志刚', role: '车间主任', signed: true, signedAt: '2026-02-05' }, { name: '李安全', role: '安全员', signed: true, signedAt: '2026-02-05' }, { name: '张工', role: '班组长', signed: true, signedAt: '2026-02-05' }, { name: '王小明', role: '操作工', signed: true, signedAt: '2026-02-05' }, { name: '赵大力', role: '操作工', signed: true, signedAt: '2026-02-05' }], photoUrl: '' } },
  { id: 3, planId: 1, stepType: 'safety-training', stepOrder: 3, status: 'done', completedBy: '李安全', completedAt: '2026-02-05 14:00:00', remark: '全员培训完成', attachments: [], formData: { topic: '节后复工复产安全专项培训', location: '第二培训室', trainDate: '2026-02-05', format: '视频学习', participants: '王志刚、李安全、张工、王小明、赵大力等32人', photoUrls: [] } },
  { id: 4, planId: 1, stepType: 'tech-disclosure', stepOrder: 4, status: 'done', completedBy: '李安全', completedAt: '2026-02-05 16:30:00', remark: '冲压线操作规程交底', attachments: [], formData: { records: [{ position: '冲压操作工', procedureName: '冲压线安全操作规程', assignees: '王小明、赵大力' }, { position: '模具工', procedureName: '模具更换安全规程', assignees: '张工' }], discloseDate: '2026-02-05', discloser: '李安全', photoUrls: [] } },
  { id: 5, planId: 1, stepType: 'hazard-check', stepOrder: 5, status: 'pending', completedBy: '', completedAt: '', remark: '', attachments: [] },
  { id: 6, planId: 1, stepType: 'device-check', stepOrder: 6, status: 'pending', completedBy: '', completedAt: '', remark: '', attachments: [] },
  { id: 7, planId: 1, stepType: 'rectify', stepOrder: 7, status: 'pending', completedBy: '', completedAt: '', remark: '', attachments: [] },
  { id: 8, planId: 1, stepType: 'joint-acceptance', stepOrder: 8, status: 'pending', completedBy: '', completedAt: '', remark: '', attachments: [] },
  { id: 9, planId: 1, stepType: 'issue-order', stepOrder: 9, status: 'pending', completedBy: '', completedAt: '', remark: '', attachments: [] },
  { id: 10, planId: 1, stepType: 'duty-log', stepOrder: 10, status: 'pending', completedBy: '', completedAt: '', remark: '', attachments: [] },
  { id: 11, planId: 1, stepType: 'archive', stepOrder: 11, status: 'pending', completedBy: '', completedAt: '', remark: '', attachments: [] },

  // 计划 2 — 喷涂车间（trial，复工令已签发）
  { id: 12, planId: 2, stepType: 'build-team', stepOrder: 1, status: 'done', completedBy: '陈建国', completedAt: '2026-02-03 08:30:00', remark: '组建复工小组', attachments: [] },
  { id: 13, planId: 2, stepType: 'sign-pledge', stepOrder: 2, status: 'done', completedBy: '陈建国', completedAt: '2026-02-03 09:00:00', remark: '责任状签署完成', attachments: [] },
  { id: 14, planId: 2, stepType: 'safety-training', stepOrder: 3, status: 'done', completedBy: '王安全', completedAt: '2026-02-03 11:30:00', remark: '全员 28 人参加培训，考核通过', attachments: [] },
  { id: 15, planId: 2, stepType: 'tech-disclosure', stepOrder: 4, status: 'done', completedBy: '王安全', completedAt: '2026-02-03 14:00:00', remark: '喷涂线操作规程交底', attachments: [] },
  { id: 16, planId: 2, stepType: 'hazard-check', stepOrder: 5, status: 'done', completedBy: '赵班长', completedAt: '2026-02-04 09:00:00', remark: '排查隐患 3 项，已完成整改', attachments: [] },
  { id: 17, planId: 2, stepType: 'device-check', stepOrder: 6, status: 'done', completedBy: '赵班长', completedAt: '2026-02-04 11:00:00', remark: '喷涂线 6 台设备逐台空载试运行，2 台需维修→已处理', attachments: [] },
  { id: 18, planId: 2, stepType: 'rectify', stepOrder: 7, status: 'done', completedBy: '王安全', completedAt: '2026-02-04 14:00:00', remark: '3 项隐患全部销号，2 台设备维修验收通过', attachments: [] },
  { id: 19, planId: 2, stepType: 'joint-acceptance', stepOrder: 8, status: 'done', completedBy: '陈建国', completedAt: '2026-02-04 16:00:00', remark: '车间主任、安全员、班组长三方签字验收通过', attachments: [] },
  { id: 20, planId: 2, stepType: 'issue-order', stepOrder: 9, status: 'done', completedBy: '周志远', completedAt: '2026-02-04 17:00:00', remark: '厂长签发复工令，同意喷涂车间复产', attachments: [] },
  { id: 21, planId: 2, stepType: 'duty-log', stepOrder: 10, status: 'in_progress', completedBy: '', completedAt: '', remark: '试产第 2 天值班中...', attachments: [] },
  { id: 22, planId: 2, stepType: 'archive', stepOrder: 11, status: 'pending', completedBy: '', completedAt: '', remark: '', attachments: [] },

  // 计划 3 — 组装车间（archived）
  { id: 23, planId: 3, stepType: 'build-team', stepOrder: 1, status: 'done', completedBy: '刘建国', completedAt: '2026-01-15 08:30:00', remark: '节后复工小组组建', attachments: [] },
  { id: 24, planId: 3, stepType: 'sign-pledge', stepOrder: 2, status: 'done', completedBy: '刘建国', completedAt: '2026-01-15 09:00:00', remark: '完成两级责任状签署', attachments: [] },
  { id: 25, planId: 3, stepType: 'safety-training', stepOrder: 3, status: 'done', completedBy: '孙安全', completedAt: '2026-01-15 14:00:00', remark: '全员 45 人培训，含新员工 3 人专项培训', attachments: [] },
  { id: 26, planId: 3, stepType: 'tech-disclosure', stepOrder: 4, status: 'done', completedBy: '孙安全', completedAt: '2026-01-16 10:00:00', remark: '组装线 + 包装线操作规程交底', attachments: [] },
  { id: 27, planId: 3, stepType: 'hazard-check', stepOrder: 5, status: 'done', completedBy: '马班长', completedAt: '2026-01-16 14:00:00', remark: '排查 5 项隐患', attachments: [] },
  { id: 28, planId: 3, stepType: 'device-check', stepOrder: 6, status: 'done', completedBy: '马班长', completedAt: '2026-01-17 10:00:00', remark: '12 台设备逐台检查，3 台保养', attachments: [] },
  { id: 29, planId: 3, stepType: 'rectify', stepOrder: 7, status: 'done', completedBy: '孙安全', completedAt: '2026-01-17 16:00:00', remark: '5 项隐患全部销号', attachments: [] },
  { id: 30, planId: 3, stepType: 'joint-acceptance', stepOrder: 8, status: 'done', completedBy: '刘建国', completedAt: '2026-01-18 09:00:00', remark: '三方验收通过', attachments: [] },
  { id: 31, planId: 3, stepType: 'issue-order', stepOrder: 9, status: 'done', completedBy: '周志远', completedAt: '2026-01-18 10:00:00', remark: '厂长签发复工令', attachments: [] },
  { id: 32, planId: 3, stepType: 'duty-log', stepOrder: 10, status: 'done', completedBy: '马班长', completedAt: '2026-01-21 17:00:00', remark: '3 天试产无异常，正式复产', attachments: [] },
  { id: 33, planId: 3, stepType: 'archive', stepOrder: 11, status: 'done', completedBy: '孙安全', completedAt: '2026-01-22 10:00:00', remark: '全套资料归档完成，含培训签到表、体检报告、验收签字、复工令', attachments: [] },
]

const SEED_TEAM: OrgTeamMember[] = [
  { id: 1, planId: 1, role: '组长', userName: '王志刚', positionKey: 'workshop-director' },
  { id: 2, planId: 1, role: '副组长', userName: '李安全', positionKey: 'workshop-safety-officer' },
  { id: 3, planId: 1, role: '副组长', userName: '张工', positionKey: 'team-leader' },
  { id: 4, planId: 1, role: '成员', userName: '王小明', positionKey: 'team-member' },
  { id: 5, planId: 1, role: '成员', userName: '赵大力', positionKey: 'team-member' },
  { id: 6, planId: 2, role: '组长', userName: '陈建国', positionKey: 'workshop-director' },
  { id: 7, planId: 2, role: '副组长', userName: '王安全', positionKey: 'workshop-safety-officer' },
  { id: 8, planId: 2, role: '副组长', userName: '赵班长', positionKey: 'team-leader' },
  { id: 9, planId: 2, role: '成员', userName: '钱小华', positionKey: 'team-member' },
  { id: 10, planId: 3, role: '组长', userName: '刘建国', positionKey: 'workshop-director' },
  { id: 11, planId: 3, role: '副组长', userName: '孙安全', positionKey: 'workshop-safety-officer' },
  { id: 12, planId: 3, role: '副组长', userName: '马班长', positionKey: 'team-leader' },
  { id: 13, planId: 3, role: '成员', userName: '周小军', positionKey: 'team-member' },
]

const SEED_ORDERS: ResumptionOrder[] = [
  { id: 2, planId: 2, conclusion: '喷涂车间完成"六个一"全部要求，联合验收通过，同意复产。试产期 3 天，请做好值班记录。', issuedBy: '周志远', issuedAt: '2026-02-04 17:00:00', signatureUrl: '' },
  { id: 3, planId: 3, conclusion: '组装车间安全生产条件符合要求，准予正式复产。', issuedBy: '周志远', issuedAt: '2026-01-18 10:00:00', signatureUrl: '' },
]

const SEED_PLANS: ResumptionPlanItem[] = [
  { id: 1, enterpriseId: 1, locationId: 2, locationName: '冲压车间', status: 'prepare', currentStep: 5, startedAt: '2026-02-05', completedAt: '', createdAt: '2026-02-05 08:00:00', updatedAt: '2026-02-05 16:30:00' },
  { id: 2, enterpriseId: 1, locationId: 3, locationName: '喷涂车间', status: 'trial', currentStep: 10, startedAt: '2026-02-03', completedAt: '', createdAt: '2026-02-03 08:00:00', updatedAt: '2026-02-04 17:00:00' },
  { id: 3, enterpriseId: 1, locationId: 4, locationName: '组装车间', status: 'production', currentStep: 11, startedAt: '2026-01-15', completedAt: '2026-01-22', createdAt: '2026-01-15 08:00:00', updatedAt: '2026-01-22 10:00:00' },
]

// ===== 持久化 Store =====

const planStore = createPersistentStore('resumption_plans_v3', SEED_PLANS)
const stepStore = createPersistentStore('resumption_steps_v3', SEED_STEPS)
const teamStore = createPersistentStore('resumption_team_v3', SEED_TEAM)
const orderStore = createPersistentStore('resumption_orders_v3', SEED_ORDERS)
const unitStore = createPersistentStore('management_units_v2', MOCK_UNITS)

/** 获取企业的管理单元列表（平铺，用于下拉选择） */
export async function getManagementUnits(enterpriseId: number): Promise<ManagementUnit[]> {
  return unitStore.findBy(u => u.enterpriseId === enterpriseId)
}

// ===== 内部辅助 =====

function stepsForPlan(planId: number): ResumptionStep[] {
  return stepStore.findBy(s => s.planId === planId).sort((a, b) => a.stepOrder - b.stepOrder)
}

function teamForPlan(planId: number): OrgTeamMember[] {
  return teamStore.findBy(t => t.planId === planId)
}

function orderForPlan(planId: number): ResumptionOrder | undefined {
  return orderStore.findBy(o => o.planId === planId)[0]
}

// ===== 公开 API =====

/** 当前步骤标签 */
export function getStepLabel(plan: ResumptionPlanItem): string {
  const steps = stepsForPlan(plan.id)
  const current = steps.find(s => s.status !== 'done')
  if (!current) return '已完成'
  const meta = STEP_META.find(m => m.order === current.stepOrder)
  return meta ? meta.label : `步骤${current.stepOrder}`
}

/** 列表查询 */
export async function getResumptionPlanList(query: ResumptionQuery): Promise<PaginatedData<ResumptionPlanItem>> {
  let list = planStore.getAll()

  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    list = list.filter(p => p.locationName.toLowerCase().includes(kw))
  }

  if (query.status) {
    const statuses = query.status.split(',')
    list = list.filter(p => statuses.includes(p.status))
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = list.length
  const start = (query.page - 1) * query.size
  const data = list.slice(start, start + query.size)

  return { data, total }
}

/** 获取详情（含步骤、小组、复工令） */
export async function getResumptionPlanDetail(id: number): Promise<ResumptionPlan | null> {
  const plan = planStore.getById(id)
  if (!plan) return null

  return {
    ...plan,
    steps: stepsForPlan(id),
    team: teamForPlan(id),
    order: orderForPlan(id) || null,
  }
}

/** 新建计划 */
export async function createResumptionPlan(locationName: string, enterpriseId = 1, locationId?: number): Promise<ResumptionPlanItem> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const planId = planStore.nextId()

  const plan: ResumptionPlanItem = {
    id: planId,
    enterpriseId,
    locationId,
    locationName,
    status: 'prepare',
    currentStep: 1,
    startedAt: now.slice(0, 10),
    completedAt: '',
    createdAt: now,
    updatedAt: now,
  }
  planStore.add(plan)

  // 自动创建 11 个 pending 步骤
  for (const meta of STEP_META) {
    const stepId = stepStore.nextId()
    stepStore.add({
      id: stepId,
      planId,
      stepType: meta.type,
      stepOrder: meta.order,
      status: 'pending',
      completedBy: '',
      completedAt: '',
      remark: '',
      attachments: [],
    })
  }

  return plan
}

/** 更新步骤（标记完成/取消完成） */
export async function updateStep(
  stepId: number,
  data: { status?: StepStatus; completedBy?: string; remark?: string; formData?: Record<string, any> }
): Promise<ResumptionStep | null> {
  const step = stepStore.getById(stepId) as ResumptionStep | undefined
  if (!step) return null

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  stepStore.update(stepId, {
    ...data,
    completedAt: data.status === 'done' ? now : (data.status === 'pending' ? '' : step.completedAt),
  })

  // 更新计划的 currentStep 和 status（4 阶段对应 4 状态）
  const plan = planStore.getById(step.planId)
  if (plan) {
    const steps = stepsForPlan(step.planId)
    const firstPending = steps.find(s => s.status !== 'done')
    const newCurrentStep = firstPending ? firstPending.stepOrder : 11
    const jointAcceptance = steps.find(s => s.stepType === 'joint-acceptance')
    const issueOrder = steps.find(s => s.stepType === 'issue-order')
    const dutyLog = steps.find(s => s.stepType === 'duty-log')
    let newStatus: PlanStatus = 'prepare'
    if (jointAcceptance?.status !== 'done') newStatus = 'prepare'
    else if (issueOrder?.status !== 'done') newStatus = 'review'
    else if (dutyLog?.status !== 'done') newStatus = 'trial'
    else newStatus = 'production'

    planStore.update(plan.id, {
      currentStep: newCurrentStep,
      status: newStatus,
      completedAt: newStatus === 'production' ? (plan.completedAt || now.slice(0, 10)) : '',
      updatedAt: now,
    })
  }

  return updated
}

/** 更新小组名单（全量替换） */
export async function updateTeamMembers(
  planId: number,
  members: Omit<OrgTeamMember, 'id' | 'planId'>[]
): Promise<OrgTeamMember[]> {
  // 删除旧成员
  const oldMembers = teamStore.findBy(m => m.planId === planId)
  for (const m of oldMembers) {
    teamStore.remove(m.id)
  }
  // 插入新成员
  const result: OrgTeamMember[] = []
  for (const m of members) {
    const id = teamStore.nextId()
    const member: OrgTeamMember = { id, planId, ...m }
    teamStore.add(member)
    result.push(member)
  }
  return result
}

/** 获取小组名单 */
export async function getTeamMembers(planId: number): Promise<OrgTeamMember[]> {
  return teamStore.findBy(m => m.planId === planId)
}
