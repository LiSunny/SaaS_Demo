import type { WorkOrderItem, WorkOrderQuery, WorkOrderDetail, WorkOrderStats, PaginatedData, SlaStatus, NodeStatus } from '@/types/work-order'

// ===== 角色 =====
const ORGS = {
  property:  { id: 1001, name: 'xxx物业管理有限公司' },
  fireSvc:   { id: 1002, name: 'yyy消防技术服务公司' },
  safetyMgr: { id: 1003, name: 'zzz安全管理中心（监管方）' },
}
const PERSONS = {
  张三: { id: 10, org: 'property'  },
  李四: { id: 11, org: 'property'  },
  王五: { id: 12, org: 'fireSvc'   },
  赵六: { id: 13, org: 'safetyMgr' },
  陈七: { id: 14, org: 'fireSvc'   },
  杨八: { id: 15, org: 'safetyMgr' },
  刘九: { id: 16, org: 'property'  },
  系统: { id: 0,  org: null as unknown as string },
}

// ===== 工单定义 =====
interface OrderDef {
  templateName: string
  templateVersion: number
  priority: WorkOrderItem['priority']
  status: WorkOrderItem['status']
  orderNo: string
  creator: string
  assignee: string
  createdAt: string
  closedAt?: string
  ttrMinutes: number | null
  ttsMinutes: number
  slaStatus: SlaStatus
}
function p(name: string) {
  const p = (PERSONS as any)[name]
  return { id: p.id, name, orgId: (ORGS as any)[p.org]?.id ?? 0, orgName: (ORGS as any)[p.org]?.name ?? '' }
}

const orders: OrderDef[] = [
  // ─── 1. 设备维修工单 — 消火栓泵压力不足 ───
  {
    templateName: '设备维修工单模板', templateVersion: 3,
    priority: 'urgent', status: 'processing',
    orderNo: 'WO20260508-001',
    creator: '张三', assignee: '王五',
    createdAt: '2026-05-08 09:15:00',
    ttrMinutes: 30, ttsMinutes: 240,
    slaStatus: 'warning',
  },
  // ─── 2. 隐患整改工单 — 疏散通道被占用 ───
  {
    templateName: '隐患整改工单模板', templateVersion: 2,
    priority: 'urgent', status: 'pending_accept',
    orderNo: 'WO20260515-002',
    creator: '李四', assignee: '陈七',
    createdAt: '2026-05-15 14:30:00',
    ttrMinutes: 60, ttsMinutes: 480,
    slaStatus: 'normal',
  },
  // ─── 3. 安全生产督办工单 — 季度消防检查 ───
  {
    templateName: '安全生产督办流程', templateVersion: 1,
    priority: 'normal', status: 'closed',
    orderNo: 'WO20260501-003',
    creator: '赵六', assignee: '',
    createdAt: '2026-05-01 08:00:00',
    closedAt: '2026-05-22 17:30:00',
    ttrMinutes: 120, ttsMinutes: 2880,
    slaStatus: 'normal',
  },
  // ─── 4. 故障保修工单 — 火灾报警控制器故障 ───
  {
    templateName: '故障报修流程', templateVersion: 1,
    priority: 'urgent', status: 'verifying',
    orderNo: 'WO20260520-004',
    creator: '张三', assignee: '王五',
    createdAt: '2026-05-20 06:45:00',
    ttrMinutes: 15, ttsMinutes: 120,
    slaStatus: 'timeout',
  },
  // ─── 5. 设备维修工单 — 灭火器过期更换 ───
  {
    templateName: '设备维修工单模板', templateVersion: 3,
    priority: 'normal', status: 'pending_assign',
    orderNo: 'WO20260525-005',
    creator: '李四', assignee: '',
    createdAt: '2026-05-25 10:00:00',
    ttrMinutes: 60, ttsMinutes: 720,
    slaStatus: 'normal',
  },
  // ─── 6. 隐患整改工单 — 电气线路老化 ───
  {
    templateName: '隐患整改工单模板', templateVersion: 2,
    priority: 'urgent', status: 'draft',
    orderNo: 'WO20260528-006',
    creator: '张三', assignee: '',
    createdAt: '2026-05-28 16:20:00',
    ttrMinutes: null, ttsMinutes: 1440,
    slaStatus: 'normal',
  },
  // ─── 7. 安全生产督办工单 — 消防演练督办 ───
  {
    templateName: '安全生产督办流程', templateVersion: 1,
    priority: 'normal', status: 'verifying',
    orderNo: 'WO20260510-007',
    creator: '杨八', assignee: '刘九',
    createdAt: '2026-05-10 08:30:00',
    ttrMinutes: 120, ttsMinutes: 1440,
    slaStatus: 'warning',
  },
  // ─── 8. 故障保修工单 — 喷淋头误喷水 ───
  {
    templateName: '故障报修流程', templateVersion: 1,
    priority: 'urgent', status: 'closed',
    orderNo: 'WO20260503-008',
    creator: '刘九', assignee: '',
    createdAt: '2026-05-03 11:10:00',
    closedAt: '2026-05-03 14:50:00',
    ttrMinutes: 10, ttsMinutes: 180,
    slaStatus: 'normal',
  },
  // ─── 9. 设备维修工单 — 防火门闭门器损坏 ───
  {
    templateName: '设备维修工单模板', templateVersion: 3,
    priority: 'normal', status: 'pending_accept',
    orderNo: 'WO20260518-009',
    creator: '李四', assignee: '陈七',
    createdAt: '2026-05-18 13:00:00',
    ttrMinutes: 60, ttsMinutes: 360,
    slaStatus: 'normal',
  },
  // ─── 10. 隐患整改工单 — 消防通道标识不清 ───
  {
    templateName: '隐患整改工单模板', templateVersion: 2,
    priority: 'low', status: 'closed',
    orderNo: 'WO20260428-010',
    creator: '张三', assignee: '',
    createdAt: '2026-04-28 09:00:00',
    closedAt: '2026-05-05 16:00:00',
    ttrMinutes: null, ttsMinutes: 10080,
    slaStatus: 'normal',
  },
]

