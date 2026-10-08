import type { WidgetSlot, WidgetRow } from '@/config/dashboard-presets'

/**
 * v2 → v3 数据迁移
 *
 * v2 数据是扁平 WidgetSlot[]（按 order 排序，size 语义 = flex-basis 百分比）
 * v3 数据是 WidgetRow[]（每行显式 row 容器，size 语义 = 占位单位数）
 *
 * 策略：单卡行保留（每个 v2 slot → 独立一行）。
 * 理由：
 *   - 简单可逆，迁移确定性强
 *   - 不会因算法假设出错导致 widget 错位
 *   - 用户首次保存后，下次加载按新规则（可合并）
 *   - 视觉从「浏览器自动 wrap」变成「每行一个」是预期行为，用户可自行合并
 */
export function migrateV2ToV3(v2Slots: WidgetSlot[]): WidgetRow[] {
  // 按 v2 残留的 order 字段排序（v2 用 order 表示渲染顺序，v3 由 row.slots 数组顺序隐含）
  // 用 as any 处理 v2 数据中可能含有的 order 字段（v3 类型已移除）
  const sorted = [...v2Slots].sort((a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0))
  return sorted.map((slot, idx) => ({
    id: `row-mig-${idx}-${slot.id}`,
    slots: [{ ...slot }],
  }))
}

/** 检测 localStorage 里是否有 v2 数据可迁移 */
export function isV2Key(key: string): boolean {
  return key.startsWith('dashboard:v2:') && !key.includes('backup')
}