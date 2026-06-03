<template>
  <VueDraggable
    v-model="localList"
    :animation="200"
    :delay="50"
    :delay-on-touch-only="true"
    :disabled="!editable"
    ghost-class="widget-ghost"
    drag-class="widget-drag"
    handle=".drag-handle"
    class="widget-grid"
    @update:model-value="onDragEnd"
  >
    <WidgetCard
      v-for="element in localList"
      :key="element.id"
      :widget="element"
      :editable="editable"
      @remove="emit('remove', element.id)"
    >
      <WidgetRenderer
        :type="element.type"
        :widget-id="element.id"
        :config="element.config"
      />
    </WidgetCard>
  </VueDraggable>
  <div v-if="widgets.length === 0" class="grid-empty">
    <span class="grid-empty-text">暂无组件，点击"添加组件"开始配置</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { WidgetSlot } from '@/config/dashboard-presets'
import WidgetCard from './WidgetCard.vue'
import WidgetRenderer from './WidgetRenderer.vue'

const props = defineProps<{
  widgets: WidgetSlot[]
  editable: boolean
}>()

const emit = defineEmits<{
  'update:order': [widgets: WidgetSlot[]]
  'remove': [widgetId: string]
}>()

const localList = ref<WidgetSlot[]>([...props.widgets])

// Only sync when widget IDs differ (add/remove), NOT on reorder
watch(() => props.widgets.map(w => w.id).join(','), () => {
  localList.value = [...props.widgets]
})

function onDragEnd() {
  emit('update:order', [...localList.value])
}
</script>

<style scoped>
.widget-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: stretch;
}

:deep(.widget-ghost) {
  opacity: 0.3;
  border: 2px dashed var(--accent-primary) !important;
}
:deep(.widget-drag) {
  opacity: 0.85;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  transform: scale(1.02);
}

.grid-empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.grid-empty-text {
  color: var(--text-placeholder);
  font-size: 14px;
}

@media (max-width: 1439px) {
  .widget-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 1023px) {
  .widget-grid { grid-template-columns: repeat(1, 1fr); }
}
</style>
