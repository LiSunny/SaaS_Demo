/**
 * 防排烟系统监控 · 报警记录 Store
 *
 * 通用逻辑见 `stores/subsystem-alarm.ts`（三个系统共用），
 * 这里只声明防排烟自己的口径：设备类型名称与报警等级。
 */
import { createSubsystemAlarmStore } from '@/stores/subsystem-alarm'
import type { PointDef, PointStatus } from '@/types/subsystem'
import type { SubsystemAlarmLevel } from '@/types/subsystem-scene'

/** 设备档案类型 key → 名称 */
function typeName(t: string): string {
  if (t === 'fan_pressure') return '风机压差探测器'
  if (t === 'smoke_host') return '消防防排烟监测主机'
  if (t === 'smoke_slave') return '消防防排烟监控分机'
  return t
}

/**
 * 报警等级
 *
 * 风机压差低于下限 100 Pa = 加压送风压差不足 = 紧急（防排烟联动可能失效）；
 * 压差超上限（> 300 Pa）= 重要；
 * 设备故障 / 离线 = 一般。
 */
function levelOf(
  _point: PointDef,
  status: PointStatus,
  dir: 'high' | 'low' | null,
): SubsystemAlarmLevel {
  if (status !== 'alarm') return 'general'
  if (dir === 'low') return 'critical'
  return 'important'
}

export const useSmokeAlarmStore = createSubsystemAlarmStore({
  storeId: 'smoke-alarm',
  typeNameOf: typeName,
  levelOf,
  seedPrefix: 'smoke-history',
})
