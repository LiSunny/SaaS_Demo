/**
 * 消防用水监控卡 · 三项指标
 *
 * 口径全部走平台既有的绑定表（config/firewater-scene.ts）与点位解析
 * （config/subsystem-scene-core.ts），和大屏组态画面、消防水系统监测页同一套，
 * 不会出现同一个数在两个页面不一样：
 *
 *   水箱液位  → 图元 TNK-FIRE-01 管的液位探测器（water_level 前 2 个）
 *   水池液位  → 图元 RES-TANK-01 管的液位探测器（water_level 后 2 个）
 *   最不利点  → 图元 CUS-PSW-01 管的全部管网压力探测器取最小值
 *
 * 数值公式与 config/firewater-scene.ts 的 aggregateNode 同一组：
 *   levelPercent：组内最低液位 ÷ 量程上限 × 100（%）
 *   pressureMin ：组内最低压力（MPa，精度取档案里的 precision=3）
 *
 * 这里另算一遍而不是直接用 aggregateNode：aggregateNode 只给已格式化的字符串，
 * 而卡片要把数值（28px）与单位（16px）分开排版，还要画 24h 趋势曲线。
 */
import { bindingOf } from '@/config/firewater-scene'
import { groupStatus, metricOf, num, resolveNodePoints } from '@/config/subsystem-scene-core'
import type { PointDef, PointRuntime } from '@/types/subsystem'

/** 取值口径 */
export type WaterMetricValue = 'levelPercent' | 'pressureMin'

export interface WaterMetricRow {
  key: string
  name: string
  /** ⓘ 说明文案 */
  hint: string
  /** 绑定表里的图元符号 */
  symbol: string
  /** 测点指标键 */
  metricKey: string
  /** 取值口径 */
  value: WaterMetricValue
}

/** 三行指标（设计稿 94:9840 / 94:9865 / 94:9890） */
export const WATER_METRIC_ROWS: WaterMetricRow[] = [
  {
    key: 'tank',
    name: '水箱液位',
    hint: '消防水箱液位：取水箱液位探测器中的最低值，按量程折算成百分比',
    symbol: 'TNK-FIRE-01',
    metricKey: 'level',
    value: 'levelPercent',
  },
  {
    key: 'pool',
    name: '水池液位',
    hint: '消防水池液位：取水池液位探测器中的最低值，按量程折算成百分比',
    symbol: 'RES-TANK-01',
    metricKey: 'level',
    value: 'levelPercent',
  },
  {
    key: 'pressure',
    name: '最不利点',
    hint: '管网最不利点：全部管网压力探测器中的最低值，低于 0.10 MPa 即为失压',
    symbol: 'CUS-PSW-01',
    metricKey: 'pressure',
    value: 'pressureMin',
  },
]

export interface WaterMetric {
  key: string
  name: string
  hint: string
  /** 主数值文本（28px） */
  value: string
  /** 单位（16px） */
  unit: string
  /** 数值越限 / 组内有报警故障 → 走异常红 */
  abnormal: boolean
  /** 24h 趋势（与主值同口径，逐点取组内最小） */
  trend: number[]
}

/**
 * 逐点取组内最小值
 *
 * 与主值同口径：主值取的是"整组的最小"，趋势就得是"每个时刻组内的最小"，
 * 否则曲线会与旁边那个数字对不上。
 */
function minPerIndex(
  members: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
  metricKey: string,
): number[] {
  const series = members
    .map((p) => getRuntime(p.id)?.trend?.[metricKey])
    .filter((s): s is number[] => Array.isArray(s) && s.length > 0)
  if (!series.length) return []
  const len = Math.max(...series.map((s) => s.length))
  const out: number[] = []
  for (let i = 0; i < len; i++) {
    const vals = series
      .map((s) => s[i])
      .filter((v): v is number => v !== undefined && Number.isFinite(v))
    out.push(vals.length ? Math.min(...vals) : 0)
  }
  return out
}

/** 装配三项指标 */
export function buildWaterMetrics(
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): WaterMetric[] {
  return WATER_METRIC_ROWS.map((row) => {
    const binding = bindingOf(row.symbol, 1)
    const members = binding ? resolveNodePoints(binding, points) : []
    const metric = metricOf(members[0], row.metricKey)

    const values = members
      .map((p) => num(getRuntime(p.id)?.values?.[row.metricKey]))
      .filter((v): v is number => v !== undefined)
    if (!values.length) {
      // 没有点位就没有数值可谈：显示 '--'，不拿 0 冒充。
      return { key: row.key, name: row.name, hint: row.hint, value: '--', unit: '', abnormal: false, trend: [] }
    }

    const raw = Math.min(...values)
    const status = groupStatus(members, getRuntime)
    const low = metric?.lowLimit
    const high = metric?.highLimit
    const outOfRange = (low != null && raw < low) || (high != null && raw > high)
    const abnormal = outOfRange || status === 'alarm' || status === 'fault'

    let value = raw.toFixed(metric?.precision ?? 2)
    let unit = metric?.unit ?? ''
    let trend = minPerIndex(members, getRuntime, row.metricKey)

    if (row.value === 'levelPercent') {
      const rangeMax = metric?.range?.[1] ?? 100
      value = ((raw / rangeMax) * 100).toFixed(1)
      unit = '%'
      trend = trend.map((v) => (v / rangeMax) * 100)
    }

    return { key: row.key, name: row.name, hint: row.hint, value, unit, abnormal, trend }
  })
}
