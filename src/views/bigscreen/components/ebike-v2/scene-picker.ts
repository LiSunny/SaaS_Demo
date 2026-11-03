/**
 * 组态画面挑选规则（系统监测页）
 *
 * 优先取「设备监控 / 设备状态监控 / 设备状态监测」这类画面 ——
 * 那是设备设施管理 → 组态配置里各系统的监控组态图，三个系统口径一致：
 *   气体灭火设备状态监测 / 防排烟系统设备监控 / 消防水系统设备状态监控
 * 同类画面里再按节点数多者优先，其次取最近更新的。
 * 没有这类画面时退回「节点最多的那个」（节点多的是「总貌」，是系统的整体视图）。
 * 名称含「验证 / 测试」的画面是调试遗留，排除。
 *
 * 画面本身是平台数据（组态配置里可编辑），前端只按规则取用，
 * 不硬编码画面 id 或名称。
 */
import type { SceneConfig } from '@/types/scene-config'

/** 设备监控类画面：名称里同时含「设备」与「监控 / 监测」 */
const DEVICE_MONITOR = /设备.*(监控|监测)/

export function pickOverviewScene(
  list: SceneConfig[],
  systemKey?: string,
): SceneConfig | null {
  const scoped = systemKey ? list.filter((s) => s.systemKey === systemKey) : list
  const usable = scoped.filter((s) => !/验证|测试/.test(s.name))
  const pool = usable.length ? usable : scoped
  if (!pool.length) return null
  return [...pool].sort(
    (a, b) =>
      Number(DEVICE_MONITOR.test(b.name)) - Number(DEVICE_MONITOR.test(a.name)) ||
      (b.nodes?.length ?? 0) - (a.nodes?.length ?? 0) ||
      b.updatedAt - a.updatedAt,
  )[0]
}
