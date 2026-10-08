import { widgetRegistry, type WidgetType } from '@/config/widget-registry'
import type { WidgetSlot, WidgetRow } from '@/config/dashboard-presets'
import { rowUnits, ROW_MAX_UNITS, splitRow } from './dashboard-layout'

/**
 * 启动时校验 layout 数据完整性 + 自动修复
 *
 * 修复项：
 *   - 移除空 row（slots=[]）
 *   - 移除未知 widget type（不在 registry 中）
 *   - 去除 slot.id 重复（保留首次出现）
 *   - 拆行：单行单位总和 > 6（数据损坏兜底）
 *
 * 不会做的事：
 *   - 合并行（用户主动控制）
 *   - 改 size（用户主动控制）
 */
export function sanitizeLayout(rows: WidgetRow[]): WidgetRow[] {
  if (!Array.isArray(rows)) return []

  const seenIds = new Set<string>()
  const result: WidgetRow[] = []

  for (const row of rows) {
    if (!row || !Array.isArray(row.slots)) continue

    // 1. 过滤无效 slot（未知 type / 重复 id）
    const validSlots: WidgetSlot[] = []
    for (const slot of row.slots) {
      if (!slot || !slot.type) continue
      if (!widgetRegistry[slot.type as WidgetType]) continue
      if (seenIds.has(slot.id)) continue
      seenIds.add(slot.id)
      validSlots.push(slot)
    }

    if (validSlots.length === 0) continue

    // 2. 检查单行超容 → 拆行
    if (rowUnits(validSlots) > ROW_MAX_UNITS) {
      result.push(...splitRow({ id: row.id, slots: validSlots }))
    } else {
      result.push({ id: row.id, slots: validSlots })
    }
  }

  return result
}