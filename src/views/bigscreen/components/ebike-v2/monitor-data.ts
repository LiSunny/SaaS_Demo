/**
 * 系统监测页 · 实时数据口径
 *
 * 与「设备设施管理 → 运行监控」的三个系统主页（消防水系统 / 气体灭火 / 防排烟）
 * **同一份数据源**：useSubsystemStore 的点位档案 + 3s 刷新的运行时值。
 *
 * 画面节点 ↔ 点位的映射沿用各系统自己的绑定表（config/*-scene.ts 的
 * `*_NODE_BINDINGS`），所以一个图元代表哪一批设备、这批设备当前什么状态，
 * 两个页面的说法完全一致 —— 大屏画布上的角标就是设备设施管理那边那批设备的角标。
 *
 * 四项指标的口径：
 *   设备总数 = 该系统接入的设备台数（主机 + 分机 + 采集器件）
 *   故障     = 状态为 fault 的设备台数
 *   屏蔽     = 状态为 shielded（已屏蔽 / 停用）的设备台数
 *   预警     = 状态为 alarm 的设备台数
 */
import { getSubsystemProfile } from '@/config/subsystem-profiles'
import type { PointDef, PointRuntime, PointStatus } from '@/types/subsystem'
import type { SceneConfig } from '@/types/scene-config'

/** 取运行时值 */
export type RuntimeGetter = (id: string) => PointRuntime | undefined

/* ============================================================
 * 设备检测指标概览
 * ============================================================ */

/** 四项计数 */
export interface MonitorMetrics {
  /** 设备总数：接入台数 */
  total: number
  /** 故障：状态 fault 的设备台数 */
  fault: number
  /** 屏蔽：状态 shielded（已屏蔽 / 停用）的设备台数 */
  shielded: number
  /** 预警：状态 alarm 的设备台数 */
  warn: number
}

/**
 * 四项指标
 *
 * 按**设备台数**统计，不按测点 —— 与设备设施管理那三个系统主页的统计卡同口径。
 */
export function monitorMetricsOf(
  points: PointDef[],
  getRuntime: RuntimeGetter,
): MonitorMetrics {
  let fault = 0
  let shielded = 0
  let warn = 0
  for (const p of points) {
    const s = getRuntime(p.id)?.status
    if (s === 'fault') fault++
    else if (s === 'shielded') shielded++
    else if (s === 'alarm') warn++
  }
  return { total: points.length, fault, shielded, warn }
}

/* ============================================================
 * 实时警情
 * ============================================================ */

/** 警情行 */
export interface MonitorAlarmRow {
  key: string
  /** 角标文案：故障 / 预警 / 离线 / 屏蔽 */
  badge: string
  /** 设备编号（现场铭牌号） */
  title: string
  /** 时间戳：2026-11-03 14:22 */
  time: string
  /** 位置 · 设备类型 */
  location: string
  /** 该设备的状态（点行看详情用） */
  status: PointStatus
  /** 该设备对应的点位定义 */
  point: PointDef
}

/** 角标文案：与全站状态词表同源 */
const BADGE_TEXT: Record<PointStatus, string> = {
  normal: '正常',
  alarm: '预警',
  fault: '故障',
  offline: '离线',
  shielded: '屏蔽',
  unknown: '未知',
}

/** 异常的展示顺序：报警 → 故障 → 离线 → 未知 → 屏蔽 */
const ABNORMAL_ORDER: Record<PointStatus, number> = {
  alarm: 0,
  fault: 1,
  offline: 2,
  unknown: 3,
  shielded: 4,
  normal: 9,
}

