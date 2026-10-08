<template>
  <div
    ref="shellRef"
    :class="['dashboard-shell', `dashboard-responsive--${responsiveLevel}`, { 'dashboard-edit-mode': isEditingRef }]"
  >
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
      :rows="currentLayout"
      :editable="isEditingRef"
      @reorder="onReorder"
      @slot-move="onSlotMove"
      @slot-remove="onRemove"
      @slot-size-change="onSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import type { WidgetType } from '@/config/widget-registry'
import type { WidgetSlot } from '@/config/dashboard-presets'
import { useResponsiveRows } from '@/composables/useResponsiveRows'
import DashboardToolbar from './DashboardToolbar.vue'
import WidgetGrid from './WidgetGrid.vue'

const props = defineProps<{
  dashboardId: string
  role: string
}>()

const store = useDashboardStore()
const { isEditing: isEditingRef, currentLayout, availableToAdd } = storeToRefs(store)
const preset = storeToRefs(store).currentPreset

const shellRef = ref<HTMLElement | null>(null)
const { level: responsiveLevel } = useResponsiveRows(shellRef)

function onToggleEdit() { isEditingRef.value = !isEditingRef.value }
function onSave() { store.saveLayout() }
function onReset() { store.resetLayout() }
function onAdd(type: WidgetType, size: WidgetSlot['size']) { store.addWidget(type, size) }
function onReorder(rowId: string, slots: WidgetSlot[]) { store.reorderRow(rowId, slots) }
function onSlotMove(slotId: string, toRowId: string, toIndex: number) {
  store.moveSlotToRow(slotId, toRowId, toIndex)
}
function onRemove(slotId: string) { store.removeWidget(slotId) }
function onSizeChange(slotId: string, size: WidgetSlot['size']) { store.changeSlotSize(slotId, size) }

onMounted(() => {
  store.initDashboard(props.dashboardId, props.role)
})
</script>

<style scoped>
.dashboard-shell {
  padding: var(--spacing-lg, 12px);
  width: 100%;
  min-width: 0;
}
</style>