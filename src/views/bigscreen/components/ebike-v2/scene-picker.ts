/**
 * 组态画面挑选规则（总览页「消防用水监控」卡与系统监测页共用）
 *
 * 同一系统下取节点最多的那个 —— 节点多的是「总貌」，是系统的整体视图；
 * 节点数相同时取最近更新的。名称含「验证 / 测试」的画面是调试遗留，排除。
 *
 * 画面本身是平台数据（组态配置里可编辑），前端只按规则取用，
 * 不硬编码画面 id 或名称。
 */
import type { SceneConfig } from '@/types/scene-config'

export function pickOverviewScene(
  list: SceneConfig[],
  systemKey?: string,
): SceneConfig | null {
  const scoped = systemKey ? list.filter((s) => s.systemKey === systemKey) : list
  const usable = scoped.filter((s) => !/验证|测试/.test(s.name))
  const pool = usable.length ? usable : scoped
  if (!pool.length) return null
  return [...pool].sort(
    (a, b) => (b.nodes?.length ?? 0) - (a.nodes?.length ?? 0) || b.updatedAt - a.updatedAt,
  )[0]
}
