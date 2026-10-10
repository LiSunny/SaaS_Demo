// ===== 隐患台账（hazard ledger）类型定义 =====
// 详见 `docs/隐患管理/页面级设计/01-HazardList-隐患台账.md`

// ===== 枚举 =====

/** 隐患等级：一般 / 重大 */
export type HazardLevel = 'general' | 'major'

/** 隐患状态机（按设计文档 §3.2 状态筛选项） */
export type HazardStatus =
  | 'pending_audit'   // 待审核
  | 'pending_level'   // 待定级
  | 'rejected'        // 已驳回
  | 'assigned'        // 已分派
  | 'rectifying'      // 整改中
  | 'overdue'         // 超期未整改
  | 'pending_accept'  // 待验收
  | 'pending_archive' // 待销号
  | 'closed'          // 已闭环

/** 期限筛选 */
export type HazardDueFilter = 'all' | 'within7' | 'overdue' | 'thisMonth' | 'custom'

// ===== 实体 =====

/** 隐患台账项（列表接口返回） */
export interface HazardItem {
  id: number
  /** 业务编码 HZ-YYYYMMDD-XXXX */
  code: string
  /** 隐患等级 */
  level: HazardLevel
  /** 隐患类型（按消防/安全生产字典） */
  types: string[]
  /** 当前状态 */
  status: HazardStatus
  /** 发现时间（YYYY-MM-DD HH:mm:ss） */
  foundAt: string
  /** 位置描述（管理单元 + 点位） */
  location: string
  /** 上报人姓名 */
  reporter: string
  /** 上报人 ID（UUID/字符串，演示用 uuid 字符串） */
  reporterId: string
  /** 责任人姓名 */
  owner: string
  /** 责任人 ID */
  ownerId: string
  /** 整改期限（YYYY-MM-DD） */
  dueAt: string
  /** 闭环时间（已闭环时） */
  closedAt?: string
  /** 是否挂牌（监管方） */
  isFlagged: boolean
  /** 描述（搜索用） */
  description: string
  /** 流程模板 */
  template: 'fire_hazard_report' | 'fire_hazard_rectify'
  /** 企业 ID（数据范围隔离） */
  enterpriseId: number
  /** 描述/简述（列表副行，可选） */
  summary?: string
}

/** 隐患详情（详情页用，本页先列字段） */
export interface HazardDetail extends HazardItem {
  /** 整改措施 */
  rectification?: string
  /** 验收意见 */
  acceptanceConclusion?: string
  /** 验收人 */
  acceptanceBy?: string
  /** 现场照片 */
  photos: string[]
}

// ===== 查询/分页 =====

export interface HazardQuery {
  /** 关键词搜索：编号 / 位置描述 / 描述文本 */
  keyword?: string
  /** 等级（'all' | general | major） */
  level?: HazardLevel | 'all'
  /** 状态（'all' | 状态值） */
  status?: HazardStatus | 'all'
  /** 期限 */
  due?: HazardDueFilter
  /** 自定义期限起始 */
  startDate?: string
  /** 自定义期限截止 */
  endDate?: string
  /** 位置（管理单元 ID；可选预留） */
  locationId?: number
  /** 上报人（多选，预留） */
  reporterIds?: string[]
  /** 责任人（多选，预留） */
  ownerIds?: string[]
  /** 流程模板 */
  template?: HazardItem['template'] | 'all'
  /** 仅看我的 */
  onlyMine?: boolean
  /** 仅看挂牌 */
  onlyFlagged?: boolean
  /** 排序字段 */
  sortBy?: 'foundAt' | 'level' | 'dueAt'
  /** 排序方向 */
  sortDir?: 'asc' | 'desc'
  /** 分页 */
  page: number
  size: number
}

export interface PaginatedData<T> {
  data: T[]
  total: number
}

// ===== 状态字典（展示用） =====

export interface HazardStatusDef {
  key: HazardStatus
  label: string
  /** 对应 CSS 类（与 StatusTag 体系复用：info / warning / danger / success / normal / purple） */
  cls: string
  /** 自定义渲染样式（覆盖 StatusTag 默认色彩）：超期红、待销号紫等 */
  tone: 'gray' | 'yellow' | 'orange' | 'blue' | 'red' | 'purple' | 'green'
}

export const HAZARD_STATUS_DEFS: HazardStatusDef[] = [
  { key: 'pending_audit',   label: '待审核',   cls: 'normal', tone: 'gray' },
  { key: 'pending_level',   label: '待定级',   cls: 'warning', tone: 'yellow' },
  { key: 'rejected',        label: '已驳回',   cls: 'notice',  tone: 'orange' },
  { key: 'assigned',        label: '已分派',   cls: 'info',    tone: 'blue' },
  { key: 'rectifying',      label: '整改中',   cls: 'info',    tone: 'blue' },
  { key: 'overdue',         label: '超期未整改', cls: 'danger', tone: 'red' },
  { key: 'pending_accept',  label: '待验收',   cls: 'purple',  tone: 'purple' },
  { key: 'pending_archive', label: '待销号',   cls: 'purple',  tone: 'purple' },
  { key: 'closed',          label: '已闭环',   cls: 'success', tone: 'green' },
]

export function hazardStatusLabel(status: HazardStatus): string {
  return HAZARD_STATUS_DEFS.find(s => s.key === status)?.label || status
}

export function hazardStatusCls(status: HazardStatus): string {
  return HAZARD_STATUS_DEFS.find(s => s.key === status)?.cls || 'normal'
}

export function hazardStatusTone(status: HazardStatus): HazardStatusDef['tone'] {
  return HAZARD_STATUS_DEFS.find(s => s.key === status)?.tone || 'gray'
}

/** 全部为"待处理"的状态（用于顶部统计卡） */
export const PENDING_STATUSES: HazardStatus[] = ['pending_audit', 'pending_level', 'rejected']
/** 全部为"整改中"的状态 */
export const PROCESSING_STATUSES: HazardStatus[] = ['assigned', 'rectifying', 'overdue', 'pending_accept']