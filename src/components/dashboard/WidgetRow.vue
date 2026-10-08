<template>
  <VueDraggable
    :model-value="props.row.slots"
    :group="{ name: 'widgets', pull: true, put: true }"
    :animation="200"
    :delay="50"
    :delay-on-touch-only="true"
    :disabled="!editable"
    class="widget-row"
    :data-row-id="row.id"
    @update:model-value="onSort"
    @add="onCrossRowAdd"
  >
    <WidgetCard
      v-for="slot in props.row.slots"
      :key="slot.id"
      :widget="slot"
      :editable="editable"
      :bare="slot.config?.bare === true"
      @remove="emit('slot-remove', slot.id)"
      @size-change="(s) => emit('slot-size-change', slot.id, s)"
    >
      <WidgetRenderer :type="slot.type" :widget-id="slot.id" :config="slot.config" />
    </WidgetCard>
  </VueDraggable>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { WidgetRow, WidgetSlot } from '@/config/dashboard-presets'
import WidgetCard from './WidgetCard.vue'
import WidgetRenderer from './WidgetRenderer.vue'

const props = defineProps<{
  row: WidgetRow
  editable: boolean
}>()

const emit = defineEmits<{
  /** 同 row 内换位（拖动一个 slot 在 row 内调换顺序） */
  'reorder': [rowId: string, slots: WidgetSlot[]]
  /** 跨 row 移动（从其他 row 拖入当前 row 的指定 index） */
  'move': [slotId: string, toRowId: string, toIndex: number]
  /** 移除 slot */
  'slot-remove': [slotId: string]
  /** 切换 slot size */
  'slot-size-change': [slotId: string, size: WidgetSlot['size']]
}>()

/**
 * 纯受控拖拽策略（不维护 localList）：
 *   - vue-draggable-plus 在 :model-value 模式下不会修改 modelValue 数组
 *   - SortableJS 拖拽后向父组件 emit update 事件
 *   - 父组件 store 修改 row.slots 后 props 触发响应式，DOM 自动 patch
 *   - 这样 props 始终是单一数据源，避免 v-model + watch 同步冲突
 */

/**
 * 同 row 内换位
 * SortableJS 已 patch DOM 但 modelValue 没改，emit 让 store 同步 row.slots
 */
function onSort(newList: WidgetSlot[]) {
  emit('reorder', props.row.id, [...newList])
}

/**
 * 跨 row 拖入
 * SortableJS 已 patch DOM，emit 让 store 做行满校验 + 移动；
 * 若 store 行满拒绝，store 不改 row.slots，Vue 响应式不触发新 patch，
 * SortableJS 的 DOM patch 会因 props 不变而保留 — 但下次 props 真正变化时已被覆盖。
 *
 * 视觉回弹方案：store 行满拒绝时由 WidgetGrid 层在 v-for key 变化时强制重渲染（key=row.id+slots.length）
 * 或 store.moveSlotToRow 返回 false 时 emit 一个 'reject' 事件让父级调 forceUpdate
 * 当前实现：依赖 store.moveSlotToRow 内部 splice 源 row（少一项）— 源 row 的 props 变 → 源 row 重渲染，
 *         自动撤回 SortableJS 的"在目标 row 添加"的 DOM patch（因为 props 没变）
 */
function onCrossRowAdd(e: { item?: HTMLElement; newIndex?: number }) {
  const slotId = e.item?.dataset?.slotId
  const toIndex = e.newIndex ?? 0
  if (slotId) {
    emit('move', slotId, props.row.id, toIndex)
  }
}
</script>

<style scoped>
/*
 * 单行容器：横向排列 widget 卡片，flex-wrap: nowrap（不允许自动换行）
 * 单行内 widget 总和 <= 6 单位，由 store.canFit 校验，超容拒绝
 *
 * gap: 16px — 与全站间距变量一致
 * min-width: 0 — flex 子项可压缩到 0（默认 auto min-width 会撑破窄屏）
 * align-items: stretch — widget 卡片高度对齐（统计卡 vs 图表卡高度不一致时统一拉伸）
 */
.widget-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  align-items: stretch;
  min-width: 0;
  width: 100%;
}

.widget-row:empty {
  /* 空 row 视觉占位（编辑模式下让 drop zone 可视） */
  min-height: 60px;
  border: 1px dashed transparent;
  border-radius: var(--radius-md, 8px);
}
.dashboard-edit-mode .widget-row:empty {
  border-color: var(--accent-primary);
  opacity: 0.5;
}
</style>