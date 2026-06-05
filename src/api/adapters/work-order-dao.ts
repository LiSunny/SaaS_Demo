/**
 * work-order-dao.ts — 工单 DAO 适配器
 *
 * 从当前 work-order.ts 迁移而来，新增 formData 支持。
 */

import type { WorkOrderItem, WorkOrderQuery, WorkOrderDetail, WorkOrderStats, SlaStatus, NodeStatus, InstanceStatus } from '@/types/work-order'
import type { CreateOrderParams } from '@/types/work-order'
import { createPersistentStore } from '@/utils/db-adapter'
import { BUILTIN_DETAILS } from './workflow-dao'

// ===== 角色 =====
const ORGS = {
  property:  { id: 1001, name: 'xxx物业管理有限公司' },
  fireSvc:   { id: 1002, name: 'yyy消防技术服务公司' },
  safetyMgr: { id: 1003, name: 'zzz安全管理中心（监管方）' },
}
const PERSONS: Record<string, { id: number; org: string }> = {
  张三: { id: 10, org: 'property'  },
  李四: { id: 11, org: 'property'  },
  王五: { id: 12, org: 'fireSvc'   },
  赵六: { id: 13, org: 'safetyMgr' },
  孙七: { id: 14, org: 'fireSvc'   },
  陈七: { id: 15, org: 'fireSvc'   },
  杨八: { id: 16, org: 'safetyMgr' },
  刘九: { id: 17, org: 'property'  },
  系统: { id: 0,  org: '' },
}

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
  /** 发起节点表单数据（使用模板 4 的实际字段 ID） */
  formData?: Record<string, any>
  /** 处置节点表单数据（维修结果 + 维修后图片） */
  executeFormData?: Record<string, any>
  /** 验收结果：approved | rejected */
  confirmResult?: string
}
function p(name: string) {
  const person = PERSONS[name]
  if (!person) return { id: 0, name, orgId: 0, orgName: '' }
  const org = ORGS[person.org as keyof typeof ORGS]
  return { id: person.id, name, orgId: org?.id ?? 0, orgName: org?.name ?? '' }
}

const orders: OrderDef[] = [
  // ─── 1. 草稿：消火栓泵异响 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'urgent', status: 'draft',
    orderNo: 'WO20260605-001',
    creator: '张三', assignee: '',
    createdAt: '2026-06-05 09:30:00',
    ttrMinutes: 15, ttsMinutes: 120,
    formData: {
      Feqcmpz7ldykabc: 'A区地下车库消火栓泵异响，压力表显示0.3MPa，低于正常值0.6MPa，启动后噪音异常',
    },
  },
  // ─── 2. 草稿：安全出口指示灯不亮 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'low', status: 'draft',
    orderNo: 'WO20260605-002',
    creator: '李四', assignee: '',
    createdAt: '2026-06-05 10:15:00',
    ttrMinutes: 240, ttsMinutes: 2880,
    formData: {
      Feqcmpz7ldykabc: 'B栋3层东侧安全出口指示灯闪烁，断电后无法正常发光，疑似电源模块故障',
    },
  },
  // ─── 3. 待指派：消防主机故障 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'urgent', status: 'pending_assign',
    orderNo: 'WO20260604-003',
    creator: '张三', assignee: '',
    createdAt: '2026-06-04 06:00:00',
    ttrMinutes: 15, ttsMinutes: 120,
    formData: {
      Feqcmpz7ldykabc: '消防控制室JB-QB-GST5000主机频繁报E-102故障代码，主板回路接口疑似松动',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/firepanel/400/300',
    },
  },
  // ─── 4. 待指派：灭火器箱体锈蚀 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'normal', status: 'pending_assign',
    orderNo: 'WO20260604-004',
    creator: '刘九', assignee: '',
    createdAt: '2026-06-04 08:00:00',
    ttrMinutes: 60, ttsMinutes: 720,
    formData: {
      Feqcmpz7ldykabc: 'C栋5层东楼梯间灭火器箱体严重锈蚀，箱门变形无法正常关闭，内部灭火器超期未检',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/firebox/400/300',
    },
  },
  // ─── 5. 待接单：防火门闭门器漏油 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'normal', status: 'pending_accept',
    orderNo: 'WO20260603-005',
    creator: '张三', assignee: '王五',
    createdAt: '2026-06-03 10:00:00',
    ttrMinutes: 60, ttsMinutes: 480,
    formData: {
      Feqcmpz7ldykabc: 'D栋2层西侧防火门闭门器漏油严重，闭门速度过快导致门扇撞击门框，存在安全隐患',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/doorcloser/400/300',
    },
  },
  // ─── 6. 待接单：疏散指示灯故障 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'low', status: 'pending_accept',
    orderNo: 'WO20260603-006',
    creator: '李四', assignee: '赵六',
    createdAt: '2026-06-03 14:00:00',
    ttrMinutes: 120, ttsMinutes: 1440,
    formData: {
      Feqcmpz7ldykabc: 'A栋1层大厅疏散指示灯不亮，测试按钮无效，断电后仍不亮，疑似内部电路故障',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/signfail/400/300',
    },
  },
  // ─── 7. 处置中：喷淋头误喷水 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'urgent', status: 'processing',
    orderNo: 'WO20260605-007',
    creator: '赵六', assignee: '孙七',
    createdAt: '2026-06-05 08:00:00',
    ttrMinutes: 15, ttsMinutes: 240,
    formData: {
      Feqcmpz7ldykabc: 'B栋12层卫生间喷淋头ZST-15误喷，水流沿管道井渗入电梯机房，需紧急关阀',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/sprinkler/400/300',
    },
  },
  // ─── 8. 处置中：电气线路老化 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'high', status: 'processing',
    orderNo: 'WO20260605-008',
    creator: '张三', assignee: '王五',
    createdAt: '2026-06-05 09:00:00',
    ttrMinutes: 30, ttsMinutes: 360,
    formData: {
      Feqcmpz7ldykabc: 'C栋负一层配电室电缆绝缘电阻仅0.3MΩ，低于国家规范1MΩ标准，存在短路起火风险',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/cableold/400/300',
    },
  },
  // ─── 9. 验收中：应急照明灯电池失效 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'normal', status: 'verifying',
    orderNo: 'WO20260530-009',
    creator: '李四', assignee: '张三',
    createdAt: '2026-05-30 11:00:00',
    ttrMinutes: 60, ttsMinutes: 480,
    formData: {
      Feqcmpz7ldykabc: 'A栋2-15层应急照明灯断电后不亮，电池组老化失效无法蓄电，涉及15个灯位',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/emlight/400/300',
    },
    executeFormData: {
      Fskkmpz7m3jjanc: 'repaired',
      F9ltmpz7mn57aqc: 'https://picsum.photos/seed/emlightdone/400/300',
    },
  },
  // ─── 10. 验收中：消防水带破损 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'low', status: 'verifying',
    orderNo: 'WO20260528-010',
    creator: '刘九', assignee: '赵六',
    createdAt: '2026-05-28 15:00:00',
    ttrMinutes: 120, ttsMinutes: 1440,
    formData: {
      Feqcmpz7ldykabc: 'C栋6层消防栓箱内水带接口处破损，长度25m水带老化严重需更换，无法正常使用',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/firehose/400/300',
    },
    executeFormData: {
      Fskkmpz7m3jjanc: 'repaired',
      F9ltmpz7mn57aqc: 'https://picsum.photos/seed/firehosedone/400/300',
    },
  },
  // ─── 11. 已关闭：排烟风机轴承磨损 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'urgent', status: 'closed',
    orderNo: 'WO20260520-011',
    creator: '张三', assignee: '王五',
    createdAt: '2026-05-20 06:45:00',
    closedAt: '2026-05-20 08:15:00',
    ttrMinutes: 15, ttsMinutes: 120,
    formData: {
      Feqcmpz7ldykabc: '屋顶排烟风机B-202运行有金属摩擦声，轴承温度偏高至85°C，需紧急停机检修',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/fanmotor/400/300',
    },
    executeFormData: {
      Fskkmpz7m3jjanc: 'repaired',
      F9ltmpz7mn57aqc: 'https://picsum.photos/seed/fanmotordone/400/300',
    },
    confirmResult: 'approved',
  },
  // ─── 12. 已关闭：消火栓栓口漏水 ───
  {
    templateName: '示例模版：故障报修', templateVersion: 1,
    priority: 'normal', status: 'closed',
    orderNo: 'WO20260510-012',
    creator: '赵六', assignee: '孙七',
    createdAt: '2026-05-10 08:30:00',
    closedAt: '2026-05-11 16:00:00',
    ttrMinutes: 60, ttsMinutes: 720,
    formData: {
      Feqcmpz7ldykabc: 'D栋1层东侧消火栓箱栓口DN65漏水，关闭阀门后仍有渗漏，密封垫圈老化需更换',
      F4pumpz7ll1uaec: 'https://picsum.photos/seed/hydrant/400/300',
    },
    executeFormData: {
      Fskkmpz7m3jjanc: 'repaired',
      F9ltmpz7mn57aqc: 'https://picsum.photos/seed/hydrantdone/400/300',
    },
    confirmResult: 'approved',
  },
]

