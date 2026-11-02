/**
 * 组态画面节点状态装配（总览页「消防用水监控」卡用）
 *
 * 大屏的画面来自平台接口 /api/scenes，节点上没有状态字段 —— 角标要标出
 * 「哪台设备异常」，就得把画面节点和设备档案里的实时点位对上。
 *
 * 对表口径复用平台既有的一套（config/firewater-scene.ts 的绑定表 +
 * config/subsystem-scene-core.ts 的状态汇总），因此大屏角标与
 * 「设备设施管理 › 运行监控 › 消防水系统」页的判定完全一致，
 * 不会出现同一台设备在两个页面一个报异常一个报正常。
 *
 * 绑定按「图元符号 + 该符号在画面中的第几个实例」匹配，
 * 节点顺序即画面节点数组顺序（与平台绑定表里的 nth 口径相同）。
 */
import type { PointDef, PointRuntime } from '@/types/subsystem'
import type { SubsystemSceneAdapter } from '@/types/subsystem-scene'
import type { SceneConfig, SceneNode } from '@/types/scene-config'

export function applyNodeStates(
  scene: SceneConfig | null,
  adapter: SubsystemSceneAdapter,
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): SceneConfig | null {
  if (!scene) return null

  /** 每个符号在画面中出现的次数 → nth */
  const seen = new Map<string, number>()

  const nodes: SceneNode[] = scene.nodes.map((n) => {
    const nth = (seen.get(n.symbol) ?? 0) + 1
    seen.set(n.symbol, nth)

    const binding = adapter.bindingOf(n.symbol, nth)
    if (!binding) return n

    const agg = adapter.aggregate(binding, points, getRuntime)
    return { ...n, state: agg.state }
  })

  return { ...scene, nodes }
}
