import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardPresets, DEFAULT_ROLE, type WidgetSlot, type WidgetRow } from '@/config/dashboard-presets'
import type { WidgetType } from '@/config/widget-registry'
import { canFit, nextRowId, nextSlotId } from '@/utils/dashboard-layout'
import { migrateV2ToV3 } from '@/utils/dashboard-migration'
import { sanitizeLayout } from '@/utils/dashboard-validator'

/**
 * localStorage 版本历史：
 *   v2 — 扁平 WidgetSlot[] + flex-basis 百分比
 *   v3 — WidgetRow[]（每行显式 row 容器 + size 单位制）
 */
const LS_VERSION = 'v3'
const LS_PREFIX = 'dashboard:'
const LS_BACKUP_PREFIX = 'dashboard:v2-backup:'
const V2_VERSION = 'v2'

function lsKey(dashboardId: string, role: string): string {
  return `${LS_PREFIX}${LS_VERSION}:${dashboardId}:${role}`
}

function lsV2Key(dashboardId: string, role: string): string {
  return `${LS_PREFIX}${V2_VERSION}:${dashboardId}:${role}`
}

function lsBackupKey(dashboardId: string, role: string): string {
  return `${LS_BACKUP_PREFIX}${dashboardId}:${role}`
}

export const useDashboardStore = defineStore('dashboard', () => {
  // ===== 状态 =====
  const layouts = ref<Record<string, WidgetRow[]>>({})
  const isEditing = ref(false)
  const currentDashboardId = ref('workbench')
  const currentRole = ref(DEFAULT_ROLE)

  // ===== 计算属性 =====
  const currentLayout = computed(() => {
    return layouts.value[currentDashboardId.value] || []
  })

  const currentPreset = computed(() => {
    return dashboardPresets[currentDashboardId.value]
  })

  const availableToAdd = computed(() => {
    if (!currentPreset.value) return []
    const layout = currentLayout.value
    const addedTypes = new Set<string>()
    for (const row of layout) {
      for (const slot of row.slots) addedTypes.add(slot.type)
    }
    return currentPreset.value.availableWidgets.filter(t => !addedTypes.has(t))
  })

  // ===== 内部工具 =====
  function findRowAndSlot(slotId: string): { row: WidgetRow; rowIndex: number; slotIndex: number } | null {
    const layout = layouts.value[currentDashboardId.value]
    if (!layout) return null
    for (let r = 0; r < layout.length; r++) {
      const row = layout[r]
      const s = row.slots.findIndex(slot => slot.id === slotId)
      if (s >= 0) return { row, rowIndex: r, slotIndex: s }
    }
    return null
  }

  // ===== 初始化（含 v2 → v3 迁移）=====
  function initDashboard(dashboardId: string, role: string) {
    currentDashboardId.value = dashboardId
    currentRole.value = role
    isEditing.value = false

    const key = lsKey(dashboardId, role)
    try {
      // 1. 优先读 v3
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as WidgetRow[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          layouts.value[dashboardId] = sanitizeLayout(parsed)
          return
        }
      }

      // 2. 检测 v2 旧数据 → 迁移
      const v2Key = lsV2Key(dashboardId, role)
      const v2Saved = localStorage.getItem(v2Key)
      if (v2Saved) {
        try {
          const v2Parsed = JSON.parse(v2Saved) as WidgetSlot[]
          if (Array.isArray(v2Parsed) && v2Parsed.length > 0) {
            const migrated = sanitizeLayout(migrateV2ToV3(v2Parsed))
            layouts.value[dashboardId] = migrated
            // 备份原 v2（防止迁移失败可回退）
            localStorage.setItem(lsBackupKey(dashboardId, role), v2Saved)
            // 立即写 v3 key（避免用户首次刷新再次走迁移）
            localStorage.setItem(key, JSON.stringify(migrated))
            // 删除 v2 key
            localStorage.removeItem(v2Key)
            return
          }
        } catch {
          // v2 数据损坏，备份保留，落到默认布局
          localStorage.setItem(lsBackupKey(dashboardId, role), v2Saved)
          localStorage.removeItem(v2Key)
        }
      }
    } catch {
      // localStorage 不可用，使用默认布局
    }

    // 3. 加载角色默认布局
    const preset = dashboardPresets[dashboardId]
    const defaults = preset?.roleDefaults[role] || preset?.roleDefaults[DEFAULT_ROLE] || []
    layouts.value[dashboardId] = defaults
  }

  // ===== Widget 增删 =====
  function addWidget(type: WidgetType, size: WidgetSlot['size'] = 1) {
    const layout = layouts.value[currentDashboardId.value]
    if (!layout) return

    const newSlot: WidgetSlot = {
      id: nextSlotId(`${currentDashboardId.value}-${type}`),
      type,
      size,
    }

    // 找第一个能容纳的 row 追加；找不到则开新行
    for (const row of layout) {
      if (canFit(row.slots, size)) {
        row.slots.push(newSlot)
        return
      }
    }

    // 全部新行加一个 row
    layout.push({
      id: nextRowId(),
      slots: [newSlot],
    })
  }

  function removeWidget(slotId: string) {
    const layout = layouts.value[currentDashboardId.value]
    if (!layout) return

    for (let i = 0; i < layout.length; i++) {
      const row = layout[i]
      const idx = row.slots.findIndex(s => s.id === slotId)
      if (idx >= 0) {
        row.slots.splice(idx, 1)
        // 空 row 延迟 200ms 删除（避免拖拽过程视觉跳跃）
        if (row.slots.length === 0) {
          setTimeout(() => {
            const cur = layouts.value[currentDashboardId.value]
            if (!cur) return
            const idx2 = cur.findIndex(r => r.id === row.id)
            if (idx2 >= 0 && cur[idx2].slots.length === 0) {
              cur.splice(idx2, 1)
            }
          }, 200)
        }
        return
      }
    }
  }

  // ===== 拖拽 / 重排 =====
  /**
   * 同行内换位（拖动到同 row 不同 index）
   */
  function reorderRow(rowId: string, newSlots: WidgetSlot[]) {
    const layout = layouts.value[currentDashboardId.value]
    if (!layout) return
    const row = layout.find(r => r.id === rowId)
    if (!row) return
    row.slots = newSlots
  }

  /**
   * 跨行移动（拖到另一行的指定 index）
   * @returns true=移动成功，false=拒绝（目标行满或参数无效）
   */
  function moveSlotToRow(slotId: string, toRowId: string, toIndex: number): boolean {
    const layout = layouts.value[currentDashboardId.value]
    if (!layout) return false

    const from = findRowAndSlot(slotId)
    if (!from) return false

    const toRow = layout.find(r => r.id === toRowId)
    if (!toRow) return false

    const slot = from.row.slots[from.slotIndex]
    if (!slot) return false

    // 同行内移动不校验容量（不会溢出）
    const isSameRow = from.row.id === toRowId
    if (!isSameRow && !canFit(toRow.slots, slot.size)) {
      return false
    }

    // 1. 从源 row 移除
    from.row.slots.splice(from.slotIndex, 1)

    // 2. 调整 toIndex（如果 from 在 to 之前，toIndex 需要 -1）
    let targetIndex = toIndex
    if (!isSameRow && from.rowIndex < layout.findIndex(r => r.id === toRowId)) {
      targetIndex = Math.max(0, toIndex - 1)
    }

    // 3. 插入目标 row
    const insertAt = Math.min(targetIndex, toRow.slots.length)
    toRow.slots.splice(insertAt, 0, slot)

    // 4. 源 row 空了 → 延迟删除
    if (from.row.slots.length === 0) {
      const emptyRow = from.row
      setTimeout(() => {
        const cur = layouts.value[currentDashboardId.value]
        if (!cur) return
        const idx = cur.findIndex(r => r.id === emptyRow.id)
        if (idx >= 0 && cur[idx].slots.length === 0) {
          cur.splice(idx, 1)
        }
      }, 200)
    }

    return true
  }

  /**
   * 修改 slot 的 size（用户点卡片 size 切换按钮）
   * 不会让本行溢出（自身本就是行内成员），故无需校验。
   * 若发现 sum>6（数据损坏），sanitizeLayout 会在下次启动兜底拆行。
   */
  function changeSlotSize(slotId: string, newSize: WidgetSlot['size']) {
    const layout = layouts.value[currentDashboardId.value]
    if (!layout) return
    const found = findRowAndSlot(slotId)
    if (!found) return
    found.row.slots[found.slotIndex] = { ...found.row.slots[found.slotIndex], size: newSize }
  }

  // ===== 持久化 =====
  function saveLayout() {
    const key = lsKey(currentDashboardId.value, currentRole.value)
    try {
      localStorage.setItem(key, JSON.stringify(currentLayout.value))
    } catch {
      // localStorage 不可用，静默失败
    }
    isEditing.value = false
  }

  function resetLayout() {
    const key = lsKey(currentDashboardId.value, currentRole.value)
    try {
      localStorage.removeItem(key)
    } catch {
      // 静默失败
    }
    initDashboard(currentDashboardId.value, currentRole.value)
    isEditing.value = false
  }

  function toggleEdit() {
    isEditing.value = !isEditing.value
  }

  return {
    layouts,
    isEditing,
    currentDashboardId,
    currentRole,
    currentLayout,
    currentPreset,
    availableToAdd,
    initDashboard,
    addWidget,
    removeWidget,
    reorderRow,
    moveSlotToRow,
    changeSlotSize,
    saveLayout,
    resetLayout,
    toggleEdit,
  }
})