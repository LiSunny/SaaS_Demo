<template>
  <div class="dashboard-shell">
    <DashboardToolbar
      :key="'toolbar-' + isEditingRef"
      :title="preset?.label || '仪表盘'"
      :editable="isEditingRef"
      :available-count="availableToAdd.length"
      :available-types="availableToAdd"
      @edit="onToggleEdit"
      @save="onSave"
      @reset="onReset"
      @add="onAdd"
    />

    <WidgetGrid
      :key="'grid-' + isEditingRef"
      :widgets="currentLayout"
      :editable="isEditingRef"
      @update:order="onReorder"
      @remove="onRemove"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import type { WidgetType } from '@/config/widget-registry'
import type { WidgetSlot } from '@/config/dashboard-presets'
import DashboardToolbar from './DashboardToolbar.vue'
import WidgetGrid from './WidgetGrid.vue'

const props = defineProps<{
  dashboardId: string
  role: string
}>()

const store = useDashboardStore()
const { isEditing: isEditingRef, currentLayout, availableToAdd } = storeToRefs(store)
const preset = computed(() => store.currentPreset)

function onToggleEdit() { isEditingRef.value = !isEditingRef.value }
function onSave() { store.saveLayout() }
function onReset() { store.resetLayout() }
function onAdd(type: WidgetType) { store.addWidget(type) }
function onReorder(widgets: WidgetSlot[]) { store.reorderWidgets(widgets) }
function onRemove(widgetId: string) { store.removeWidget(widgetId) }

onMounted(() => {
  store.initDashboard(props.dashboardId, props.role)
})
</script>

<style scoped>
.dashboard-shell {
  padding: var(--spacing-lg, 12px);
}
</style>