/** 时间戳：2026-11-03 14:22 */
function fmtTime(ts: number | undefined): string {
  if (!ts) return '--'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 设备类型名（档案模板名，如「管网压力探测器」） */
export function deviceTypeName(typeKey: string, systemKey: string): string {
  const profile = getSubsystemProfile(systemKey)
  if (!profile) return typeKey
  const all = [...profile.hostProfiles, ...profile.deviceProfiles]
  return all.find((d) => d.typeKey === typeKey)?.name ?? typeKey
}

/**
 * 实时警情
 *
 * 每个异常设备一条；按「异常等级 → 更新时间倒序」排，最紧急的排最前。
 * 位置取设备档案的位置描述，类型名接在后面 —— 值守员按编号找人、按类型判性质。
 */
export function monitorAlarmsOf(
  points: PointDef[],
  getRuntime: RuntimeGetter,
  systemKey: string,
  limit = 4,
): MonitorAlarmRow[] {
  const rows: MonitorAlarmRow[] = []
  for (const p of points) {
    const rt = getRuntime(p.id)
    const status = rt?.status ?? 'unknown'
    if (status === 'normal') continue
    rows.push({
      key: p.id,
      badge: BADGE_TEXT[status],
      title: p.code,
      time: fmtTime(rt?.updatedAt),
      location: `${deviceTypeName(p.typeKey, systemKey)} · ${p.location || '位置未登记'}`,
      status,
      point: p,
    })
  }
  rows.sort(
    (a, b) =>
      ABNORMAL_ORDER[a.status] - ABNORMAL_ORDER[b.status] ||
      (getRuntime(b.point.id)?.updatedAt ?? 0) - (getRuntime(a.point.id)?.updatedAt ?? 0),
  )
  return rows.slice(0, limit)
}

/* ============================================================
 * 多发故障排名
 * ============================================================ */

/** 排名行 */
export interface MonitorRankRow {
  /** 设备类型名 */
  type: string
  /** 该类型的异常设备台数 */
  count: number
  /** 占比（%），同时决定占比条长度 */
  rate: number
}

/**
 * 多发故障排名
 *
 * 按**设备类型**聚合异常设备台数（报警 + 故障），降序取前 N 条。
 * 占比 = 该类型的异常台数 ÷ 全部异常台数。
 *
 * 口径与设备设施管理那三个系统主页的「预警设备」一致（报警 + 故障算异常）。
 */
export function monitorFaultRanksOf(
  points: PointDef[],
  getRuntime: RuntimeGetter,
  systemKey: string,
  limit = 5,
): MonitorRankRow[] {
  const abnormal = points.filter((p) => {
    const s = getRuntime(p.id)?.status
    return s === 'alarm' || s === 'fault'
  })
  if (!abnormal.length) return []

  const counter = new Map<string, number>()
  for (const p of abnormal) counter.set(p.typeKey, (counter.get(p.typeKey) ?? 0) + 1)

  return [...counter.entries()]
    .map(([typeKey, count]) => ({
      type: deviceTypeName(typeKey, systemKey),
      count,
      rate: Math.round((count / abnormal.length) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type, 'zh-Hans-CN'))
    .slice(0, limit)
}

/* ============================================================
 * 组态画面节点
 * ============================================================ */

/** 画面节点的实时视图 */
export interface MonitorNodeView {
  /** 节点 ID */
  id: string
  /** 图元符号 */
  symbol: string
  /** 设备名（画面图元标签） */
  label: string
  x: number
  y: number
  size: number
  /** 状态标志：交给图元渲染器换角标（fault → is-fault …） */
  state: Record<string, boolean>
  /** 该节点下异常设备台数 */
  abnormal: number
  /** 该节点下的设备总数 */
  total: number
  /** 该节点负责的设备（点开下钻用） */
  members: PointDef[]
}

/**
 * 画面节点的实时状态
 *
 * 节点的设备归属由各系统的绑定表决定（config/*-scene.ts），
 * 这里只负责把运行时值聚合成图元状态 —— 与设备设施管理那三个系统主页
 * 的组态图用的是同一套绑定与聚合逻辑。
 *
 * 聚合动作由调用方注入（它闭包了设备档案与运行时读取），
 * 本函数只负责把聚合结果摊平成画布要的视图。
 */
export function monitorNodeViews(
  scene: SceneConfig | null,
  aggregate: (symbol: string, nth: number) => MonitorNodeAggregate | null,
): MonitorNodeView[] {
  if (!scene) return []
  // 同一图元符号可能在画面里出现多次 → 按出现次序区分（第几个实例）
  const seen = new Map<string, number>()
  return (scene.nodes ?? []).map((n) => {
    const nth = (seen.get(n.symbol) ?? 0) + 1
    seen.set(n.symbol, nth)
    const agg = aggregate(n.symbol, nth)
    return {
      id: n.id,
      symbol: n.symbol,
      label: n.label || n.symbol,
      x: n.x,
      y: n.y,
      size: n.size ?? 60,
      state: agg?.state ?? {},
      abnormal: agg?.abnormal ?? 0,
      total: agg?.members.length ?? 0,
      members: agg?.members ?? [],
    }
  })
}

/** 节点聚合结果 */
export interface MonitorNodeAggregate {
  /** 该节点负责的设备 */
  members: PointDef[]
  /** 异常设备台数 */
  abnormal: number
  /** 图元状态标志 */
  state: Record<string, boolean>
}
