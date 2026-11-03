/**
 * 画面点位池
 *
 * 系统监测页的各模块（设备检测指标概览、实时警情、多发故障排名）都从
 * 「画面里的设备 × 其符号的绑定点位」取数据，口径必须一致，所以抽到这里共用。
 *
 * 点位来源三层：
 *   设备名 = 画面图元标签
 *   点位名 / 单位 / 量程 / 状态类 = 图元库符号绑定（`symbolDef(...).bindings`）
 *   上报值 = 按绑定量程生成的演示值（后端暂无实时点位接口）
 */
import { symbolDef, SYMBOL_REGISTRY_VERSION } from '@/symbols'
import type { SceneConfig } from '@/types/scene-config'

/** 一个可上报的点位 */
export interface PointSource {
  /** 所在图元（画面节点）ID —— 统计"覆盖设备"按它去重 */
  nodeId: string
  /** 设备名（画面图元标签） */
  device: string
  /** 点位名 */
  point: string
  /** 点位类型：状态量 / 液位 / 压力 / 流量 … */
  type: string
  /** 绑定类型：bool / text / level / angle */
  kind: string
  unit?: string
  min?: number
  max?: number
  /**
   * 绑定声明的「点亮」状态类（onClass）。
   *
   * 图元库在每个绑定上写明该点位触发哪些状态，例如：
   *   故障   → onClass: ['is-fault']
   *   溢流   → onClass: ['is-over']
   *   报警   → onClass: ['is-alarm']
   *   过流   → onClass: ['is-flow']
   * 这是平台侧的真值 —— 分类故障 / 预警不靠点位名的模糊匹配，直接取绑定声明。
   */
  onClasses: string[]
  /**
   * 绑定声明的「熄灭」状态类（offClass）。
   *
   * 例如「运行」绑定声明 offClass: ['is-off']：设备停运时点位落到 is-off，
   * 即该设备当前不参与监控统计 —— 对应指标概览里的「屏蔽」。
   */
  offClasses: string[]
}

/**
 * 异常点位词表
 *
 * 点位名命中即为「会报异常的信号点」（故障 / 报警 / 溢流 …）。
 * 实时警情用它给上报值上色、统计分析报表用它统计告警点 —— 两处必须同一份口径。
 */
export const ABNORMAL_POINT_WORDS = ['故障', '报警', '失重', '欠压', '超限', '水浸', '溢流']

/**
 * 点位是否为异常信号点
 *
 * 按**绑定声明的状态类**判定，不再靠点位名做模糊匹配：
 *   is-fault  故障类（故障 / 渗漏故障 / 失重 / 欠压 …）
 *   is-over   超限类（溢流 …）
 *   is-alarm  报警类（报警 / 水力报警 / 动作 …）
 *   is-flow   过流类（过流 …）
 * 绑定声明是平台侧真值：同一个「故障」点位在图元库里的类就是 is-fault，
 * 不依赖文案；点位名匹配会把「已消警的故障说明」这类文案也算成异常。
 */
export const ABNORMAL_STATE_CLASSES = ['is-fault', 'is-over', 'is-alarm', 'is-flow']

/** 故障类状态类 */
export const FAULT_STATE_CLASSES = ['is-fault']

/** 预警类状态类（超限 / 报警 / 过流） */
export const WARN_STATE_CLASSES = ['is-over', 'is-alarm', 'is-flow']

/** 停用类状态类（绑定声明的 offClass）：设备停运、不再上报 */
export const SHIELD_STATE_CLASSES = ['is-off']

/** 点位是否为异常信号点 */
export function isAbnormalPoint(point: string): boolean {
  return ABNORMAL_POINT_WORDS.some((w) => point.includes(w))
}

/** 点位绑定的状态类里是否命中给定集合 */
export function hasStateClass(classes: string[], wanted: string[]): boolean {
  return wanted.some((w) => classes.includes(w))
}

/** 点位是否为异常信号点（按绑定声明的状态类判定） */
export function isAbnormalSource(src: PointSource): boolean {
  return hasStateClass(src.onClasses, ABNORMAL_STATE_CLASSES)
}

/**
 * 点位类型分类
 *
 * 按绑定的 kind + 单位归类，同类型的点位才能聚合成一行统计。
 * 纯数值型（自定义图元里有几处没写单位）归「数值」。
 */
