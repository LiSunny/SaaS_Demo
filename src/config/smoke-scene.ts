/**
 * 防排烟系统监控 · 组态场景与点位绑定
 *
 * 场景布局取自组态配置导出的画面文件 `src/config/smoke-scene.json`
 * （1200×700 / 2 节点 / 1 连线 / 2 个自定义图元定义）。
 * 改完组态重新导出替换本文件即可；文件内的 `symbols` 段是画面用到的图元定义
 * （产品图公网地址 + 端口 + 绑定点），服务端缺图元时用它兜底注册。
 *
 * 公共内核（成员解析缓存、状态汇总、统计卡口径）见 `config/subsystem-scene-core.ts`
 * 与 `config/subsystem-cards.ts`，与消防水页、气体灭火页共用同一份实现。
 *
 * 覆盖校验（消防防排烟系统共 96 个点位）：
 *   主机 1（SCS-MH-01）+ 风机压差探测器 93（SCS-RPD-01）= 94 个有图元归属
 *   分机 2 台当前画面未放置图元 → 组态视图无下钻入口（设备台帐仍可查）
 *   94 + 2 = 96 ✓
 */
import sceneJson from './smoke-scene.json'
import type { SceneEdge, SceneNode } from '@/types/scene-config'
import type { PointDef, PointRuntime } from '@/types/subsystem'
import type {
  SubsystemCardValue,
  SubsystemNodeAggregate,
  SubsystemNodeBinding,
  SubsystemPointGroup,
  SubsystemSceneAdapter,
} from '@/types/subsystem-scene'
import { analogState, fmt, groupStatus, metricOf, num, resolveNodePoints, statusOf } from './subsystem-scene-core'
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

export const SMOKE_SCENE_NAME = layout.name

/** 画布尺寸（与画面文件一致） */
export const SMOKE_VIEWBOX = { w: layout.width, h: layout.height }

/** 场景节点（位置 / 标签 / 尺寸取自组态配置导出的画面文件） */
export const SMOKE_NODES: SceneNode[] = layout.nodes

/** 场景连线：画面文件已声明 flow 的以画面为准；电气连线（kind=control）不流动 */
export const SMOKE_EDGES: SceneEdge[] = layout.edges.map(
  (e): SceneEdge => ({
    ...e,
    flow: e.flow ?? (e.kind === 'control' ? 'none' : 'forward'),
  }),
)

/** 画面文件内联的图元定义（服务端未收录时按此兜底注册） */
export const SMOKE_SCENE_SYMBOLS: RawSceneSymbol[] = layout.symbols ?? []

/**
 * 图元 ↔ 点位绑定表
 *
 * 画面结构（导出自组态配置）：防排烟监测主机 1 台，其下挂风机压差探测器 1 组
 *
 * 平台档案侧没有「防排烟监测主机」这个独立设备类型，
 * 最接近的归属是消防防排烟监测主机（1 台），
 * 因此 SCS-MH-01 绑定监测主机；SCS-RPD-01 绑定全部风机压差探测器（93 台）。
 */
export const SMOKE_NODE_BINDINGS: SubsystemNodeBinding[] = [
  // ===== 监测主机 =====
  { symbol: 'SCS-MH-01', match: { typeKeys: ['smoke_host'] }, value: 'deviceState', metricKey: 'runStatus' },

  // ===== 风机压差探测器（93 个）=====
  { symbol: 'SCS-RPD-01', match: { typeKeys: ['fan_pressure'] }, value: 'fanPressure', metricKey: 'diffPressure' },
]

/**
 * 取某节点的绑定规则
 *
 * @param symbol 节点图元符号
 * @param nth 该符号在画面中的第几个实例（从 1 起）
 */
export function bindingOf(symbol: string, nth: number): SubsystemNodeBinding | undefined {
  return SMOKE_NODE_BINDINGS.find(b => b.symbol === symbol && (b.nth ?? 1) === nth)
}

// ===== 节点 ↔ 点位 =====

/**
 * 聚合节点状态与显示值
 *
 * 状态优先级：组内只要有报警/故障，图元就不能显示成健康绿。
 * 数值口径与图元库状态类（is-run / is-fault / is-off / is-over）对应。
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
    case 'fanPressure': {
      // 最不利点取最低压差：加压送风压差越低，排烟与送风越不达标
      const vals = members
        .map(p => num(getRuntime(p.id)?.values?.[binding.metricKey]))
        .filter((v): v is number => v !== undefined)
      if (!vals.length) return { points: members, abnormal, value: '--', subValue: '', state: { off: true } }
      const min = Math.min(...vals)
      const normal = members.filter(p => statusOf(p, getRuntime) === 'normal').length
      return {
        points: members,
        abnormal,
        value: `${fmt(min, precision)} ${unit}`,
        subValue: `压差正常 ${normal}/${members.length}`,
        state: analogState(status),
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
  for (const node of SMOKE_NODES) {
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

/** 统计卡主题：三系统共用（图标沿用消防水那套，配色按图例语义固定） */
const CARD_THEME = SUBSYSTEM_CARD_THEME

/**
 * 计算顶部 4 张统计卡
 *
 * 口径写在 `config/subsystem-cards.ts`（三系统共用），这里只给防排烟的主题。
 */
export function computeSmokeCards(
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

/** 防排烟组态场景适配器（公共场景渲染组件只认这个接口） */
export const SMOKE_SCENE: SubsystemSceneAdapter = {
  name: SMOKE_SCENE_NAME,
  viewbox: SMOKE_VIEWBOX,
  nodes: SMOKE_NODES,
  edges: SMOKE_EDGES,
  symbols: SMOKE_SCENE_SYMBOLS,
  bindingOf,
  aggregate: aggregateNode,
  findOwnerNode,
}
