/**
 * 画面点位池
 *
 * 系统监测页的两个模块（实时警情、统计分析报表）都从「画面里的设备 × 其符号
 * 的绑定点位」取数据，口径必须一致，所以抽到这里共用。
 *
 * 点位来源三层：
 *   设备名 = 画面图元标签
 *   点位名 / 单位 / 量程 = 图元库符号绑定（`symbolDef(...).bindings`）
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
}

/**
 * 异常点位词表
 *
 * 点位名命中即为「会报异常的信号点」（故障 / 报警 / 溢流 …）。
 * 实时警情用它给上报值上色、统计分析报表用它统计告警点 —— 两处必须同一份口径。
 */
export const ABNORMAL_POINT_WORDS = ['故障', '报警', '失重', '欠压', '超限', '水浸', '溢流']

/** 点位是否为异常信号点 */
export function isAbnormalPoint(point: string): boolean {
  return ABNORMAL_POINT_WORDS.some((w) => point.includes(w))
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
      })
    }
  }
  return out
}