export function pointTypeOf(kind: string, unit?: string): string {
  if (kind === 'bool') return '状态量'
  if (kind === 'level') return '液位'
  switch (unit) {
    case 'MPa':
      return '压力'
    case 'L/s':
    case 'm³/h':
    case 'm³':
      return '流量'
    case '℃':
      return '温度'
    case '%':
    case '%RH':
      return '百分比'
    case 's':
      return '时长'
    case 'mA':
      return '电流'
    default:
      return '数值'
  }
}

/**
 * 画面的点位池
 *
 * 自定义图元（SCS-* / GFES-* / CUS-*）是异步注册进渲染链路的，
 * 读 DEF_MAP 前先碰一下注册版本号，注册完成后本计算值会重算。
 */
export function pointSourcesOf(scene: SceneConfig | null): PointSource[] {
  void SYMBOL_REGISTRY_VERSION.value
  const out: PointSource[] = []
  for (const n of scene?.nodes ?? []) {
    const def = symbolDef(n.symbol)
    if (!def) continue
    for (const b of def.bindings ?? []) {
      out.push({
        nodeId: n.id,
        device: n.label || def.name,
        point: b.name,
        type: pointTypeOf(b.kind, b.unit),
        kind: b.kind,
        unit: b.unit,
        min: b.min,
        max: b.max,
        onClasses: b.onClass ?? [],
        offClasses: b.offClass ?? [],
      })
    }
  }
  return out
}

/* ============================================================
 * 设备检测指标概览
 * ============================================================ */

/** 指标概览的四项计数 */
export interface SceneMetrics {
  /** 设备总数：画面内的图元数量 */
  total: number
  /** 故障：绑定声明 is-fault 的点位数 */
  fault: number
  /** 屏蔽：绑定声明 offClass is-off 的点位数（设备停运、不再上报） */
  shield: number
  /** 预警：绑定声明 is-over / is-alarm / is-flow 的点位数 */
  warn: number
}

/**
 * 画面指标概览
 *
 * 四项计数全部来自平台真值，不写演示值：
 *   设备总数 = 画面图元数
 *   故障     = 绑定声明 is-fault 的点位（消防泵组的「故障」点、管道段的「渗漏故障」点 …）
 *   屏蔽     = 绑定声明 offClass is-off 的点位（「运行」点位的停运态 = 不再上报）
 *   预警     = 绑定声明 is-over / is-alarm / is-flow 的点位（溢流、报警、过流 …）
 *
 * 口径与「实时警情」「多发故障排名」同源（都走 pointSourcesOf），
 * 三处对同一画面的说法必须一致。
 */
export function sceneMetricsOf(scene: SceneConfig | null): SceneMetrics {
  const sources = pointSourcesOf(scene)
  return {
    total: scene?.nodes?.length ?? 0,
    fault: sources.filter((s) => hasStateClass(s.onClasses, FAULT_STATE_CLASSES)).length,
    shield: sources.filter((s) => hasStateClass(s.offClasses, SHIELD_STATE_CLASSES)).length,
    warn: sources.filter((s) => hasStateClass(s.onClasses, WARN_STATE_CLASSES)).length,
  }
}

/**
 * 异常点位的故障类型分组（多发故障排名）
 *
 * 按点位名聚合（故障 / 渗漏故障 / 报警 / 溢流 …），降序取前 N 条；
 * 占比 = 该类型的异常点位数 ÷ 画面异常点位数。
 */
export interface FaultTypeRank {
  /** 故障类型（点位名） */
  type: string
  /** 该类型的异常点位数 */
  count: number
  /** 占比（%），同时决定占比条长度 */
  rate: number
}

export function faultTypeRanks(scene: SceneConfig | null, limit = 5): FaultTypeRank[] {
  const sources = pointSourcesOf(scene).filter(isAbnormalSource)
  if (!sources.length) return []

  const counter = new Map<string, number>()
  for (const s of sources) counter.set(s.point, (counter.get(s.point) ?? 0) + 1)

  return [...counter.entries()]
    .map(([type, count]) => ({
      type,
      count,
      rate: Math.round((count / sources.length) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type, 'zh-Hans-CN'))
    .slice(0, limit)
}