const _NODE_TYPES = ['start', 'assign', 'execute', 'confirm', 'close', 'custom', 'condition', 'external']
// 状态 → 当前活跃节点类型（按类型查找，兼容不同模板的节点排列）
const STATUS_NODE_TYPE: Record<string, string | null> = {
  draft: 'start', pending_assign: 'assign', pending_accept: 'execute',
  processing: 'execute', verifying: 'confirm', closed: null,
}

// 模板名 → 真实模板 ID（当前仅模板 4「示例模版：故障报修」可用）
const TEMPLATE_ID_MAP: Record<string, number> = {
  '示例模版：故障报修': 4,
}

// 模板节点定义类型
interface TemplateNodeDef { id: string; type: string; name: string }

/** 获取模板节点定义：已发布配置 → 种子数据 → BUILTIN_DETAILS → 默认 5 节点 fallback */
function getTemplateNodes(templateId: number): TemplateNodeDef[] {
  // 辅助：从 TemplateDetail 提取节点列表
  const extractNodes = (detail: any): TemplateNodeDef[] | null => {
    if (detail?.flowDefinition?.nodes?.length) {
      return detail.flowDefinition.nodes.map((n: any) => ({
        id: n.id, type: n.type, name: n.name,
      }))
    }
    return null
  }

  // 1. localStorage 已发布配置
  try {
    const raw = localStorage.getItem(`db:workflow:config:${templateId}`)
    if (raw) {
      const nodes = extractNodes(JSON.parse(raw))
      if (nodes) return nodes
    }
  } catch { /* ignore */ }

  // 2. 种子数据（用户固化的模板快照）
  try {
    const seedRaw = localStorage.getItem(`db:workflow:seed:${templateId}`)
    if (seedRaw) {
      const nodes = extractNodes(JSON.parse(seedRaw))
      if (nodes) return nodes
    }
  } catch { /* ignore */ }

  // 3. 出厂默认值（BUILTIN_DETAILS 中的 flowDefinition）
  if (BUILTIN_DETAILS[templateId]) {
    const nodes = extractNodes(BUILTIN_DETAILS[templateId])
    if (nodes) return nodes
  }

  // 4. 兜底：5 节点标准布局
  return [
    { id: 'start',   type: 'start',   name: '发起节点' },
    { id: 'assign',  type: 'assign',  name: '指派节点' },
    { id: 'execute', type: 'execute', name: '处置节点' },
    { id: 'confirm', type: 'confirm', name: '验收节点' },
    { id: 'close',   type: 'close',   name: '关闭节点' },
  ]
}

