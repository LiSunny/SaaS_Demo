import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardPresets, DEFAULT_ROLE, type WidgetSlot } from '@/config/dashboard-presets'

const LS_VERSION = 'v2'
const LS_PREFIX = 'dashboard:'

function lsKey(dashboardId: string, role: string): string {
  return `${LS_PREFIX}${LS_VERSION}:${dashboardId}:${role}`
}

export const useDashboardStore = defineStore('dashboard', () => {
  // ===== 状态 =====
  const layouts = ref<Record<string, WidgetSlot[]>>({})
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
    const addedTypes = new Set(currentLayout.value.map(w => w.type))
    return currentPreset.value.availableWidgets.filter(t => !addedTypes.has(t))
  })

  // ===== 方法 =====
  function initDashboard(dashboardId: string, role: string) {
    currentDashboardId.value = dashboardId
    currentRole.value = role
    isEditing.value = false

    const key = lsKey(dashboardId, role)
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as WidgetSlot[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          layouts.value[dashboardId] = parsed
          return
        }
      }
    } catch {
      // localStorage 不可用或数据损坏，使用默认布局
    }

    // 加载角色默认布局
    const preset = dashboardPresets[dashboardId]
    const defaults = preset?.roleDefaults[role] || preset?.roleDefaults[DEFAULT_ROLE] || []
    layouts.value[dashboardId] = [...defaults].sort((a, b) => a.order - b.order)
  }

  function addWidget(type: WidgetSlot['type']) {
    const layout = layouts.value[currentDashboardId.value]
    if (!layout) return

    // 某些 Widget 类型只能添加一次
    const maxOrder = layout.reduce((max, w) => Math.max(max, w.order), 0)
    const id = `${currentDashboardId.value}-${Date.now()}`
    layout.push({
      id,
      type,
      size: 1,
      order: maxOrder + 1,
    })
  }

  function removeWidget(widgetId: string) {
    const layout = layouts.value[currentDashboardId.value]
    if (!layout) return
    const idx = layout.findIndex(w => w.id === widgetId)
    if (idx > -1) layout.splice(idx, 1)
  }

  function reorderWidgets(newOrder: WidgetSlot[]) {
    layouts.value[currentDashboardId.value] = newOrder.map((w, i) => ({
      ...w,
      order: i,
    }))
  }

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
    reorderWidgets,
    saveLayout,
    resetLayout,
    toggleEdit,
  }
})
