import type { WidgetSlot, WidgetRow } from '@/config/dashboard-presets'

/**
 * size 单位映射：
 *   size:1 → 3 单位（满行 = 100%）
 *   size:2 → 2 单位（半行 = 50%）
 *   size:3 → 1 单位（三分行 = 33.33%）
 *
 * 一行最多 6 单位，组合：
 *   6=3+3 / 3+2+1 / 2+2+2 / 2+2+1+1 / 2+1+1+1+1 / 1×6
 *
 * 注意：size 数字 1/2/3 不再是视觉宽度（100/50/33%）的别名，而是「占位单位数」标签。
 * 视觉宽度由 CSS flex-grow + 媒体查询共同决定。
 */
export const SIZE_UNITS: Record<WidgetSlot['size'], number> = {
  1: 3,
  2: 2,
  3: 1,
}

/** 单行最大单位数（桌面端基准值） */
export const ROW_MAX_UNITS = 6

/** 计算单行已用单位总和 */
export function rowUnits(slots: WidgetSlot[]): number {
  return slots.reduce((sum, s) => sum + SIZE_UNITS[s.size], 0)
}

/** 目标 row 能否再容纳一张指定 size 的 slot */
export function canFit(slots: WidgetSlot[], size: WidgetSlot['size']): boolean {
  return rowUnits(slots) + SIZE_UNITS[size] <= ROW_MAX_UNITS
}

/** 单行剩余可用单位数 */
export function rowRemaining(slots: WidgetSlot[]): number {
  return ROW_MAX_UNITS - rowUnits(slots)
}

/** 生成稳定行 ID（用于默认布局和动态新建） */
let _rowSeq = 0
export function nextRowId(): string {
  _rowSeq += 1
  return `row-${Date.now().toString(36)}-${_rowSeq}`
}

/** 生成稳定 slot ID（用于新添加的 widget） */
let _slotSeq = 0
export function nextSlotId(prefix = 'slot'): string {
  _slotSeq += 1
  return `${prefix}-${Date.now().toString(36)}-${_slotSeq}`
}

/**
 * 将超容 row 拆分为多行（贪心：从前向后累加，溢出即开新行）
 * 用于启动校验、数据损坏兜底、用户连续 size 切换导致行超容的兜底场景。
 */
export function splitRow(row: WidgetRow): WidgetRow[] {
  const rows: WidgetRow[] = []
  let current: WidgetSlot[] = []
  for (const slot of row.slots) {
    if (current.length === 0) {
      current.push(slot)
      continue
    }
    if (canFit(current, slot.size)) {
      current.push(slot)
    } else {
      rows.push({ id: row.id + '-s' + rows.length, slots: current })
      current = [slot]
    }
  }
  if (current.length > 0) {
    rows.push({ id: row.id + '-s' + rows.length, slots: current })
  }
  // 至少返回 1 行（防止全空）
  return rows.length > 0 ? rows : [{ id: row.id, slots: [] }]
}