// ===== 工具函数 =====
function fmtNow(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

// ===== 构建列表 =====
function buildMockList(): WorkOrderItem[] {
  return orders.map((def, i) => {
    const id = i + 1
    const creator = p(def.creator)
    const assigneeName = def.assignee || null
    const activeNodeType = STATUS_NODE_TYPE[def.status]
    const tmplId = TEMPLATE_ID_MAP[def.templateName] || 4
    const tmplNodes = getTemplateNodes(tmplId)
    const activeNodeIdx = activeNodeType ? tmplNodes.findIndex(n => n.type === activeNodeType) : -1
    // closed 时 currentNode 为 null；找不到对应类型节点时 fallback 到最后一个节点
    const currentNode = activeNodeIdx >= 0 ? tmplNodes[activeNodeIdx] : null

    // 计算实际路径节点数（排除 condition、external 类型）
    const activeNodes = tmplNodes.filter(n => n.type !== 'condition' && n.type !== 'external')
    const activePathNodeCount = activeNodes.length
    const activeNode = activeNodes.find(n => n.id === currentNode?.id)
    const activePathIndex = activeNode ? activeNodes.indexOf(activeNode) + 1 : (def.status === 'closed' ? activePathNodeCount : 0)
    const ttsMinutes = def.ttsMinutes
    const ttrMinutes = def.ttrMinutes
    const createdAt = def.createdAt
    const ttsStartedAt = new Date(new Date(createdAt).getTime() + (ttrMinutes ? (ttrMinutes + 5) * 60000 : 5 * 60000))
      .toISOString().replace('T', ' ').slice(0, 19)
    let ttsProgress = 0
    let slaStatus: SlaStatus = 'normal'
    if (def.status === 'closed') {
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
      const elapsed = Math.max(0, (Date.now() - new Date(ttsStartedAt).getTime()) / 60000)
      ttsProgress = Math.round(Math.min(elapsed / ttsMinutes, 2) * 100) / 100
      if (ttsProgress >= 1) slaStatus = 'timeout'
      else if (ttsProgress >= 0.8) slaStatus = 'warning'
      else slaStatus = 'normal'
    }
    const assigneePerson = assigneeName ? p(assigneeName) : null
    // 从表单数据提取标题（故障描述前30字）
    const desc = def.formData?.Feqcmpz7ldykabc || ''
    const title = (desc as string).slice(0, 30) + ((desc as string).length > 30 ? '…' : '') || def.templateName
    return {
      id,
      orderNo: def.orderNo,
      templateId: TEMPLATE_ID_MAP[def.templateName] || 4,
      templateName: def.templateName,
      templateVersion: def.templateVersion,
      status: def.status,
      priority: def.priority,
      currentNodeId: currentNode?.id ?? null,
      currentNodeName: currentNode?.name ?? null,
      currentNodeIndex: activeNodeIdx >= 0 ? activeNodeIdx + 1 : tmplNodes.length,
      totalNodes: tmplNodes.length || 5,
      activePathNodeCount,
      activePathIndex,
      currentNodeType: currentNode?.type ?? null,
      currentAssigneeId: assigneePerson?.id ?? null,
      currentAssigneeName: assigneeName,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorOrgId: creator.orgId,
      creatorOrgName: creator.orgName,
      parentOrderId: null,
      title: title || undefined,
      remark: '',
      formData: def.formData || {},
      createdAt,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
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

const store = createPersistentStore<WorkOrderItem>('work-orders', buildMockList())

// ===== 详情持久化 Store =====

/** 为已有列表数据生成详情种子 */
function buildMockDetails(): WorkOrderDetail[] {
  return store.getAll().map(item => buildDetail(item.id))
}

const detailStore = createPersistentStore<WorkOrderDetail>('work-order-details', buildMockDetails())

/** 将 detail 中的列表字段同步回 listStore */
function syncListItemFromDetail(detail: WorkOrderDetail): void {
  store.update(detail.id, {
    status: detail.status,
    currentNodeId: detail.currentNodeId,
    currentNodeName: detail.currentNodeName,
    currentNodeIndex: detail.currentNodeIndex,
    currentNodeType: detail.currentNodeType,
    currentAssigneeId: detail.currentAssigneeId,
    currentAssigneeName: detail.currentAssigneeName,
    updatedAt: detail.updatedAt,
    closedAt: detail.closedAt,
    closedBy: detail.closedBy,
    sla: detail.sla,
  } as Partial<WorkOrderItem>)
}

/** 为操作记录追加一条 */
function appendRecord(
  records: WorkOrderDetail['records'],
  action: string,
  operatorName: string,
  operatorOrgName: string | null,
  content: string,
  createdAt: string,
): WorkOrderDetail['records'] {
  return [...records, {
    id: detailStore.nextId(),
    action,
    operatorName,
    operatorOrgName,
    content,
    createdAt,
  }]
}

/** 为节点表单记录追加一条 */
function appendNodeFormRecord(
  nodeRecords: WorkOrderDetail['nodeRecords'],
  nodeId: string,
  nodeName: string,
  submittedBy: string,
  submittedByOrg: string,
  submittedAt: string,
  data: Record<string, any>,
): NonNullable<WorkOrderDetail['nodeRecords']> {
  return [...(nodeRecords || []), {
    id: detailStore.nextId(),
    nodeId,
    nodeName,
    submittedBy,
    submittedByOrg,
    submittedAt,
    data,
  }]
}

// ===== 构建详情 =====

function buildDetail(id: number): WorkOrderDetail {
  const item = store.getById(id)!
  if (!item) throw new Error(`工单 ${id} 不存在`)
  const activeNodeType = STATUS_NODE_TYPE[item.status]

  // 从模板节点定义构建节点列表
  const useNodes = getTemplateNodes(item.templateId)
  const totalNodes = useNodes.length

  // 按类型找到当前节点索引
  const nowIdx = activeNodeType ? useNodes.findIndex(n => n.type === activeNodeType) : totalNodes
  // 找不到对应类型节点时 fallback：closed → totalNodes，其他 → -1（下面 ns() 中 -1 会全部 pending）
  const effectiveNowIdx = nowIdx >= 0 ? nowIdx : (item.status === 'closed' ? totalNodes : -1)

  const base = new Date(item.createdAt).getTime()
  const nodeTimes: (string | null)[] = []
  for (let n = 0; n < totalNodes; n++) {
    if (item.status === 'closed') {
      // 已关闭：所有节点都有完成时间，按顺序分布
      const totalMinutes = item.closedAt ? (new Date(item.closedAt).getTime() - base) / 60000 : 480
      const step = totalMinutes / totalNodes
      nodeTimes.push(new Date(base + step * (n + 1) * 60000).toISOString().replace('T', ' ').slice(0, 19))
    } else if (n < effectiveNowIdx) {
      // 已完成节点
      nodeTimes.push(new Date(base + (n + 1) * 3600000 * (1.5 + Math.random() * 2)).toISOString().replace('T', ' ').slice(0, 19))
    } else {
      // 未达节点
      nodeTimes.push(null)
    }
  }

  function ns(n: number, _nodeType: string): NodeStatus {
    if (effectiveNowIdx > n) return 'completed'
    if (effectiveNowIdx === n && item.status !== 'draft') return 'in_progress'
    return 'pending'
  }

  const nodeStartedAt = (i: number): string | null => {
    if (i === 0) return item.createdAt
    if (effectiveNowIdx > i - 1) return nodeTimes[i - 1]
    return null
  }

  function nodeAssigneeName(nodeIdx: number, nodeType: string): string | null {
    if (nodeIdx === 0) return item.creatorName
    // 指派/处置节点：使用当前指派人
    if (nodeType === 'assign' || nodeType === 'execute') return item.currentAssigneeName
    // 验收节点：由发起人（物业方）验收
    if (nodeType === 'confirm') return item.creatorName
    return null
  }

  const nodes = useNodes.map((tn, i) => ({
    id: tn.id,
    name: tn.name,
    type: tn.type,
    status: ns(i, tn.type) as NodeStatus,
    assigneeName: nodeAssigneeName(i, tn.type),
    startedAt: nodeStartedAt(i),
    completedAt: ns(i, tn.type) === 'completed' ? nodeTimes[i] : null,
    order: i + 1,
  }))

  // 计算实际路径节点计数（排除 condition、external、close 类型）
  const activeNodes = nodes.filter(n => n.type !== 'condition' && n.type !== 'external' && n.type !== 'close')
  const activePathNodeCount = activeNodes.length
  const currentActiveNode = activeNodes.find(n => n.status === 'in_progress')
  const activePathIndex = item.status === 'closed'
    ? activePathNodeCount
    : currentActiveNode ? activeNodes.indexOf(currentActiveNode) + 1 : 0

  // ===== 构建 nodeRecords（节点表单记录） =====
  const nodeRecords: NonNullable<WorkOrderDetail['nodeRecords']> = []
  let nrid = 501

  // 发起节点记录（非草稿状态有已提交的表单数据）
  const startNode = nodes.find(n => n.type === 'start')
  if (startNode && item.status !== 'draft') {
    const startData = item.formData && Object.keys(item.formData).length > 0
      ? item.formData
      : getDefaultFormData()
    nodeRecords.push({
      id: nrid++, nodeId: String(startNode.id), nodeName: startNode.name,
      submittedBy: item.creatorName, submittedByOrg: item.creatorOrgName,
      submittedAt: item.createdAt, data: startData,
    })
  }

  // 处置节点记录（verifying / closed 状态下处置已完成）
  const executeNode = nodes.find(n => n.type === 'execute')
  if (executeNode && (item.status === 'verifying' || item.status === 'closed')) {
    const assigneeOrg = p(item.currentAssigneeName || '').orgName || ''
    nodeRecords.push({
      id: nrid++, nodeId: String(executeNode.id), nodeName: executeNode.name,
      submittedBy: item.currentAssigneeName || '—',
      submittedByOrg: assigneeOrg,
      submittedAt: executeNode.completedAt || nodeTimes[useNodes.findIndex(n => n.type === 'execute')] || fmtNow(),
      data: getExecuteFormData(),
    })
  }

  // 验收节点记录（closed 状态下验收已完成）
  const confirmNode = nodes.find(n => n.type === 'confirm')
  if (confirmNode && item.status === 'closed') {
    const confirmData = getConfirmFormData()
    nodeRecords.push({
      id: nrid++, nodeId: String(confirmNode.id), nodeName: confirmNode.name,
      submittedBy: item.creatorName, submittedByOrg: item.creatorOrgName,
      submittedAt: confirmNode.completedAt || fmtNow(),
      data: confirmData,
    })
  }

  // ===== 构建 records（操作记录时间线） =====
  const statusPriText = (p: string) =>
    p === 'urgent' ? '紧急' : p === 'high' ? '高' : p === 'normal' ? '普通' : '低'

  const records: WorkOrderDetail['records'] = []
  let rid = 301
  const r = (op: string, operator: string, org: string | null, content: string, time: string) => {
    records.push({ id: rid++, action: op, operatorName: operator, operatorOrgName: org, content, createdAt: time })
  }

  // 1. 所有非草稿订单都有「创建工单」记录
  if (item.status !== 'draft') {
    r('创建工单', item.creatorName, item.creatorOrgName,
      `提交"${item.templateName}"，优先级：${statusPriText(item.priority)}`, item.createdAt)
  }

  // 2. pending_accept / processing / verifying / closed → 指派记录
  const assignNode = nodes.find(n => n.type === 'assign')
  if (assignNode && assignNode.status !== 'pending') {
    r('指派处理人', item.creatorName, item.creatorOrgName,
      `指派维修人员：${item.currentAssigneeName || '待分配'} → "${assignNode.name}"`,
      assignNode.completedAt || nodeTimes[1] || fmtNow())
  }

  // 3. processing / verifying / closed → 接单记录
  if (['processing', 'verifying', 'closed'].includes(item.status)) {
    const acceptedAt = new Date(base + 3600000 * 2).toISOString().replace('T', ' ').slice(0, 19)
    r('接单处理', item.currentAssigneeName || '—', p(item.currentAssigneeName || '').orgName,
      `接单开始处理"${nodes.find(n => n.type === 'execute')?.name || '处置节点'}"`, acceptedAt)
  }

  // 4. verifying / closed → 提交处置结果记录
  const execNd = nodes.find(n => n.type === 'execute')
  if (execNd && ['verifying', 'closed'].includes(item.status)) {
    r('提交处理结果', item.currentAssigneeName || '—', p(item.currentAssigneeName || '').orgName,
      `"${execNd.name}"完成，提交验收`, execNd.completedAt || fmtNow())
  }

  // 5. closed → 验收通过 + 工单关闭记录
  const confirmNd = nodes.find(n => n.type === 'confirm')
  if (confirmNd && item.status === 'closed') {
    r('验收通过', item.creatorName, item.creatorOrgName,
      `"${confirmNd.name}"审核通过，确认问题已解决`,
      confirmNd.completedAt || nodeTimes[useNodes.findIndex(n => n.type === 'confirm')] || fmtNow())
    r('工单关闭', item.closedBy || '系统', null,
      '所有节点已完成，工单自动关闭归档', item.closedAt || fmtNow())
  }

  // 6. verifying → 开始验收记录
  if (confirmNd && item.status === 'verifying') {
    r('开始验收', item.creatorName, item.creatorOrgName,
      `开始对"${nodes.find(n => n.type === 'execute')?.name || '处置结果'}"进行验收`,
      confirmNd.startedAt || new Date(base + 3600000 * 8).toISOString().replace('T', ' ').slice(0, 19))
  }

  return {
    ...item,
    nodes,
    records,
    nodeRecords,
    activePathNodeCount,
    activePathIndex,
  }
}

/** 默认发起表单数据（使用模板 4「示例模版：故障报修」实际字段 ID） */
function getDefaultFormData(): Record<string, any> {
  return {
    Feqcmpz7ldykabc: '设备故障待确认',
    F4pumpz7ll1uaec: 'https://picsum.photos/seed/default/400/300',
  }
}

/** 模拟处置表单数据（字段 ID 匹配模板 4 formSchema） */
function getExecuteFormData(): Record<string, any> {
  return {
    Fskkmpz7m3jjanc: 'repaired',
    F9ltmpz7mn57aqc: 'https://picsum.photos/seed/repaired/400/300',
  }
}

/** 模拟验收表单数据（字段 ID 匹配模板 4 formSchema） */
function getConfirmFormData(): Record<string, any> {
  return {
    Foewmpz7mv4catc: 'approved',
  }
}

// ===== API =====
export async function getWorkOrderList(query: WorkOrderQuery): Promise<import('@/types/work-order').PaginatedData<WorkOrderItem>> {
  let filtered = store.getAll()
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
  const sortField = query.sortField || 'createdAt'
  const sortOrder = query.sortOrder || 'desc'
  filtered.sort((a, b) => {
    // SLA 超时始终置顶（除非用户显式按其他字段排序）
    if (!query.sortField) {
      if (a.sla.slaStatus === 'timeout' && b.sla.slaStatus !== 'timeout') return -1
      if (a.sla.slaStatus !== 'timeout' && b.sla.slaStatus === 'timeout') return 1
    }
    let cmp = 0
    if (sortField === 'createdAt') {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return sortOrder === 'desc' ? -cmp : cmp
  })
  const total = filtered.length
  const start = (query.page - 1) * query.size
  const list = filtered.slice(start, start + query.size)
  await new Promise(r => setTimeout(r, 300))
  return { list, total, stats: getStats(filtered) }
}

export async function createWorkOrder(data: CreateOrderParams): Promise<WorkOrderItem> {
  await new Promise(r => setTimeout(r, 300))
  const now = new Date()
  const createdAt = now.toISOString().replace('T', ' ').slice(0, 19)
  // 预取 ID 用于生成 orderNo（store.add 会分配 ID，这里先取号）
  const nextId = store.nextId()
  const orderNo = `WO${createdAt.slice(0, 10).replace(/-/g, '')}-${String(nextId).padStart(3, '0')}`
  const tmplNodes = getTemplateNodes(data.templateId)
  const startNode = tmplNodes[0] || { id: 'start', name: '发起节点', type: 'start' }
  // 初始状态：优先使用 data.status，默认为 draft
  const initialStatus = data.status ?? 'draft' as InstanceStatus
  // 直接发起时（pending_assign），当前节点应为指派节点而非发起节点
  const assignNode = tmplNodes.find(n => n.type === 'assign')
  const isDirectLaunch = initialStatus === 'pending_assign'
  const activeNode = isDirectLaunch && assignNode ? assignNode : startNode
  const item: WorkOrderItem = {
    id: nextId, orderNo,
    templateId: data.templateId,
    templateName: data.templateName,
    templateVersion: data.templateVersion,
    status: initialStatus,
    priority: data.priority as WorkOrderItem['priority'],
    currentNodeId: activeNode.id,
    currentNodeName: activeNode.name,
    currentNodeIndex: isDirectLaunch && assignNode ? 2 : 1,
    totalNodes: tmplNodes.length || 5,
    currentNodeType: activeNode.type as WorkOrderItem['currentNodeType'],
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
    title: data.title || data.templateName,
    remark: data.remark || '',
    formData: data.formData || {},
    sla: {
      ttrMinutes: data.ttrMinutes ?? null,
      ttsMinutes: data.ttsMinutes || 1440,
      ttrStartedAt: initialStatus === 'pending_assign' ? createdAt : null,
      ttrEndedAt: initialStatus === 'pending_assign' ? createdAt : null,
      ttsStartedAt: initialStatus === 'pending_assign' ? createdAt : new Date(now.getTime() + 300000).toISOString().replace('T', ' ').slice(0, 19),
      ttsPausedAt: null,
      yellowThreshold: 0.8,
      ttrProgress: initialStatus === 'pending_assign' ? 1 : null,
      ttsProgress: initialStatus === 'pending_assign' ? 0 : 0,
      slaStatus: 'normal',
    },
  }
  return store.add(item)
}

export async function getWorkOrderDetail(id: number): Promise<WorkOrderDetail> {
  await new Promise(r => setTimeout(r, 200))
  let detail = detailStore.getById(id)
  if (!detail) {
    // Lazy fallback：列表存在但详情未初始化（旧数据迁移 / 手动建单）
    detail = buildDetail(id)
    detailStore.add(detail)
  }
  return detail
}

// ===== 发起草稿工单 =====
export async function submitDraft(id: number): Promise<WorkOrderDetail> {
  await new Promise(r => setTimeout(r, 200))
  // 懒加载 fallback：与 getWorkOrderDetail 保持一致
  let detail = detailStore.getById(id)
  if (!detail) {
    detail = buildDetail(id)
    detailStore.add(detail)
  }
  if (detail.status !== 'draft') throw new Error('只有草稿状态的工单可以发起')

  const now = fmtNow()
  const tmplId = detail.templateId
  const nodes = detail.nodes.map(n => ({ ...n }))

  // 将 start 节点标记为 completed
  const startNode = nodes.find(n => n.type === 'start')
  if (startNode) {
    startNode.status = 'completed'
    startNode.completedAt = now
  }

  // 激活第一个 assign/execute 节点（取决于模板）
  let nextNode: typeof nodes[number] | null = null
  for (const node of nodes) {
    if (node.order > 1 && node.status === 'pending') {
      node.status = 'in_progress'
      node.startedAt = now
      nextNode = node
      break
    }
  }
  // fallback：如果没有找到 pending 节点，就找第一个 assignable 类型
  if (!nextNode) {
    const target = nodes.find(n => (n.type === 'assign' || n.type === 'execute') && n.status === 'pending')
    if (target) {
      target.status = 'in_progress'
      target.startedAt = now
      nextNode = target
    }
  }

  // 记录流转
  const records = appendRecord(detail.records, 'create', detail.creatorName, detail.creatorOrgName, `发起人 ${detail.creatorName} 已提交工单，等待指派处理`, now)

  // 如果有 formData，也作为节点的表单记录
  const nodeRecords: NonNullable<WorkOrderDetail['nodeRecords']> = detail.nodeRecords ? [...detail.nodeRecords] : []
  if (startNode && Object.keys(detail.formData || {}).length > 0) {
    const existingStartRecord = nodeRecords.find(r => r.nodeId === String(startNode.id))
    if (!existingStartRecord) {
      nodeRecords.push({
        id: detailStore.nextId(),
        nodeId: String(startNode.id),
        nodeName: startNode.name,
        submittedBy: detail.creatorName,
        submittedByOrg: detail.creatorOrgName,
        submittedAt: now,
        data: detail.formData || {},
      })
    }
  }

  const updated: WorkOrderDetail = {
    ...detail,
    status: 'pending_assign',
    currentNodeId: nextNode?.id ?? null,
    currentNodeName: nextNode?.name ?? null,
    currentNodeIndex: nextNode?.order ?? 1,
    currentNodeType: nextNode?.type ?? null,
    currentAssigneeId: null,
    currentAssigneeName: null,
    updatedAt: now,
    closedAt: null,
    closedBy: null,
    sla: {
      ...detail.sla,
      ttrStartedAt: now,
      ttsStartedAt: now,
      ttrProgress: 0,
      ttsProgress: 0,
    },
    nodes,
    records,
    nodeRecords,
  }

  detailStore.update(id, updated)
  syncListItemFromDetail(updated)
  return updated
}

// ===== 取消工单 =====
export async function cancelWorkOrder(id: number, reason: string): Promise<{ id: number; orderNo: string; status: string; closedAt: string; closedBy: string }> {
  await new Promise(r => setTimeout(r, 200))
  const item = store.getById(id)
  if (!item) throw new Error('工单不存在')
  if (item.status === 'closed') throw new Error('工单已关闭')

  const now = fmtNow()
  store.update(id, { status: 'closed', closedAt: now, closedBy: '平台管理员' } as Partial<WorkOrderItem>)

  // 同步更新 detailStore
  const detail = detailStore.getById(id)
  if (detail) {
    const records = appendRecord(detail.records, 'cancel', '平台管理员', null, `取消工单：${reason || '无原因'}`, now)
    detailStore.update(id, { ...detail, status: 'closed', closedAt: now, closedBy: '平台管理员', updatedAt: now, records } as WorkOrderDetail)
  }

  return { id, orderNo: item.orderNo, status: 'closed', closedAt: now, closedBy: '平台管理员' }
}

// ===== 改派 =====
export async function reassignWorkOrder(id: number, targetUserId: number, reason: string): Promise<{ id: number; orderNo: string; previousAssigneeName: string; currentAssigneeName: string }> {
  await new Promise(r => setTimeout(r, 200))
  const item = store.getById(id)
  if (!item) throw new Error('工单不存在')
  if (item.status === 'closed') throw new Error('工单已关闭')

  const prev = item.currentAssigneeName || '未分配'
  const newName = ['王五', '赵六', '陈七'][targetUserId % 3]

  store.update(id, { currentAssigneeId: targetUserId, currentAssigneeName: newName } as Partial<WorkOrderItem>)

  // 同步更新 detailStore
  const detail = detailStore.getById(id)
  if (detail) {
    const now = fmtNow()
    const nodes = detail.nodes.map(n => {
      if (n.type === 'execute' || (n.status === 'in_progress' && n.type === 'assign')) {
        return { ...n, assigneeName: newName }
      }
      return { ...n }
    })
    const records = appendRecord(detail.records, 'reassign', '系统管理员', null, `强制改派：${prev} → ${newName}，原因：${reason || '无原因'}`, now)
    detailStore.update(id, { ...detail, currentAssigneeId: targetUserId, currentAssigneeName: newName, updatedAt: now, nodes, records } as WorkOrderDetail)
  }

  return { id, orderNo: item.orderNo, previousAssigneeName: prev, currentAssigneeName: newName }
}

// ===== 接单（对应 PRD assign 节点 anyone 模式） =====
export async function acceptWorkOrder(id: number): Promise<WorkOrderDetail> {
  await new Promise(r => setTimeout(r, 200))
  const detail = detailStore.getById(id)
  if (!detail) throw new Error('工单不存在')
  if (detail.status !== 'pending_accept') throw new Error('当前状态不允许接单')

  const now = fmtNow()
  const nodes = detail.nodes.map(n => ({ ...n }))

  const assignNode = nodes.find(n => n.type === 'assign')
  const executeNode = nodes.find(n => n.type === 'execute')

  if (!assignNode || !executeNode) throw new Error('节点配置异常')

  assignNode.status = 'completed'
  assignNode.completedAt = now
  executeNode.status = 'in_progress'
  executeNode.startedAt = now
  executeNode.assigneeName = assignNode.assigneeName

  const records = appendRecord(detail.records, 'accept', executeNode.assigneeName || '—', null, '接单开始处理', now)

  const updated: WorkOrderDetail = {
    ...detail,
    status: 'processing',
    currentNodeId: executeNode.id,
    currentNodeName: executeNode.name,
    currentNodeIndex: executeNode.order,
    currentNodeType: executeNode.type,
    updatedAt: now,
    nodes,
    records,
    nodeRecords: detail.nodeRecords || [],
  }

  detailStore.update(id, updated)
  syncListItemFromDetail(updated)
  return updated
}

// ===== 提交处置表单 =====
export async function submitNodeForm(id: number, formData: Record<string, any>): Promise<WorkOrderDetail> {
  await new Promise(r => setTimeout(r, 200))
  const detail = detailStore.getById(id)
  if (!detail) throw new Error('工单不存在')

  // 指派节点提交：pending_assign → pending_accept
  if (detail.status === 'pending_assign') {
    const now = fmtNow()
    const nodes = detail.nodes.map(n => ({ ...n }))
    const assignNode = nodes.find(n => n.type === 'assign' && n.status === 'in_progress')
    if (!assignNode) throw new Error('节点配置异常')

    const assigneeId = formData.assigneeId as number
    const assigneeName = ['王五', '赵六', '陈七'][assigneeId % 3] || '王五'
    assignNode.status = 'completed'
    assignNode.completedAt = now
    assignNode.assigneeName = assigneeName

    // 激活下一个节点（execute）
    const nextNode = nodes.find(n => n.type === 'execute' && n.status === 'pending')
    if (nextNode) {
      nextNode.status = 'in_progress'
      nextNode.startedAt = now
      nextNode.assigneeName = assigneeName
    }

    const records = appendRecord(detail.records, 'assign', detail.creatorName, detail.creatorOrgName, `指派处理人：${assigneeName}`, now)

    // 保存指派节点的表单记录（排除 assigneeId 内部字段）
    const assignFormData = { ...formData }
    delete assignFormData.assigneeId
    let nodeRecords = detail.nodeRecords || []
    if (Object.keys(assignFormData).length > 0) {
      nodeRecords = appendNodeFormRecord(
        nodeRecords,
        String(assignNode.id),
        assignNode.name,
        detail.creatorName,
        detail.creatorOrgName,
        now,
        assignFormData,
      )
    }

    const updated: WorkOrderDetail = {
      ...detail,
      status: 'pending_accept',
      currentNodeId: nextNode?.id ?? null,
      currentNodeName: nextNode?.name ?? null,
      currentNodeIndex: nextNode?.order ?? detail.currentNodeIndex,
      currentNodeType: nextNode?.type ?? null,
      currentAssigneeId: assigneeId,
      currentAssigneeName: assigneeName,
      updatedAt: now,
      nodes,
      records,
      nodeRecords,
    }

    detailStore.update(id, updated)
    syncListItemFromDetail(updated)
    return updated
  }

  if (detail.status !== 'processing') throw new Error('当前状态不允许提交处置')

  const now = fmtNow()
  const nodes = detail.nodes.map(n => ({ ...n }))

  const executeNode = nodes.find(n => n.type === 'execute')
  const confirmNode = nodes.find(n => n.type === 'confirm')

  if (!executeNode) throw new Error('节点配置异常')

  executeNode.status = 'completed'
  executeNode.completedAt = now

  if (confirmNode) {
    // 有确认节点 → 进入 verifying
    confirmNode.status = 'in_progress'
    confirmNode.startedAt = now
  } else {
    // 无确认节点（如模板4 故障报修） → 直接关闭
    const closeNode = nodes.find(n => n.type === 'close')
    if (closeNode) {
      closeNode.status = 'completed'
      closeNode.completedAt = now
    }
  }

  const records = appendRecord(detail.records, 'submit_form', executeNode.assigneeName || '—', null, `提交"${executeNode.name}"处置结果`, now)

  const nodeRecords = appendNodeFormRecord(
    detail.nodeRecords,
    String(executeNode.id),
    executeNode.name,
    executeNode.assigneeName || '—',
    '',
    now,
    formData,
  )

  const nextStatus: InstanceStatus = confirmNode ? 'verifying' : 'closed'
  const nextNode = confirmNode || nodes.find(n => n.type === 'close')

  const updated: WorkOrderDetail = {
    ...detail,
    status: nextStatus,
    currentNodeId: nextStatus === 'closed' ? null : nextNode?.id ?? null,
    currentNodeName: nextStatus === 'closed' ? null : nextNode?.name ?? null,
    currentNodeIndex: nextStatus === 'closed' ? detail.totalNodes : nextNode?.order ?? detail.currentNodeIndex,
    currentNodeType: nextStatus === 'closed' ? null : nextNode?.type ?? null,
    updatedAt: now,
    closedAt: nextStatus === 'closed' ? now : detail.closedAt,
    closedBy: nextStatus === 'closed' ? executeNode.assigneeName : detail.closedBy,
    nodes,
    records,
    nodeRecords,
  }

  detailStore.update(id, updated)
  syncListItemFromDetail(updated)
  return updated
}

// ===== 节点动作（confirm 节点的通过/驳回/转审等） =====
export async function performNodeAction(id: number, action: { name: string; targetNodeId: string; conditionExpression?: string }): Promise<WorkOrderDetail> {
  await new Promise(r => setTimeout(r, 200))
  const detail = detailStore.getById(id)
  if (!detail) throw new Error('工单不存在')
  if (detail.status !== 'verifying') throw new Error('当前状态不允许此操作')

  const now = fmtNow()
  const nodes = detail.nodes.map(n => ({ ...n }))
  const confirmNode = nodes.find(n => n.type === 'confirm')

  if (!confirmNode) throw new Error('节点配置异常')

  const isApproved = action.targetNodeId === 'close'

  if (isApproved) {
    // approve：confirm → close，状态 → closed
    const closeNode = nodes.find(n => n.type === 'close')
    confirmNode.status = 'completed'
    confirmNode.completedAt = now
    if (closeNode) {
      closeNode.status = 'completed'
      closeNode.completedAt = now
    }

    const records = appendRecord(detail.records, 'approve', detail.creatorName, detail.creatorOrgName, `${action.name}，确认问题已解决`, now)

    const updated: WorkOrderDetail = {
      ...detail,
      status: 'closed',
      currentNodeId: null,
      currentNodeName: null,
      currentNodeIndex: detail.totalNodes,
      currentNodeType: null,
      currentAssigneeId: null,
      currentAssigneeName: null,
      updatedAt: now,
      closedAt: now,
      closedBy: detail.creatorName,
      nodes,
      records,
      nodeRecords: detail.nodeRecords || [],
    }

    detailStore.update(id, updated)
    syncListItemFromDetail(updated)
    return updated
  } else {
    // reject：confirm → 回退对应执行节点，状态 → processing
    confirmNode.status = 'pending'
    confirmNode.completedAt = null

    // 找到 targetNodeId 对应的执行节点并重新激活
    const targetNode = nodes.find(n => n.id === Number(action.targetNodeId) || String(n.id) === action.targetNodeId)
    if (targetNode && (targetNode.type === 'execute' || targetNode.type === 'external')) {
      targetNode.status = 'in_progress'
      targetNode.completedAt = null
    }

    const records = appendRecord(detail.records, 'reject', detail.creatorName, detail.creatorOrgName, `${action.name}至"${targetNode?.name || action.targetNodeId}"节点`, now)

    const updated: WorkOrderDetail = {
      ...detail,
      status: 'processing',
      currentNodeId: targetNode?.id ?? detail.currentNodeId,
      currentNodeName: targetNode?.name ?? detail.currentNodeName,
      currentNodeIndex: targetNode?.order ?? detail.currentNodeIndex,
      currentNodeType: targetNode?.type ?? detail.currentNodeType,
      updatedAt: now,
      nodes,
      records,
      nodeRecords: detail.nodeRecords || [],
    }

    detailStore.update(id, updated)
    syncListItemFromDetail(updated)
    return updated
  }
}

export async function getWorkOrderStats(): Promise<WorkOrderStats> {
  await new Promise(r => setTimeout(r, 100))
  return getStats(store.getAll())
}

function getStats(list: WorkOrderItem[]): WorkOrderStats {
  return {
    all: list.length, draft: list.filter(w => w.status === 'draft').length,
    pendingAssign: list.filter(w => w.status === 'pending_assign').length,
    pendingAccept: list.filter(w => w.status === 'pending_accept').length,
    processing: list.filter(w => w.status === 'processing').length,
    verifying: list.filter(w => w.status === 'verifying').length,
    closed: list.filter(w => w.status === 'closed').length,
  }
}
