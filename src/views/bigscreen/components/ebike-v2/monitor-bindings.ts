/**
 * 系统监测页 · 画面节点 ↔ 设备档案的绑定适配
 *
 * 三个系统各自的绑定表（画面节点代表哪一批设备）都写在
 * `config/{firewater,gas,smoke}-scene.ts` 里，这里按 systemKey 统一取用，
 * 让大屏系统监测页与「设备设施管理 → 运行监控」的三个系统主页
 * 用同一套绑定规则与聚合逻辑 —— 同一个图元在两处指的是同一批设备。
 */
import { FIREWATER_SCENE } from '@/config/firewater-scene'
import { GAS_SCENE } from '@/config/gas-scene'
import { SMOKE_SCENE } from '@/config/smoke-scene'
import type { PointDef, PointRuntime } from '@/types/subsystem'
import type { SubsystemSceneAdapter } from '@/types/subsystem-scene'
import type { MonitorNodeAggregate } from './monitor-data'

/** systemKey → 场景适配器 */
const ADAPTERS: Record<string, SubsystemSceneAdapter> = {
  pipeline: FIREWATER_SCENE,
  gas: GAS_SCENE,
  smoke: SMOKE_SCENE,
}

/** 取该系统的场景适配器（无对应系统返回 null） */
export function sceneAdapterOf(systemKey: string): SubsystemSceneAdapter | null {
  return ADAPTERS[systemKey] ?? null
}

/**
 * 聚合某个画面节点的实时状态
 *
 * @param systemKey 系统（pipeline / gas / smoke）
 * @param symbol 节点图元符号
 * @param nth 该符号在画面中的第几个实例（从 1 起）
 * @param points 该系统的设备档案
 * @param getRuntime 运行时值读取
 */
export function aggregateNodeOf(
  systemKey: string,
  symbol: string,
  nth: number,
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): MonitorNodeAggregate | null {
  const adapter = sceneAdapterOf(systemKey)
  if (!adapter) return null
  const binding = adapter.bindingOf(symbol, nth)
  if (!binding) return null
  const agg = adapter.aggregate(binding, points, getRuntime)
  return {
    members: agg.points,
    abnormal: agg.abnormal,
    state: agg.state,
  }
}
