/**
 * 消防水系统监控 · 报警记录 Store
 *
 * 通用逻辑见 `stores/subsystem-alarm.ts`（三个系统共用），
 * 这里只声明消防水自己的口径：设备类型名称与报警等级。
 */
import { createSubsystemAlarmStore } from '@/stores/subsystem-alarm'
import type { PointDef, PointStatus } from '@/types/subsystem'
import type { SubsystemAlarmLevel } from '@/types/subsystem-scene'

/** 设备档案类型 key → 名称 */
function typeName(t: string): string {
  if (t === 'water_level') return '液位探测器'
  if (t === 'pipe_pressure') return '压力探测器'
  if (t === 'flow_sensor') return '流量传感器'
  if (t === 'valve_switch') return '阀门探测装置'
  if (t === 'hydrant_test') return '末端试水装置'
  if (t === 'pipe_host') return '消防管网监控主机'
  if (t === 'pipe_slave') return '消防管网监控分机'
  return t
}

/**
 * 报警等级
 *
 * 消防水源不足（液位低于下限）= 紧急；
 * 其余模拟量越限（压力、流量超限）= 重要；
 * 设备故障 / 离线 = 一般。
 */
function levelOf(
  point: PointDef,
  status: PointStatus,
  dir: 'high' | 'low' | null,
): SubsystemAlarmLevel {
  if (status !== 'alarm') return 'general'
  if (dir === 'low' && point.typeKey === 'water_level') return 'critical'
  return 'important'
}

export const useFirewaterAlarmStore = createSubsystemAlarmStore({
  storeId: 'firewater-alarm',
  typeNameOf: typeName,
  levelOf,
  seedPrefix: 'firewater-history',
})
