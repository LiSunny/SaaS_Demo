/**
 * hazard-dao.ts — 隐患台账 DAO 适配器（Mock 数据，localStorage 持久化）
 * 详见 `docs/隐患管理/页面级设计/01-HazardList-隐患台账.md`
 */
import type {
  HazardItem,
  HazardDetail,
  HazardLevel,
  HazardStatus,
  HazardQuery,
  PaginatedData,
} from '@/types/hazard'
import { PENDING_STATUSES, PROCESSING_STATUSES } from '@/types/hazard'
import { createPersistentStore } from '@/utils/db-adapter'

// ===== 隐患编号生成器 =====

let codeSeq = 1
function genCode(foundAt: string): string {
  const date = foundAt.slice(0, 10).replace(/-/g, '')
  const n = String(codeSeq++).padStart(4, '0')
  return `HZ-${date}-${n}`
}

// ===== 种子数据 =====
// enterpriseId=1 用于社会单位（本企业）

const SEED_HAZARDS: HazardDetail[] = [
  // ===== 重大隐患 =====
  {
    id: 1, code: 'HZ-20261002-0001', level: 'major', types: ['电气线路', '私拉乱接'],
    status: 'overdue', foundAt: '2026-10-02 09:15:00',
    location: '原料大车间·冲压区-3号机位', reporter: '李安全', reporterId: 'u-101',
    owner: '王志刚', ownerId: 'u-001', dueAt: '2026-10-05', isFlagged: true,
    description: '冲压区配电箱私拉乱接电线，多股铜线裸露，无防护盖板',
    summary: '配电箱私拉乱接，多股铜线裸露',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [], rectification: '已加装绝缘护套，重新布线',
  },
  {
    id: 2, code: 'HZ-20261004-0001', level: 'major', types: ['疏散通道', '堆物堆料'],
    status: 'pending_archive', foundAt: '2026-10-04 14:20:00',
    location: '成品车间·西侧安全出口', reporter: '李安全', reporterId: 'u-101',
    owner: '王志刚', ownerId: 'u-001', dueAt: '2026-10-07', closedAt: '2026-10-07 16:30:00',
    isFlagged: false,
    description: '西侧安全出口被成品纸箱堆放堵塞，通道宽度不足 0.8m',
    summary: '西侧安全出口被纸箱堵塞',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [], rectification: '已全部清除，恢复通道畅通',
    acceptanceConclusion: '现场复核通道畅通，标识清晰',
    acceptanceBy: '陈总监',
  },
  {
    id: 3, code: 'HZ-20260922-0001', level: 'major', types: ['可燃气体', '探测器'],
    status: 'pending_accept', foundAt: '2026-09-22 10:00:00',
    location: '喷涂车间·B区-烘干炉旁', reporter: '王安全', reporterId: 'u-102',
    owner: '陈建国', ownerId: 'u-002', dueAt: '2026-09-25',
    isFlagged: false,
    description: '可燃气体探测器未按规定周期年检，证书过期 30 天',
    summary: '可燃气体探测器年检过期 30 天',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [], rectification: '已联系第三方检测机构完成年检',
  },

  // ===== 一般隐患 =====
  {
    id: 4, code: 'HZ-20261008-0001', level: 'general', types: ['灭火器', '压力异常'],
    status: 'pending_audit', foundAt: '2026-10-08 11:00:00',
    location: '员工食堂·大厅', reporter: '网格员李明', reporterId: 'u-201',
    owner: '待分派', ownerId: '', dueAt: '2026-10-15',
    isFlagged: false,
    description: '员工食堂 2kg 干粉灭火器压力表指针在红区',
    summary: '灭火器压力表指针在红区',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [],
  },
  {
    id: 5, code: 'HZ-20261008-0002', level: 'general', types: ['疏散指示', '应急照明'],
    status: 'pending_level', foundAt: '2026-10-08 13:25:00',
    location: '大门口充电站·北侧通道', reporter: '网格员李明', reporterId: 'u-201',
    owner: '待定级', ownerId: '', dueAt: '2026-10-15',
    isFlagged: false,
    description: '充电站通道疏散指示灯不亮，应急照明备用电池失效',
    summary: '疏散指示灯不亮，应急照明失效',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [],
  },
  {
    id: 6, code: 'HZ-20261007-0001', level: 'general', types: ['烟感探测器', '遮挡'],
    status: 'rejected', foundAt: '2026-10-07 09:40:00',
    location: '原料大车间·原料仓', reporter: '网格员李明', reporterId: 'u-201',
    owner: '王志刚', ownerId: 'u-001', dueAt: '2026-10-14',
    isFlagged: false,
    description: '烟感探测器被货架货物遮挡 0.5m 以上，影响火灾探测',
    summary: '烟感探测器被货架遮挡',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [],
  },
  {
    id: 7, code: 'HZ-20261006-0001', level: 'general', types: ['电气线路', '接地'],
    status: 'assigned', foundAt: '2026-10-06 16:10:00',
    location: '组装车间·3号工位', reporter: '孙安全', reporterId: 'u-103',
    owner: '刘建国', ownerId: 'u-003', dueAt: '2026-10-13',
    isFlagged: false,
    description: '组装线工位接地线断开未恢复，存在静电积聚风险',
    summary: '组装工位接地线断开',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [],
  },
  {
    id: 8, code: 'HZ-20261005-0001', level: 'general', types: ['消防通道', '标识'],
    status: 'rectifying', foundAt: '2026-10-05 10:30:00',
    location: '原料大车间·主通道', reporter: '李安全', reporterId: 'u-101',
    owner: '王志刚', ownerId: 'u-001', dueAt: '2026-10-12',
    isFlagged: false,
    description: '主通道地面消防标识磨损褪色，不易识别',
    summary: '消防通道标识褪色',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [], rectification: '已采购新标识，预计 10/11 完成',
  },
  {
    id: 9, code: 'HZ-20261003-0001', level: 'general', types: ['配电箱', '周边堆物'],
    status: 'rectifying', foundAt: '2026-10-03 15:45:00',
    location: '锅炉房·配电室', reporter: '黄建国', reporterId: 'u-104',
    owner: '黄建国', ownerId: 'u-004', dueAt: '2026-10-10',
    isFlagged: false,
    description: '配电箱前堆放杂物，0.5m 安全间距不满足',
    summary: '配电箱前堆物',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [], rectification: '已清理，整理中',
  },
  {
    id: 10, code: 'HZ-20260930-0001', level: 'general', types: ['应急照明', '电池'],
    status: 'pending_accept', foundAt: '2026-09-30 09:20:00',
    location: '公共区·走廊', reporter: '王安全', reporterId: 'u-102',
    owner: '陈建国', ownerId: 'u-002', dueAt: '2026-10-07',
    isFlagged: false,
    description: '应急照明灯备用电池鼓包，需更换',
    summary: '应急照明备用电池鼓包',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [], rectification: '已全部更换新电池',
  },
  {
    id: 11, code: 'HZ-20260925-0001', level: 'general', types: ['灭火器', '年检'],
    status: 'closed', foundAt: '2026-09-25 14:00:00',
    location: '成品车间·打包台旁', reporter: '李安全', reporterId: 'u-101',
    owner: '王志刚', ownerId: 'u-001', dueAt: '2026-10-02', closedAt: '2026-09-28 11:00:00',
    isFlagged: false,
    description: '4kg 干粉灭火器年检标签过期',
    summary: '灭火器年检过期',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [], rectification: '已重新送检并贴标',
    acceptanceConclusion: '年检合格',
    acceptanceBy: '陈总监',
  },

  // ===== 安全生产场景（同期几条，丰富演示）=====
  {
    id: 12, code: 'HZ-20261009-0001', level: 'general', types: ['机械设备', '防护装置'],
    status: 'pending_audit', foundAt: '2026-10-09 08:30:00',
    location: '冲压车间·2号冲床', reporter: '网格员李明', reporterId: 'u-201',
    owner: '待分派', ownerId: '', dueAt: '2026-10-16',
    isFlagged: false,
    description: '冲压机双手按钮防护装置失效，单手可启动',
    summary: '冲压机双手按钮失效',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [],
  },
  {
    id: 13, code: 'HZ-20261007-0002', level: 'general', types: ['化学品', '存放'],
    status: 'assigned', foundAt: '2026-10-07 14:50:00',
    location: '喷涂车间·化学品暂存间', reporter: '王安全', reporterId: 'u-102',
    owner: '陈建国', ownerId: 'u-002', dueAt: '2026-10-14',
    isFlagged: false,
    description: '稀释剂与固化剂混放，未分区分类储存',
    summary: '稀释剂与固化剂混放',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [],
  },
  {
    id: 14, code: 'HZ-20261001-0001', level: 'major', types: ['有限空间', '作业许可'],
    status: 'closed', foundAt: '2026-10-01 09:00:00',
    location: '污水处理站·调节池', reporter: '孙安全', reporterId: 'u-103',
    owner: '刘建国', ownerId: 'u-003', dueAt: '2026-10-04', closedAt: '2026-10-03 15:00:00',
    isFlagged: true,
    description: '有限空间作业未办理作业许可，未做气体检测',
    summary: '有限空间未办许可',
    template: 'fire_hazard_rectify', enterpriseId: 1,
    photos: [], rectification: '已补充作业许可与气体检测记录',
    acceptanceConclusion: '手续齐全，作业规范',
    acceptanceBy: '周厂长',
  },
  {
    id: 15, code: 'HZ-20260928-0001', level: 'general', types: ['燃气软管', '老化'],
    status: 'closed', foundAt: '2026-09-28 11:00:00',
    location: '员工食堂·后厨', reporter: '网格员李明', reporterId: 'u-201',
    owner: '王志刚', ownerId: 'u-001', dueAt: '2026-09-29', closedAt: '2026-09-29 14:30:00',
    isFlagged: false,
    description: '燃气软管老化龟裂，存在燃气泄漏风险',
    summary: '燃气软管老化',
    template: 'fire_hazard_report', enterpriseId: 1,
    photos: [], rectification: '已更换金属波纹管',
    acceptanceConclusion: '更换到位，无泄漏',
    acceptanceBy: '陈总监',
  },
]

