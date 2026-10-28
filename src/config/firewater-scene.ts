/**
 * 消防水系统监控 · 组态场景与点位绑定
 *
 * 场景布局取自组态编辑器导出的画面文件 `src/config/firewater-scene.json`
 * （1200×700 / 12 节点 / 12 连线），可在编辑器里改完后整份替换这个 JSON。
 * 本文件只补两件事：
 *   1. 连线流动方向兜底（画面文件已带 flow 时以画面为准）
 *   2. 节点 ↔ 点位绑定表：把 1156 个点位不重不漏地分给 12 个图元
 *
 * 绑定口径：typeKey + 编号前缀圈定设备档案类，再在该类内部按序号切片。
 * store 里同类同前缀的点位编号升序（generatePoints 顺序推进），所以切片稳定可复算。
 *
 * 切片校验：压力 38+38+38 = 114 ✓ 阀门 719 + 72 = 791 ✓ 液位 2+2 = 4 ✓
 *          试水 232 ✓ 主机 1 + 分机 4+2+2 = 9 ✓
 * 场景覆盖 1150 个点位，其余 6 个流量点由核心数据「供水流量」卡下钻进入 → 1156 全部可达。
 */
import sceneJson from './firewater-scene.json'
import type { SceneEdge, SceneNode } from '@/types/scene-config'
import type { MetricDef, PointDef, PointRuntime, PointStatus } from '@/types/subsystem'
import type {
  FireWaterCardDef,
  FireWaterCardKind,
  FireWaterNodeAggregate,
  FireWaterNodeBinding,
  FireWaterPointGroup,
} from '@/types/firewater'

interface RawLayout {
  version: number
  name: string
  width: number
  height: number
  nodes: SceneNode[]
  edges: SceneEdge[]
}

const layout = sceneJson as unknown as RawLayout

export const FIREWATER_SCENE_NAME = layout.name

/** 画布尺寸（与画面文件一致） */
export const FIREWATER_VIEWBOX = { w: layout.width, h: layout.height }

/** 场景节点（位置 / 标签 / 尺寸取自组态编辑器导出的画面文件） */
export const FIREWATER_NODES: SceneNode[] = layout.nodes

/** 场景连线：画面文件已声明 flow 的以画面为准；电气连线（kind=control）不流动 */
export const FIREWATER_EDGES: SceneEdge[] = layout.edges.map(
  (e): SceneEdge => ({
    ...e,
    flow: e.flow ?? (e.kind === 'control' ? 'none' : 'forward'),
  }),
)

/**
 * 节点 ↔ 点位绑定表
 *
 * 画面是上下两条支路：上支路 水箱→泵组→阀门→室内消火栓/消火栓箱；
 * 下支路 水池→泵组→阀门→报警阀组→末端试水/喷淋。阀门节点(n10)为两条支路共用。
 */
export const FIREWATER_NODE_BINDINGS: FireWaterNodeBinding[] = [
  // ===== 水源 =====
  { nodeId: 'n1', match: { typeKeys: ['water_level'], slice: [0, 2] }, value: 'levelPercent', metricKey: 'level' },
  { nodeId: 'n2', match: { typeKeys: ['water_level'], slice: [2, 4] }, value: 'levelPercent', metricKey: 'level' },
  // ===== 泵组与控制柜（1 主机 + 8 分机） =====
  { nodeId: 'n5', match: { typeKeys: ['pipe_host'] }, value: 'deviceState', metricKey: 'runStatus' },
  { nodeId: 'nmvq2q06li0ev', match: { typeKeys: ['pipe_slave'], slice: [0, 4] }, value: 'runningCount', metricKey: 'runStatus', onValue: 'normal' },
  { nodeId: 'n3', match: { typeKeys: ['pipe_slave'], slice: [4, 6] }, value: 'runningCount', metricKey: 'runStatus', onValue: 'normal' },
  { nodeId: 'nmvq2pm3bw7kl', match: { typeKeys: ['pipe_slave'], slice: [6, 8] }, value: 'runningCount', metricKey: 'runStatus', onValue: 'normal' },
  // ===== 阀门 =====
  { nodeId: 'n10', match: { typeKeys: ['valve_switch'], codePrefix: 'FM' }, value: 'openCount', metricKey: 'valveState', onValue: 'open' },
  { nodeId: 'nmvqajja98rbz', match: { typeKeys: ['valve_switch'], codePrefix: 'BZ' }, value: 'openCount', metricKey: 'valveState', onValue: 'open' },
  // ===== 末端 =====
  { nodeId: 'n9', match: { typeKeys: ['pipe_pressure'], slice: [0, 38] }, value: 'pressureMin', metricKey: 'pressure' },
  { nodeId: 'n11', match: { typeKeys: ['pipe_pressure'], slice: [38, 76] }, value: 'pressureMin', metricKey: 'pressure' },
  { nodeId: 'nmvq7w5er8tog', match: { typeKeys: ['pipe_pressure'], slice: [76, 114] }, value: 'pressureMin', metricKey: 'pressure' },
  { nodeId: 'n15', match: { typeKeys: ['hydrant_test'] }, value: 'startedCount', metricKey: 'runState', onValue: 'running' },
]

