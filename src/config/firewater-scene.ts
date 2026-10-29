/**
 * 消防水系统监控 · 组态场景与点位绑定
 *
 * 场景布局取自组态配置导出的画面文件 `src/config/firewater-scene.json`
 * （1200×700 / 11 节点 / 10 连线 / 11 个自定义图元定义）。
 * 画面文件由用户在「设备设施管理 › 规则管理 › 组态配置」里编辑后导出，
 * 改完重新导出替换本文件即可；文件内的 `symbols` 段是画面用到的图元定义
 * （产品图公网地址 + 端口 + 绑定点），服务端缺图元时用它兜底注册。
 *
 * 本文件只补两件事：
 *   1. 连线流动方向兜底（画面文件已带 flow 时以画面为准）
 *   2. 图元 ↔ 点位绑定表：把 1156 个点位分给画面上的图元
 *
 * 绑定口径：图元符号（symbol）+ 设备档案类（typeKey）+ 编号前缀圈定，
 * 再在该类内部按序号切片。store 里同类同前缀的点位编号升序（generatePoints 顺序推进），
 * 所以切片稳定可复算。
 *
 * 公共内核（成员解析缓存、状态汇总、统计卡口径）见 `config/subsystem-scene-core.ts`
 * 与 `config/subsystem-cards.ts`，气体灭火页共用同一份实现。
 *
 * 覆盖校验（消防水系统共 1156 个点位）：
 *   主机 1 + 分机 8 + 液位 4 + 压力 114 + 流量 6 + 末端试水 232 = 365 个有图元归属
 *   阀门 791 个当前画面未放置阀门图元 → 组态视图无下钻入口（设备台帐仍可查）
 *   365 + 791 = 1156 ✓
 */
import sceneJson from './firewater-scene.json'
import type { SceneEdge, SceneNode } from '@/types/scene-config'
import type { PointDef, PointRuntime } from '@/types/subsystem'
import type {
  SubsystemCardValue,
  SubsystemNodeAggregate,
  SubsystemNodeBinding,
  SubsystemPointGroup,
  SubsystemSceneAdapter,
} from '@/types/subsystem-scene'
import {
  analogState,
  countState,
  fmt,
  groupStatus,
  metricOf,
  num,
  resolveNodePoints,
  statusOf,
} from './subsystem-scene-core'
import { computeSubsystemCards, SUBSYSTEM_CARD_THEME } from './subsystem-cards'

interface RawLayout {
  version: number
  name: string
  width: number
  height: number
  nodes: SceneNode[]
  edges: SceneEdge[]
  /** 画面用到的图元定义（服务端没有时按此兜底注册） */
  symbols?: RawSceneSymbol[]
}

interface RawSceneSymbol {
  id: string
  name: string
  category: string
  system: string
  image?: string
  ports: Array<{ x: number; y: number; dir: string }>
  bindings: Array<Record<string, unknown>>
}

const layout = sceneJson as unknown as RawLayout

export const FIREWATER_SCENE_NAME = layout.name

/** 画布尺寸（与画面文件一致） */
export const FIREWATER_VIEWBOX = { w: layout.width, h: layout.height }

/** 场景节点（位置 / 标签 / 尺寸取自组态配置导出的画面文件） */
export const FIREWATER_NODES: SceneNode[] = layout.nodes

/** 场景连线：画面文件已声明 flow 的以画面为准；电气连线（kind=control）不流动 */
export const FIREWATER_EDGES: SceneEdge[] = layout.edges.map(
  (e): SceneEdge => ({
    ...e,
    flow: e.flow ?? (e.kind === 'control' ? 'none' : 'forward'),
  }),
)

/** 画面文件内联的图元定义（服务端未收录时按此兜底注册） */
export const FIREWATER_SCENE_SYMBOLS: RawSceneSymbol[] = layout.symbols ?? []

/**
 * 图元 ↔ 点位绑定表
 *
 * 画面结构（导出自组态配置）：消防用水监测主机 1 台，其下挂 10 个末端器件
 *   液位 / 压力开关 / 流量计 / 自动末端试水 / 手动末端试水 / 输入模块 / 输入输出模块 /
 *   水浸 / 温湿度探测器 / 电气火灾探测器
 *
 * 平台档案侧没有「输入模块 / 水浸 / 温湿度 / 电气火灾探测器」这一类设备，
 * 最接近的归属是监控分机（8 台，无更细的类型区分），
 * 因此这 5 个模块图元按画面内节点顺序依次领取 2 / 2 / 2 / 1 / 1 台分机。
 *
 * 阀门规则当前画面没有对应图元，先行预置：
 * 往画面里放进 VLV-BUTT-01 / VLV-GATE-01 图元即自动生效，无需改代码。
 */
