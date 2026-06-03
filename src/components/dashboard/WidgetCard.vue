<template>
  <div :class="['widget-card', `size-${widget.size}`, { 'edit-mode': editable }]">
    <div class="widget-card-header">
      <span v-if="editable" class="drag-handle" title="拖拽排序">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="19" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="19" r="1.5" fill="currentColor"/>
        </svg>
      </span>
      <span class="widget-card-title">
        <slot name="title">{{ widgetTitle }}</slot>
      </span>
      <button v-if="editable" class="remove-btn" title="移除组件" @click.stop="$emit('remove')">×</button>
    </div>
    <div class="widget-card-body">
      <slot />
    </div>
    <div v-if="editable" class="widget-card-overlay" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WidgetSlot } from '@/config/dashboard-presets'
import { widgetLabels, type WidgetType } from '@/config/widget-registry'

const props = defineProps<{
  widget: WidgetSlot
  editable: boolean
}>()

defineEmits<{
  remove: []
}>()

const widgetTitle = computed(() => {
  if (props.widget.config?.title) return props.widget.config.title
  return widgetLabels[props.widget.type as WidgetType] || props.widget.type
})
</script>

<style scoped>
.widget-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  transition: box-shadow .2s, border-color .2s;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 180px;
}
.widget-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.size-1 { grid-column: span 1; }
.size-2 { grid-column: span 2; }
.size-3 { grid-column: span 3; }

.widget-card.edit-mode {
  border-color: var(--accent-primary);
  border-style: dashed;
}
.widget-card.edit-mode .widget-card-body {
  opacity: 0.6;
  pointer-events: none;
}

.widget-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px 0;
  min-height: 36px;
  position: relative;
  z-index: 2;
}
.drag-handle {
  cursor: grab;
  color: var(--text-placeholder);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.drag-handle:active {
  cursor: grabbing;
}
.widget-card-title {
  flex: 1;
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1;
  padding: 0 4px;
  flex-shrink: 0;
  border-radius: 4px;
}
.remove-btn:hover {
  background: rgba(229, 72, 72, 0.1);
  color: #e54848;
}

.widget-card-body {
  padding: 12px 16px 16px;
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.widget-card-overlay {
  display: none;
}
.widget-card.edit-mode .widget-card-overlay {
  display: block;
  position: absolute;
  inset: 0;
  z-index: 1;
  cursor: default;
}
</style>