// ===== 节点名称（每种模板不同） =====
const NODE_NAMES: Record<string, string[]> = {
  '设备维修工单模板': ['发起节点', '指派工程师', '现场维修', '验收确认', '关闭节点'],
  '隐患整改工单模板': ['发起节点', '指派整改人', '整改执行', '复查验收', '关闭节点'],
  '安全生产督办流程':   ['发起节点', '下发督办', '整改落实', '核查确认', '关闭节点'],
  '故障报修流程':       ['发起节点', '派单调度', '故障排查', '修复确认', '关闭节点'],
}

const NODE_TYPES = ['start', 'assign', 'execute', 'confirm', 'close']

// 状态 → 节点进度映射
const STATUS_NODE_MAP: Record<string, { nodeIdx: number }> = {
  draft:          { nodeIdx: 0 },
  pending_assign: { nodeIdx: 0 },
  pending_accept: { nodeIdx: 1 },
  processing:     { nodeIdx: 2 },
  verifying:      { nodeIdx: 3 },
  closed:         { nodeIdx: 4 },
}

// ===== 构建列表 =====
function buildMockList(): WorkOrderItem[] {
  return orders.map((def, i) => {
    const id = i + 1
    const creator = p(def.creator)
    const assigneeName = def.assignee || null
    const map = STATUS_NODE_MAP[def.status]
    const nodeNames = NODE_NAMES[def.templateName]
    const ttsMinutes = def.ttsMinutes
    const ttrMinutes = def.ttrMinutes
    const createdAt = def.createdAt
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    // SLA
    const ttsStartedAt = new Date(new Date(createdAt).getTime() + (ttrMinutes ? (ttrMinutes + 5) * 60000 : 5 * 60000))
      .toISOString().replace('T', ' ').slice(0, 19)

    let ttsProgress = 0
    let slaStatus: SlaStatus = 'normal'
    if (def.status === 'closed') {
      // 已关闭：基于 closedAt 与 createdAt 计算实际耗时 / 时限
      const closedMs = def.closedAt ? new Date(def.closedAt).getTime() : Date.now()
      const startMs = new Date(ttsStartedAt).getTime()
      const elapsed = Math.max(1, (closedMs - startMs) / 60000)
      ttsProgress = Math.round(elapsed / ttsMinutes * 100) / 100
      if (ttsProgress >= 1) slaStatus = 'timeout'
      else if (ttsProgress >= 0.8) slaStatus = 'warning'
      else slaStatus = 'normal'
    } else if (def.status === 'draft') {
      slaStatus = 'normal'
    } else {
      // 进行中：基于当前时间
      const elapsed = Math.max(0, (Date.now() - new Date(ttsStartedAt).getTime()) / 60000)
      ttsProgress = Math.round(Math.min(elapsed / ttsMinutes, 2) * 100) / 100
      if (ttsProgress >= 1) slaStatus = 'timeout'
      else if (ttsProgress >= 0.8) slaStatus = 'warning'
      else slaStatus = 'normal'
    }

    return {
      id,
      orderNo: def.orderNo,
      templateId: id,
      templateName: def.templateName,
      templateVersion: def.templateVersion,
      status: def.status,
      priority: def.priority,
      currentNodeId: def.status === 'closed' ? null : 100 + map.nodeIdx + 1,
      currentNodeName: def.status === 'closed' ? null : nodeNames[map.nodeIdx],
      currentNodeIndex: map.nodeIdx + 1,
      totalNodes: 5,
      currentNodeType: def.status === 'closed' ? null : NODE_TYPES[map.nodeIdx],
      currentAssigneeId: assigneeName ? (PERSONS as any)[assigneeName]?.id ?? null : null,
      currentAssigneeName: assigneeName,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorOrgId: creator.orgId,
      creatorOrgName: creator.orgName,
      parentOrderId: null,
      createdAt,
      updatedAt: now,
      closedAt: def.closedAt || null,
      closedBy: def.closedAt ? '系统' : null,
      sla: {
        ttrMinutes,
        ttsMinutes,
        ttrStartedAt: ttrMinutes ? new Date(new Date(createdAt).getTime() + 300000).toISOString().replace('T', ' ').slice(0, 19) : null,
        ttrEndedAt: ttrMinutes && def.status !== 'draft' ? new Date(new Date(createdAt).getTime() + (ttrMinutes + 7) * 60000).toISOString().replace('T', ' ').slice(0, 19) : null,
        ttsStartedAt,
        ttsPausedAt: null,
        yellowThreshold: 0.8,
        ttrProgress: null,
        ttsProgress,
        slaStatus,
      },
    }
  })
}

