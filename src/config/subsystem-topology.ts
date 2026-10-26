/**
 * 消防管网 · 组态模型
 *
 * 核心思想：组态图不与物理设备一对一，图上每个"环节"是若干监测点位的聚合。
 * 水池/水箱 · 水泵控制柜 · 报警阀间阀门 · 管网 · 消火栓环网阀门 · 手动/电动末端试水
 *
 * 值班监测只关心"有没有异常"+"数据什么时候更新的"，
 * 所以环节状态只有 正常 / 报警 / 故障 / 无数据 四档，**不设"离线"档**
 * （设备是否失联属于"设备健康"视角，是设备管理者的事）。
 * 数据可信度用"数据更新时间"承载，而不是用状态色表达。
 *
 * 布局：两行蛇形。
 *   行1（自左向右）：水池/水箱 → 水泵控制柜 → 报警阀间阀门 → 管网
 *   行2（自上而下）：管网 → 消火栓环网阀门 →（分流）手动末端试水 / 电动末端试水
 * 为什么不用单行：单行 5 个节点时，SVG 在侧栏布局下缩放比只有 0.7，
 * 图内文字会被压到 9px 左右（低于 --font-xs 的 12px），值班员根本看不清。
 * 两行后缩放比接近 1:1，文字回到 12px 以上。
 */
import type { PointDef, PointRuntime, PointStatus } from '@/types/subsystem'

/** 环节状态（值守视角） */
export type StageStatus = 'normal' | 'alarm' | 'fault' | 'nodata'

export const STAGE_STATUS_TEXT: Record<StageStatus, string> = {
  normal: '正常',
  alarm: '报警',
  fault: '故障',
  nodata: '无数据',
}

/** 一个"环节"——系统构成上的聚合单元 */
export interface TopologyStage {
  id: string
  name: string
  icon: string
  /**
   * 该环节覆盖哪些点位：按设备档案 typeKey 匹配，codePrefix 可再分子类。
   * typeKeys 允许多个档案归入同一环节（如"管网"同时含压力探测器与流量传感器）。
   */
  match: {
    typeKeys: string[]
    /** 点位编号前缀（如阀门分 FM 消火栓环网 / BZ 报警阀间） */
    codePrefix?: string
  }
  /** SVG 画布坐标 */
  pos: { x: number; y: number; w: number; h: number }
  /** 环节说明，hover 时补充显示 */
  desc: string
}

/** 环节间连接（水流向） */
export interface TopologyLink {
  from: string
  to: string
}

export const TOPOLOGY_VIEWBOX = { w: 900, h: 520 }

/**
 * 消防管网组态环节定义
 *
 * 顺序 = 水力流向：水池/水箱 → 水泵 → 报警阀间 → 管网 → 消火栓环网阀门 → 末端试水装置
 */
export const PIPELINE_STAGES: TopologyStage[] = [
  {
    id: 'water',
    name: '水池 / 水箱',
    icon: 'vehicle',
    match: { typeKeys: ['water_level'] },
    pos: { x: 20, y: 25, w: 180, h: 100 },
    desc: '消防水池与高位水箱液位监测',
  },
  {
    id: 'pump',
    name: '水泵控制柜',
    icon: 'poweroff',
    match: { typeKeys: ['pipe_host', 'pipe_slave'] },
    pos: { x: 250, y: 25, w: 180, h: 100 },
    desc: '管网监控主机与各区水泵控制柜（分机）',
  },
  {
    id: 'alarm-valve',
    name: '报警阀间阀门',
    icon: 'swap',
    match: { typeKeys: ['valve_switch'], codePrefix: 'BZ' },
    pos: { x: 480, y: 25, w: 180, h: 100 },
    desc: '报警阀间 / 水泵 / 稳压泵阀门',
  },
  {
    id: 'pipe',
    name: '管网',
    icon: 'sitemap',
    match: { typeKeys: ['pipe_pressure', 'flow_sensor'] },
    pos: { x: 710, y: 25, w: 180, h: 100 },
    desc: '管网压力与瞬时流量监测',
  },
  {
    id: 'hydrant-valve',
    name: '消火栓环网阀门',
    icon: 'circle',
    match: { typeKeys: ['valve_switch'], codePrefix: 'FM' },
    pos: { x: 710, y: 285, w: 180, h: 100 },
    desc: '消火栓环网阀门开/关状态监测',
  },
  {
    id: 'hydrant-manual',
    name: '手动末端试水',
    icon: 'play',
    match: { typeKeys: ['hydrant_test'], codePrefix: 'SD' },
    pos: { x: 440, y: 180, w: 180, h: 100 },
    desc: '手动末端试水装置（不可远程启动）',
  },
  {
    id: 'hydrant-electric',
    name: '电动末端试水',
    icon: 'thunder',
    match: { typeKeys: ['hydrant_test'], codePrefix: 'ZSD' },
    pos: { x: 440, y: 390, w: 180, h: 100 },
    desc: '电动末端试水装置（支持远程启动）',
  },
]

/** 环节连接：主干自左向右，末端试水分两支 */
export const PIPELINE_LINKS: TopologyLink[] = [
  { from: 'water', to: 'pump' },
  { from: 'pump', to: 'alarm-valve' },
  { from: 'alarm-valve', to: 'pipe' },
  { from: 'pipe', to: 'hydrant-valve' },
  { from: 'hydrant-valve', to: 'hydrant-manual' },
  { from: 'hydrant-valve', to: 'hydrant-electric' },
]

/** 环节聚合结果 */
export interface StageAggregate {
  stage: TopologyStage
  /** 该环节下的全部点位 */
  points: PointDef[]
  /** 状态（聚合后） */
  status: StageStatus
  /** 报警 / 故障 / 正常 点位数 */
  counts: Record<PointStatus, number>
  /** 该环节数据最新时间戳 */
  updatedAt: number
  /** 有数据（未失联）的点位数 */
  activeCount: number
}

function matchStage(stage: TopologyStage, point: PointDef): boolean {
  if (!stage.match.typeKeys.includes(point.typeKey)) return false
  if (stage.match.codePrefix) return point.code.startsWith(stage.match.codePrefix)
  return true
}

/**
 * 聚合环节状态
 *
 * 优先级：报警 > 故障 > 正常；全部无数据 → 无数据（灰，不冒充"正常"）。
 * 离线点位不单独成档——它不是值守人员要判断的事，
 * 但"无数据"必须与"正常"区分开，否则会把失明误读成安全。
 */
export function aggregateStages(
  stages: TopologyStage[],
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): StageAggregate[] {
  return stages.map((stage) => {
    const members = points.filter((p) => matchStage(stage, p))
    const counts: Record<PointStatus, number> = {
      normal: 0, alarm: 0, fault: 0, offline: 0, shielded: 0, unknown: 0,
    }
    let updatedAt = 0
    let activeCount = 0
    for (const p of members) {
      const r = getRuntime(p.id)
      if (!r) { counts.unknown++; continue }
      counts[r.status] = (counts[r.status] ?? 0) + 1
      if (r.status !== 'offline') activeCount++
      if (r.updatedAt > updatedAt) updatedAt = r.updatedAt
    }
    let status: StageStatus
    if (counts.alarm > 0) status = 'alarm'
    else if (counts.fault > 0) status = 'fault'
    else if (activeCount > 0) status = 'normal'
    else status = 'nodata'
    return { stage, points: members, status, counts, updatedAt, activeCount }
  })
}

/** 环节是否异常（用于清单排序与闪烁） */
export function isStageAbnormal(s: StageStatus): boolean {
  return s === 'alarm' || s === 'fault'
}