export const FIREWATER_NODE_BINDINGS: SubsystemNodeBinding[] = [
  // ===== 主机 =====
  { symbol: 'FWMS-MH-01', match: { typeKeys: ['pipe_host'] }, value: 'deviceState', metricKey: 'runStatus' },

  // ===== 水力与末端 =====
  // 液位：消防水池 / 水箱 4 个液位探测器 → 最低水位
  { symbol: 'CUS-LEV-01', match: { typeKeys: ['water_level'] }, value: 'levelPercent', metricKey: 'level' },
  // 压力开关：114 个管网压力探测器 → 最不利点
  { symbol: 'CUS-PSW-01', match: { typeKeys: ['pipe_pressure'] }, value: 'pressureMin', metricKey: 'pressure' },
  // 流量计：6 个流量传感器 → 瞬时流量合计
  { symbol: 'CUS-FTM-01', match: { typeKeys: ['flow_sensor'] }, value: 'flowSum', metricKey: 'flow' },
  // 自动末端试水：ZSD 电动（自动）末端试水装置 38 个
  { symbol: 'CUS-ATS-01', match: { typeKeys: ['hydrant_test'], codePrefix: 'ZSD' }, value: 'startedCount', metricKey: 'runState', onValue: 'running' },
  // 手动末端试水：SD 手动末端试水装置 194 个
  { symbol: 'CUS-MTS-01', match: { typeKeys: ['hydrant_test'], codePrefix: 'SD' }, value: 'startedCount', metricKey: 'runState', onValue: 'running' },

  // ===== 模块 / 探测器（归档到监控分机 8 台，按画面节点顺序领取） =====
  { symbol: 'CUS-IOM-01', match: { typeKeys: ['pipe_slave'], slice: [0, 2] }, value: 'runningCount', metricKey: 'runStatus', onValue: 'normal' },
  { symbol: 'CUS-THS-01', match: { typeKeys: ['pipe_slave'], slice: [2, 4] }, value: 'runningCount', metricKey: 'runStatus', onValue: 'normal' },
  { symbol: 'CUS-WIM-01', match: { typeKeys: ['pipe_slave'], slice: [4, 6] }, value: 'runningCount', metricKey: 'runStatus', onValue: 'normal' },
  { symbol: 'CUS-INM-01', match: { typeKeys: ['pipe_slave'], slice: [6, 7] }, value: 'runningCount', metricKey: 'runStatus', onValue: 'normal' },
  { symbol: 'CUS-EFD-01', match: { typeKeys: ['pipe_slave'], slice: [7, 8] }, value: 'runningCount', metricKey: 'runStatus', onValue: 'normal' },

  // ===== 阀门（当前画面未放置图元，预置规则；画面加图元即生效） =====
  { symbol: 'VLV-BUTT-01', match: { typeKeys: ['valve_switch'], codePrefix: 'FM' }, value: 'openCount', metricKey: 'valveState', onValue: 'open' },
  { symbol: 'VLV-GATE-01', match: { typeKeys: ['valve_switch'], codePrefix: 'BZ' }, value: 'openCount', metricKey: 'valveState', onValue: 'open' },
]

/**
 * 取某节点的绑定规则
 *
 * @param symbol 节点图元符号
 * @param nth 该符号在画面中的第几个实例（从 1 起）
 */
export function bindingOf(symbol: string, nth: number): SubsystemNodeBinding | undefined {
  return FIREWATER_NODE_BINDINGS.find(b => b.symbol === symbol && (b.nth ?? 1) === nth)
}

// ===== 节点 ↔ 点位 =====

/**
 * 聚合节点状态与显示值
 *
 * 状态优先级：组内只要有报警/故障，图元就不能显示成健康绿。
 * 数值口径与图元库状态类（is-run / is-fault / is-open / is-closed / is-off / is-over）对应。
 */
export function aggregateNode(
  binding: SubsystemNodeBinding,
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): SubsystemNodeAggregate {
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
        state: analogState(status),
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
        state: analogState(status),
      }
    }
    case 'flowSum': {
      const vals = members
        .map(p => num(getRuntime(p.id)?.values?.[binding.metricKey]))
        .filter((v): v is number => v !== undefined)
      if (!vals.length) return { points: members, abnormal, value: '--', subValue: '', state: { off: true } }
      const sum = vals.reduce((a, b) => a + b, 0)
      return {
        points: members,
        abnormal,
        value: `${fmt(sum, precision)} ${unit}`,
        subValue: `瞬时流量合计 / ${members.length} 个测点`,
        state: analogState(status),
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
 * 点位 → 画面上负责它的图元
 *
 * 设备台帐行点「所属图元」时用：反查该点位落在哪个图元的绑定组里。
 */
export function findOwnerNode(
  pointId: string,
  points: PointDef[],
): { node: SceneNode; points: PointDef[] } | undefined {
  const seen = new Map<string, number>()
  for (const node of FIREWATER_NODES) {
    const nth = (seen.get(node.symbol) ?? 0) + 1
    seen.set(node.symbol, nth)
    const binding = bindingOf(node.symbol, nth)
    if (!binding) continue
    const members = resolveNodePoints(binding, points)
    if (members.some(m => m.id === pointId)) return { node, points: members }
  }
  return undefined
}

// ===== 顶部统计卡（设备维度） =====

/** 统计卡主题：图标地址 + 分项配色 */
/** 统计卡主题：三系统共用（图标沿用消防水那套，配色按图例语义固定） */
const CARD_THEME = SUBSYSTEM_CARD_THEME

/**
 * 计算顶部 4 张统计卡
 *
 * 口径写在 `config/subsystem-cards.ts`（三系统共用），这里只给消防水的主题。
 */
export function computeFireWaterCards(
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): SubsystemCardValue[] {
  return computeSubsystemCards(points, getRuntime, CARD_THEME)
}

/** 组装点位组（供下钻抽屉使用） */
export function buildPointGroup(
  key: string,
  title: string,
  desc: string,
  members: PointDef[],
): SubsystemPointGroup {
  return { key, title, desc, points: members }
}

/** 消防水组态场景适配器（公共场景渲染组件只认这个接口） */
export const FIREWATER_SCENE: SubsystemSceneAdapter = {
  name: FIREWATER_SCENE_NAME,
  viewbox: FIREWATER_VIEWBOX,
  nodes: FIREWATER_NODES,
  edges: FIREWATER_EDGES,
  symbols: FIREWATER_SCENE_SYMBOLS,
  bindingOf,
  aggregate: aggregateNode,
  findOwnerNode,
}