const mockList = buildMockList()

// ===== 构建详情（与列表同源，数据完全一致） =====
function buildDetail(id: number): WorkOrderDetail {
  const item = mockList.find(w => w.id === id)
  if (!item) throw new Error(`工单 ${id} 不存在`)

  const map = STATUS_NODE_MAP[item.status]
  const nowIdx = map.nodeIdx
  const nodeNames = NODE_NAMES[item.templateName]
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const base = new Date(item.createdAt).getTime()

  // 为每个节点计算时间（1h ~ 6h 间隔）
  const nodeTimes: (string | null)[] = []
  for (let n = 0; n < 5; n++) {
    if (item.status === 'closed') {
      nodeTimes.push(new Date(base + (n + 1) * 3600000 * (2 + Math.random() * 3)).toISOString().replace('T', ' ').slice(0, 19))
    } else if (n <= nowIdx) {
      nodeTimes.push(new Date(base + (n + 1) * 3600000 * (1.5 + Math.random() * 3)).toISOString().replace('T', ' ').slice(0, 19))
    } else {
      nodeTimes.push(null)
    }
  }

  function ns(n: number): NodeStatus {
    if (nowIdx >= n) return 'completed'
    if (nowIdx === n - 1 && item!.status !== 'draft') return 'in_progress'
    return 'pending'
  }

  const nodes = [
    { id: 101, name: nodeNames[0], type: NODE_TYPES[0], status: 'completed' as const, assigneeName: item.creatorName, completedAt: nodeTimes[0], order: 1 },
    { id: 102, name: nodeNames[1], type: NODE_TYPES[1], status: ns(1), assigneeName: '系统', completedAt: nowIdx >= 1 ? nodeTimes[1] : null, order: 2 },
    { id: 103, name: nodeNames[2], type: NODE_TYPES[2], status: ns(2), assigneeName: item.currentAssigneeName, completedAt: nowIdx >= 2 ? nodeTimes[2] : null, order: 3 },
    { id: 104, name: nodeNames[3], type: NODE_TYPES[3], status: ns(3), assigneeName: item.creatorName, completedAt: nowIdx >= 3 ? nodeTimes[3] : null, order: 4 },
    { id: 105, name: nodeNames[4], type: NODE_TYPES[4], status: ns(4), assigneeName: null, completedAt: item.closedAt || null, order: 5 },
  ]

  // 为已完成/进行中节点生成操作记录
  const records: WorkOrderDetail['records'] = []
  let rid = 301
  const r = (op: string, operator: string, org: string | null, content: string, time: string) => {
    records.push({ id: rid++, action: op, operatorName: operator, operatorOrgName: org, content, createdAt: time })
  }

  r('创建工单', item.creatorName, item.creatorOrgName,
    `提交${item.templateName}，优先级：${item.priority === 'urgent' ? '紧急' : item.priority === 'normal' ? '普通' : '低优'}`,
    item.createdAt)

  if (nodes[1].status !== 'pending') {
    r('系统指派', '系统', null,
      `根据模板规则自动分配处理人至“${nodeNames[2]}”节点`,
      nodes[1].completedAt || new Date(base + 7200000).toISOString().replace('T', ' ').slice(0, 19))
  }
  if (nodes[2].status === 'completed') {
    r('提交处理结果', item.currentAssigneeName || '—', ORGS.fireSvc.name,
      `${nodeNames[2]}完成，提交验收`,
      nodes[2].completedAt!)
  }
  if (nodes[2].status === 'in_progress') {
    r('接单处理', item.currentAssigneeName || '—', ORGS.fireSvc.name,
      `接单开始处理“${nodeNames[2]}”`,
      new Date(base + 3600000 * 3).toISOString().replace('T', ' ').slice(0, 19))
  }
  if (nodes[3].status === 'completed') {
    r('验收通过', item.creatorName, item.creatorOrgName,
      `${nodeNames[3]}审核通过，确认问题已解决`,
      nodes[3].completedAt!)
  }
  if (nodes[3].status === 'in_progress') {
    r('开始验收', item.creatorName, item.creatorOrgName,
      `开始对“${nodeNames[2]}”结果进行验收`,
      new Date(base + 3600000 * 10).toISOString().replace('T', ' ').slice(0, 19))
  }
  if (nodes[4].status === 'completed') {
    r('工单关闭', item.closedBy || '系统', null,
      '所有节点已完成，工单自动关闭归档',
      item.closedAt || now)
  }

  return { ...item, nodes, records }
}

