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
 * 场景覆盖 1150 个点位，其余 6 个流量点由顶部统计卡「设备总数」下钻进入 → 1156 全部可达。
 */
import sceneJson from './firewater-scene.json'
import type { SceneEdge, SceneNode } from '@/types/scene-config'
import type { MetricDef, PointDef, PointRuntime, PointStatus } from '@/types/subsystem'
import type {
  FireWaterCardKind,
  FireWaterCardLegendItem,
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

// ===== 通用工具 =====

/**
 * 成员列表缓存（按点位清单的数组引用分桶）
 *
 * 「这个节点管哪些点位」每轮刷新都要回答一遍：组态 12 个节点绑定 + 4 张统计卡，
 * 直接 filter 就是 16 × 1156 ≈ 1.8 万次谓词调用，外加 16 个大数组的分配。
 * 而成员集合只随点位清单变化（loadSubsystem 时换一份数组），
 * 所以缓存后每轮 0 次遍历，聚合只做真正需要的那一遍。
 */
const memberCache = new WeakMap<PointDef[], Map<string, PointDef[]>>()

function cachedMembers(points: PointDef[], key: string, build: () => PointDef[]): PointDef[] {
  let byKey = memberCache.get(points)
  if (!byKey) {
    byKey = new Map()
    memberCache.set(points, byKey)
  }
  let list = byKey.get(key)
  if (!list) {
    list = build()
    byKey.set(key, list)
  }
  return list
}

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
  return cachedMembers(points, `node:${binding.nodeId}`, () => {
    const list = points.filter(p => {
      if (!binding.match.typeKeys.includes(p.typeKey)) return false
      if (binding.match.codePrefix) return p.code.startsWith(binding.match.codePrefix)
      return true
    })
    if (!binding.match.slice) return list
    const [start, end] = binding.match.slice
    return list.slice(start, end)
  })
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

/**
 * 图元状态标记
 *
 * 与页面图例同一套色：正常=绿(is-run)、预警=红(is-over，超限)、故障=橙(is-fault)、
 * 离线=灰(is-off)。is-fault 的橙色由 FireWaterScene 局部改色实现，
 * 图元库全局主题仍是红色故障态。
 */
function levelState(status: 'alarm' | 'fault' | 'offline' | 'normal'): Record<string, boolean> {
  if (status === 'alarm') return { over: true }
  if (status === 'fault') return { fault: true }
  if (status === 'offline') return { off: true }
  return { run: true }
}

function pressureState(status: 'alarm' | 'fault' | 'offline' | 'normal'): Record<string, boolean> {
  if (status === 'alarm') return { over: true }
  if (status === 'fault') return { fault: true }
  if (status === 'offline') return { off: true }
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

// ===== 顶部统计卡（设备维度） =====

/** 一张统计卡的最终呈现 */
export interface FireWaterCardValue {
  key: FireWaterCardKind
  /** 卡标题（设计稿文案） */
  label: string
  /** 统计卡图标：设计稿导出的 SVG 路径（SVG 自带底色与配色） */
  icon: string
  /** 主值文本 */
  value: string
  /** 单位（台 / %） */
  unit: string
  /** 口径说明（title 提示，必须能自证） */
  hint: string
  /** 环形图与底部图例共用的分项 */
  legend: FireWaterCardLegendItem[]
  /** 参与计数的设备总数（环形图分母） */
  total: number
  /** 该卡下钻所辖点位 */
  points: PointDef[]
}

/** 设计稿给定的分项色 */
const CARD_COLORS = {
  host: '#6293C8',
  device: '#417AB7',
  offline: '#CED2D7',
  online: '#059669',
  fault: '#D97706',
  warning: '#DC2626',
} as const

/**
 * 计算顶部 4 张统计卡
 *
 * 口径（全部按设备计数，不按测点）：
 *   设备总数   = 主机 + 分机 + 采集器件
 *   设备在线率 = 非离线设备 / 设备总数
 *   设备故障率 = 故障设备 / 设备总数
 *   预警设备   = 报警 + 故障设备（台数）
 *
 * 主机/分机的判定：采集器件带 hostId（挂在某台分机下），
 * 主机与分机自身不带 hostId。
 */
export function computeFireWaterCards(
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): FireWaterCardValue[] {
  const total = points.length
  const hosts = points.filter(p => !p.hostId)
  const devices = points.filter(p => !!p.hostId)

  const statusOfPoint = (p: PointDef): PointStatus => getRuntime(p.id)?.status ?? 'unknown'
  const offline = points.filter(p => statusOfPoint(p) === 'offline')
  const fault = points.filter(p => statusOfPoint(p) === 'fault')
  const warning = points.filter(p => {
    const s = statusOfPoint(p)
    return s === 'alarm' || s === 'fault'
  })

  const online = total - offline.length
  const healthy = total - fault.length
  const pct = (n: number): string => (total > 0 ? ((n / total) * 100).toFixed(2) : '0.00')

  return [
    {
      key: 'deviceTotal',
      label: '设备总数',
      icon: '/icons/fire-water/kpi-device-total.svg',
      value: String(total),
      unit: '台',
      hint: `主机 ${hosts.length} 台（监控主机 + 分机）+ 采集器件 ${devices.length} 台 = ${total} 台`,
      legend: [
        { label: '主机', value: hosts.length, color: CARD_COLORS.host },
        { label: '器件', value: devices.length, color: CARD_COLORS.device },
      ],
      total,
      points,
    },
    {
      key: 'deviceOnline',
      label: '设备在线率',
      icon: '/icons/fire-water/kpi-device-online.svg',
      value: pct(online),
      unit: '%',
      hint: `在线 ${online} 台 ÷ 设备总数 ${total} 台 = ${pct(online)}%`,
      legend: [
        { label: '离线', value: offline.length, color: CARD_COLORS.offline },
        { label: '在线', value: online, color: CARD_COLORS.online },
      ],
      total,
      points: offline,
    },
    {
      key: 'deviceFault',
      label: '设备故障率',
      icon: '/icons/fire-water/kpi-device-fault.svg',
      value: pct(fault.length),
      unit: '%',
      hint: `故障 ${fault.length} 台 ÷ 设备总数 ${total} 台 = ${pct(fault.length)}%`,
      legend: [
        { label: '故障', value: fault.length, color: CARD_COLORS.fault },
        { label: '正常', value: healthy, color: CARD_COLORS.online },
      ],
      total,
      points: fault,
    },
    {
      key: 'deviceWarning',
      label: '预警设备',
      icon: '/icons/fire-water/kpi-device-warning.svg',
      value: String(warning.length),
      unit: '台',
      hint: `报警 + 故障共 ${warning.length} 台（正常 ${total - warning.length} 台）`,
      legend: [
        { label: '预警', value: warning.length, color: CARD_COLORS.warning },
        { label: '正常', value: total - warning.length, color: CARD_COLORS.online },
      ],
      total,
      points: warning,
    },
  ]
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
