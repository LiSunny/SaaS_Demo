/**
 * 气体灭火系统监控 · 报警记录 Store
 *
 * 通用逻辑见 `stores/subsystem-alarm.ts`（三个系统共用），
 * 这里只声明气体灭火自己的口径：设备类型名称与报警等级。
 */
import { createSubsystemAlarmStore } from '@/stores/subsystem-alarm'
import type { PointDef, PointStatus } from '@/types/subsystem'
import type { SubsystemAlarmLevel } from '@/types/subsystem-scene'

/** 设备档案类型 key → 名称 */
function typeName(t: string): string {
  if (t === 'cylinder_pressure') return '钢瓶压力探测器'
  if (t === 'gas_host') return '气体灭火监控主机'
  if (t === 'gas_slave') return '钢瓶压力监控分机'
  return t
}

/**
 * 报警等级
 *
 * 钢瓶压力低于下限 1.2 MPa = 灭火剂储备不足 = 紧急；
 * 压力超上限（> 1.4 MPa）= 重要；
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

export const useGasAlarmStore = createSubsystemAlarmStore({
  storeId: 'gas-alarm',
  typeNameOf: typeName,
  levelOf,
  seedPrefix: 'gas-history',
})