// ===== API =====
export async function getWorkOrderList(query: WorkOrderQuery): Promise<PaginatedData<WorkOrderItem>> {
  let filtered = [...mockList]

  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    filtered = filtered.filter(w => w.orderNo.toLowerCase().includes(kw) || w.creatorName.includes(kw) || w.templateName.includes(kw))
  }
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean)
    if (statuses.length) filtered = filtered.filter(w => statuses.includes(w.status))
  }
  if (query.templateId) filtered = filtered.filter(w => w.templateId === query.templateId)
  if (query.priority) filtered = filtered.filter(w => w.priority === query.priority)
  if (query.slaStatus) filtered = filtered.filter(w => w.sla.slaStatus === query.slaStatus)
  if (query.startDate) filtered = filtered.filter(w => w.createdAt >= query.startDate!)
  if (query.endDate) filtered = filtered.filter(w => w.createdAt <= query.endDate! + ' 23:59:59')

  // 超时置顶
  filtered.sort((a, b) => {
    if (a.sla.slaStatus === 'timeout' && b.sla.slaStatus !== 'timeout') return -1
    if (a.sla.slaStatus !== 'timeout' && b.sla.slaStatus === 'timeout') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const total = filtered.length
  const start = (query.page - 1) * query.size
  const list = filtered.slice(start, start + query.size)

  await new Promise(r => setTimeout(r, 300))
  return { list, total, stats: getStats(filtered) }
}

export async function createWorkOrder(data: { templateId: number; templateName: string; templateVersion: number; priority: string; creatorName: string }): Promise<WorkOrderItem> {
  await new Promise(r => setTimeout(r, 300))
  const now = new Date()
  const createdAt = now.toISOString().replace('T', ' ').slice(0, 19)
  const id = mockList.length + 1
  const orderNo = `WO${createdAt.slice(0, 10).replace(/-/g, '')}-${String(id).padStart(3, '0')}`
  const item: WorkOrderItem = {
    id, orderNo,
    templateId: data.templateId,
    templateName: data.templateName,
    templateVersion: data.templateVersion,
    status: 'draft',
    priority: data.priority as WorkOrderItem['priority'],
    currentNodeId: 101,
    currentNodeName: '发起节点',
    currentNodeIndex: 1,
    totalNodes: 5,
    currentNodeType: 'start',
    currentAssigneeId: null,
    currentAssigneeName: null,
    creatorId: 10,
    creatorName: data.creatorName,
    creatorOrgId: 1001,
    creatorOrgName: 'xxx物业管理有限公司',
    parentOrderId: null,
    createdAt,
    updatedAt: createdAt,
    closedAt: null,
    closedBy: null,
    sla: {
      ttrMinutes: null,
      ttsMinutes: 1440,
      ttrStartedAt: null,
      ttrEndedAt: null,
      ttsStartedAt: new Date(now.getTime() + 300000).toISOString().replace('T', ' ').slice(0, 19),
      ttsPausedAt: null,
      yellowThreshold: 0.8,
      ttrProgress: null,
      ttsProgress: 0,
      slaStatus: 'normal',
    },
  }
  mockList.unshift(item)
  return item
}

export async function getWorkOrderDetail(id: number): Promise<WorkOrderDetail> {
  await new Promise(r => setTimeout(r, 200))
  return buildDetail(id)
}

export async function cancelWorkOrder(id: number, _reason: string): Promise<{ id: number; orderNo: string; status: string; closedAt: string; closedBy: string }> {
  await new Promise(r => setTimeout(r, 200))
  const item = mockList.find(w => w.id === id)
  if (!item) throw new Error('工单不存在')
  if (item.status === 'closed') throw new Error('工单已关闭')
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  ;(item as any).status = 'closed'
  ;(item as any).closedAt = now
  ;(item as any).closedBy = '平台管理员'
  return { id, orderNo: item.orderNo, status: 'closed', closedAt: now, closedBy: '平台管理员' }
}

export async function reassignWorkOrder(id: number, targetUserId: number, _reason: string): Promise<{ id: number; orderNo: string; previousAssigneeName: string; currentAssigneeName: string }> {
  await new Promise(r => setTimeout(r, 200))
  const item = mockList.find(w => w.id === id)
  if (!item) throw new Error('工单不存在')
  if (item.status === 'closed') throw new Error('工单已关闭')
  const prev = item.currentAssigneeName || '未分配'
  ;(item as any).currentAssigneeId = targetUserId
  ;(item as any).currentAssigneeName = ['王五', '赵六', '陈七'][targetUserId % 3]
  return { id, orderNo: item.orderNo, previousAssigneeName: prev, currentAssigneeName: item.currentAssigneeName! }
}

export async function getWorkOrderStats(): Promise<WorkOrderStats> {
  await new Promise(r => setTimeout(r, 100))
  return getStats(mockList)
}

function getStats(list: WorkOrderItem[]): WorkOrderStats {
  return {
    all: list.length,
    draft: list.filter(w => w.status === 'draft').length,
    pendingAssign: list.filter(w => w.status === 'pending_assign').length,
    pendingAccept: list.filter(w => w.status === 'pending_accept').length,
    processing: list.filter(w => w.status === 'processing').length,
    verifying: list.filter(w => w.status === 'verifying').length,
    closed: list.filter(w => w.status === 'closed').length,
  }
}