/** 核心数据卡定义（取值规则见下方 computeFireWaterCards） */
export const FIREWATER_CARDS: FireWaterCardDef[] = [
  { key: 'pressure', label: '供水压力', icon: 'chart', agg: 'min', typeKey: 'pipe_pressure', metricKey: 'pressure' },
  { key: 'flow', label: '供水流量', icon: 'activity', agg: 'avg', typeKey: 'flow_sensor', metricKey: 'flow' },
  { key: 'level', label: '水池水位', icon: 'data-display', agg: 'min', typeKey: 'water_level', metricKey: 'level', asPercent: true },
  { key: 'system', label: '系统状态', icon: 'check-circle' },
]

// ===== 通用工具 =====

function metricOf(point: PointDef | undefined, key: string): MetricDef | undefined {
  return point?.metrics.find(m => m.key === key)
}

function statusOf(point: PointDef, getRuntime: (id: string) => PointRuntime | undefined): PointStatus {
  return getRuntime(point.id)?.status ?? 'unknown'
}

function num(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function fmt(v: number, precision = 2): string {
  return v.toFixed(precision)
}

/** 组内点位状态汇总：报警 > 故障 > 离线 > 正常 */
function groupStatus(
  members: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): 'alarm' | 'fault' | 'offline' | 'normal' {
  let alarm = 0
  let fault = 0
  let offline = 0
  for (const p of members) {
    const s = statusOf(p, getRuntime)
    if (s === 'alarm') alarm++
    else if (s === 'fault') fault++
    else if (s === 'offline') offline++
  }
  if (alarm > 0) return 'alarm'
  if (fault > 0) return 'fault'
  if (offline > 0) return 'offline'
  return 'normal'
}

// ===== 节点 ↔ 点位 =====

/** 按绑定规则取出该节点所辖点位 */
export function resolveNodePoints(
  binding: FireWaterNodeBinding,
  points: PointDef[],
): PointDef[] {
  const list = points.filter(p => {
    if (!binding.match.typeKeys.includes(p.typeKey)) return false
    if (binding.match.codePrefix) return p.code.startsWith(binding.match.codePrefix)
    return true
  })
  if (!binding.match.slice) return list
  const [start, end] = binding.match.slice
  return list.slice(start, end)
}

/**
 * 聚合节点状态与显示值
 *
 * 状态优先级：组内只要有报警/故障，图元就不能显示成健康绿。
 * 数值口径与图元库状态类（is-run / is-fault / is-open / is-closed / is-off / is-over）对应。
 */
export function aggregateNode(
  binding: FireWaterNodeBinding,
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): FireWaterNodeAggregate {
  const members = resolveNodePoints(binding, points)
  const abnormal = members.filter(p => statusOf(p, getRuntime) !== 'normal').length

  if (binding.schematic) {
    return {
      points: members,
      abnormal: 0,
      value: '示意',
      subValue: '无独立测点',
      state: { off: true },
    }
  }

  const metric = metricOf(members[0], binding.metricKey)
  const unit = metric?.unit ?? ''
  const precision = metric?.precision ?? 2
  const status = groupStatus(members, getRuntime)

  switch (binding.value) {
    case 'levelPercent': {
      const vals = members
        .map(p => num(getRuntime(p.id)?.values?.[binding.metricKey]))
        .filter((v): v is number => v !== undefined)
      if (!vals.length) return { points: members, abnormal, value: '--', subValue: '', state: { off: true } }
      const min = Math.min(...vals)
      const rangeMax = metric?.range?.[1] ?? 100
      const pct = (min / rangeMax) * 100
      return {
        points: members,
        abnormal,
        value: `${fmt(pct, 0)}%`,
        subValue: `${fmt(min, precision)} ${unit}`,
        state: levelState(status),
      }
    }
    case 'pressureMin': {
      const vals = members
        .map(p => num(getRuntime(p.id)?.values?.[binding.metricKey]))
        .filter((v): v is number => v !== undefined)
      if (!vals.length) return { points: members, abnormal, value: '--', subValue: '', state: { off: true } }
      const min = Math.min(...vals)
      return {
        points: members,
        abnormal,
        value: `${fmt(min, precision)} ${unit}`,
        subValue: '最不利点',
        state: pressureState(status),
      }
    }
    case 'runningCount':
    case 'openCount':
    case 'startedCount': {
      const on = members.filter(
        p => getRuntime(p.id)?.values?.[binding.metricKey] === binding.onValue,
      ).length
      const prefix = binding.value === 'runningCount' ? '运行' : binding.value === 'openCount' ? '开' : '启动'
      return {
        points: members,
        abnormal,
        value: `${prefix} ${on}/${members.length}`,
        subValue: '',
        state: countState(binding.value, status, on),
      }
    }
    case 'deviceState': {
      const p = members[0]
      const rt = p ? getRuntime(p.id) : undefined
      const raw = rt?.values?.[binding.metricKey]
      const label =
        metric?.states?.find(s => s.value === raw)?.label ??
        (status === 'normal' ? '正常' : status === 'fault' ? '故障' : '--')
      return {
        points: members,
        abnormal,
        value: label,
        subValue: '',
        state: status === 'fault' ? { fault: true } : { run: true },
      }
    }
    default:
      return { points: members, abnormal, value: '--', subValue: '', state: { off: true } }
  }
}

function levelState(status: 'alarm' | 'fault' | 'offline' | 'normal'): Record<string, boolean> {
  if (status === 'alarm') return { over: true }
  if (status === 'fault' || status === 'offline') return { fault: true }
  return { run: true }
}

function pressureState(status: 'alarm' | 'fault' | 'offline' | 'normal'): Record<string, boolean> {
  if (status === 'alarm') return { over: true }
  if (status === 'fault' || status === 'offline') return { fault: true }
  return { run: true }
}

function countState(
  kind: FireWaterNodeBinding['value'],
  status: 'alarm' | 'fault' | 'offline' | 'normal',
  on: number,
): Record<string, boolean> {
  if (status === 'alarm' || status === 'fault' || status === 'offline') return { fault: true }
  if (kind === 'openCount') return on > 0 ? { open: true } : { closed: true }
  if (kind === 'startedCount') return on > 0 ? { run: true } : { off: true }
  return { run: true }
}

// ===== 核心数据卡 =====

/** 一张核心数据卡的最终呈现 */
export interface FireWaterCardValue {
  key: FireWaterCardKind
  label: string
  icon: string
  /** 主值（数字或状态词） */
  value: string
  /** 单位 */
  unit: string
  /** 副行：口径说明 + 分母 */
  sub: string
  /** 正常范围文案（来自指标定义，不手写） */
  normalRange: string
  /** 色调 */
  tone: 'normal' | 'alarm' | 'fault' | 'offline'
  /** 该卡所辖点位（供下钻） */
  points: PointDef[]
}

/**
 * 计算 4 张核心数据卡
 *
 * 供水压力 = 114 个压力测点的最小值（管网最不利点）
 * 供水流量 = 6 个流量测点的算术平均（管网总流量口径）
 * 水池水位 = 4 个液位测点的最小值，按量程上限折算成百分比
 * 系统状态 = 全部 1156 点位的状态计数派生
 */
export function computeFireWaterCards(
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): FireWaterCardValue[] {
  const byType = (typeKey: string) => points.filter(p => p.typeKey === typeKey)

  const out: FireWaterCardValue[] = []

  for (const card of FIREWATER_CARDS) {
    if (card.key === 'system') {
      const counts = { normal: 0, alarm: 0, fault: 0, offline: 0, other: 0 }
      for (const p of points) {
        const s = statusOf(p, getRuntime)
        if (s === 'normal') counts.normal++
        else if (s === 'alarm') counts.alarm++
        else if (s === 'fault') counts.fault++
        else if (s === 'offline') counts.offline++
        else counts.other++
      }
      const tone: FireWaterCardValue['tone'] =
        counts.alarm > 0 ? 'alarm' : counts.fault > 0 ? 'fault' : counts.offline > 0 ? 'offline' : 'normal'
      const text =
        tone === 'alarm' ? '报警' : tone === 'fault' ? '故障' : tone === 'offline' ? '部分离线' : '正常运行'
      const detail =
        counts.alarm || counts.fault || counts.offline
          ? `${counts.alarm} 个报警 / ${counts.fault} 个故障 / ${counts.offline} 个离线`
          : `无报警 · ${counts.normal} 个点位正常`
      const abnormalPoints = points.filter(p => {
        const s = statusOf(p, getRuntime)
        return s === 'alarm' || s === 'fault' || s === 'offline'
      })
      out.push({
        key: card.key,
        label: card.label,
        icon: tone === 'normal' ? card.icon : tone === 'alarm' ? 'error-circle' : 'close-circle',
        value: text,
        unit: '',
        sub: detail,
        normalRange: `正常范围：${points.length} 个点位无报警`,
        tone,
        points: abnormalPoints,
      })
      continue
    }

    const members = byType(card.typeKey!)
    const metric = metricOf(members[0], card.metricKey!)
    const vals = members
      .map(p => num(getRuntime(p.id)?.values?.[card.metricKey!]))
      .filter((v): v is number => v !== undefined)

    if (!members.length || !vals.length) {
      out.push({
        key: card.key,
        label: card.label,
        icon: card.icon,
        value: '--',
        unit: metric?.unit ?? '',
        sub: '无测点数据',
        normalRange: '',
        tone: 'normal',
        points: members,
      })
      continue
    }

    const aggValue = card.agg === 'avg' ? vals.reduce((a, b) => a + b, 0) / vals.length : Math.min(...vals)
    const precision = metric?.precision ?? 2
    const unit = metric?.unit ?? ''
    const status = groupStatus(members, getRuntime)
    const tone: FireWaterCardValue['tone'] =
      status === 'alarm' ? 'alarm' : status === 'fault' ? 'fault' : status === 'offline' ? 'offline' : 'normal'

    let value: string
    let shownUnit = unit
    let sub: string
    let normalRange = ''

    if (card.asPercent && metric?.range) {
      const rangeMax = metric.range[1]
      value = fmt((aggValue / rangeMax) * 100, 0)
      shownUnit = '%'
      sub = `${fmt(aggValue, precision)} ${unit} · ${members.length} 个测点最低值`
      if (metric.normalRange) {
        normalRange = `正常范围：${fmt((metric.normalRange[0] / rangeMax) * 100, 0)}% ~ ${fmt(
          (metric.normalRange[1] / rangeMax) * 100,
          0,
        )}%（${metric.normalRange[0]} ~ ${metric.normalRange[1]} ${unit}）`
      }
    } else {
      value = fmt(aggValue, precision)
      sub = `${members.length} 个测点${card.agg === 'avg' ? '平均值' : '最不利值'}`
      if (metric?.normalRange) {
        normalRange = `正常范围：${metric.normalRange[0]} ~ ${metric.normalRange[1]} ${unit}`
      }
    }

    out.push({
      key: card.key,
      label: card.label,
      icon: card.icon,
      value,
      unit: shownUnit,
      sub,
      normalRange,
      tone,
      points: members,
    })
  }

  return out
}

/** 组装点位组（供下钻抽屉使用） */
export function buildPointGroup(
  key: string,
  title: string,
  desc: string,
  members: PointDef[],
): FireWaterPointGroup {
  return { key, title, desc, points: members }
}