// ===== 持久化 Store =====

codeSeq = SEED_HAZARDS.length + 1

const store = createPersistentStore<HazardDetail>('hazard_ledger', SEED_HAZARDS)

// ===== 工具：演示期"今天"=最新隐患 foundAt +1 天（让数据始终落在"近期") =====

function demoToday(): string {
  const list = store.getAll()
  if (list.length === 0) return new Date().toISOString().slice(0, 10)
  const max = list.reduce((m, h) => (h.foundAt > m ? h.foundAt : m), '2026-01-01')
  const d = new Date(max.replace(' ', 'T'))
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

// ===== 数据范围过滤 =====

function applyScope(data: HazardDetail[], enterpriseId?: number): HazardDetail[] {
  if (!enterpriseId) return data
  return data.filter(h => h.enterpriseId === enterpriseId)
}

// ===== API =====

/** 列表查询（设计文档 §3.4 + §5.2） */
export async function getHazardList(
  query: HazardQuery,
  currentUserId?: string,
  currentEnterpriseId?: number,
): Promise<PaginatedData<HazardItem>> {
  await new Promise(r => setTimeout(r, 80))

  let rows: HazardDetail[] = store.getAll()
  rows = applyScope(rows, currentEnterpriseId)

  // ===== 筛选 =====
  if (query.level && query.level !== 'all') {
    rows = rows.filter(h => h.level === query.level)
  }
  if (query.status && query.status !== 'all') {
    rows = rows.filter(h => h.status === query.status)
  }
  if (query.template && query.template !== 'all') {
    rows = rows.filter(h => h.template === query.template)
  }
  if (query.onlyFlagged) {
    rows = rows.filter(h => h.isFlagged)
  }
  if (query.onlyMine && currentUserId) {
    rows = rows.filter(h => h.reporterId === currentUserId || h.ownerId === currentUserId)
  }

  // 期限筛选
  if (query.due && query.due !== 'all') {
    const today = new Date(demoToday())
    rows = rows.filter(h => {
      const due = new Date(h.dueAt)
      const diff = Math.floor((due.getTime() - today.getTime()) / 86400000)
      if (query.due === 'within7') return diff >= 0 && diff <= 7
      if (query.due === 'overdue') return diff < 0 && h.status !== 'closed'
      if (query.due === 'thisMonth') {
        return due.getFullYear() === today.getFullYear() && due.getMonth() === today.getMonth()
      }
      if (query.due === 'custom' && query.startDate && query.endDate) {
        return due >= new Date(query.startDate) && due <= new Date(query.endDate)
      }
      return true
    })
  }

  // 关键词搜索
  if (query.keyword && query.keyword.trim()) {
    const kw = query.keyword.trim().toLowerCase()
    rows = rows.filter(h =>
      h.code.toLowerCase().includes(kw)
      || h.location.toLowerCase().includes(kw)
      || (h.description || '').toLowerCase().includes(kw)
      || (h.summary || '').toLowerCase().includes(kw),
    )
  }

  // 排序
  const sortBy = query.sortBy || 'foundAt'
  const sortDir = query.sortDir || 'desc'
  rows.sort((a, b) => {
    let av: number, bv: number
    if (sortBy === 'foundAt') {
      av = new Date(a.foundAt).getTime()
      bv = new Date(b.foundAt).getTime()
    } else if (sortBy === 'dueAt') {
      av = new Date(a.dueAt).getTime()
      bv = new Date(b.dueAt).getTime()
    } else {
      // level：major 优先（asc 时紧急在前）
      av = a.level === 'major' ? 0 : 1
      bv = b.level === 'major' ? 0 : 1
    }
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const total = rows.length
  const page = query.page || 1
  const size = query.size || 20
  const start = (page - 1) * size
  const data = rows.slice(start, start + size)
  return { data, total }
}

/** 单条详情 */
export async function getHazardDetail(id: number): Promise<HazardDetail | null> {
  await new Promise(r => setTimeout(r, 60))
  return store.getById(id) || null
}

/** 新建隐患（M1-1 上报页后续使用） */
export async function createHazard(payload: Omit<HazardDetail, 'id' | 'code'>): Promise<HazardDetail> {
  await new Promise(r => setTimeout(r, 80))
  const item: HazardDetail = {
    ...payload,
    id: 0, // 由 createPersistentStore 自动分配
    code: genCode(payload.foundAt),
  }
  return store.add(item)
}

/**
 * 统计：返回当前数据范围内各状态的数字（设计文档 §3.1）
 */
export async function getHazardStats(
  currentEnterpriseId?: number,
  currentUserId?: string,
): Promise<{
  total: number
  pending: number
  processing: number
  overdue: number
  major: number
  thisMonth: number
}> {
  await new Promise(r => setTimeout(r, 40))
  let rows = applyScope(store.getAll(), currentEnterpriseId)
  if (currentUserId) {
    rows = rows.filter(h => h.reporterId === currentUserId || h.ownerId === currentUserId)
  }
  const today = new Date(demoToday())
  return {
    total: rows.length,
    pending: rows.filter(h => PENDING_STATUSES.includes(h.status)).length,
    processing: rows.filter(h => PROCESSING_STATUSES.includes(h.status)).length,
    overdue: rows.filter(h => new Date(h.dueAt) < today && h.status !== 'closed').length,
    major: rows.filter(h => h.level === 'major').length,
    thisMonth: rows.filter(h => {
      const d = new Date(h.foundAt)
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
    }).length,
  }
}

/** 批量挂牌 / 解除挂牌（监管方演示用） */
export async function batchFlag(ids: number[], flag: boolean): Promise<void> {
  await new Promise(r => setTimeout(r, 80))
  for (const id of ids) store.update(id, { isFlagged: flag })
}

/** 重置（演示用） */
export function resetHazardStore(): void {
  store.setData([...SEED_HAZARDS])
  codeSeq = SEED_HAZARDS.length + 1
}

// 暴露给组件
export type { HazardLevel, HazardStatus }