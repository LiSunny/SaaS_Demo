/**
 * 报警原因推导 —— 卡片与详情抽屉共用同一份逻辑
 *
 * 目标：值班员不点开抽屉也能知道"为什么报警"，点开后也不用自己比对数字。
 */
import type { MetricDef, PointDef, PointRuntime } from '@/types/subsystem'

export interface AlarmReason {
  metric: MetricDef
  value: number
  limit: number
  /** high = 超过上限，low = 低于下限 */
  dir: 'high' | 'low'
}

/** 找出触发报警的具体测点与限值；非报警状态返回 null */
export function findAlarmReason(point: PointDef, runtime?: PointRuntime): AlarmReason | null {
  if (!runtime || runtime.status !== 'alarm') return null
  for (const m of point.metrics) {
    if (m.kind !== 'analog') continue
    const v = Number(runtime.values?.[m.key])
    if (!Number.isFinite(v)) continue
    if (m.highLimit != null && v >= m.highLimit) {
      return { metric: m, value: v, limit: m.highLimit, dir: 'high' }
    }
    if (m.lowLimit != null && v <= m.lowLimit) {
      return { metric: m, value: v, limit: m.lowLimit, dir: 'low' }
    }
  }
  return null
}

/** 报警原因文案 */
export function alarmReasonText(point: PointDef, runtime?: PointRuntime): string {
  const r = findAlarmReason(point, runtime)
  if (!r) return ''
  const u = r.metric.unit ?? ''
  return r.dir === 'high'
    ? `${r.metric.label} ${r.value}${u} 已超上限 ${r.limit}${u}`
    : `${r.metric.label} ${r.value}${u} 已低于下限 ${r.limit}${u}`
}
