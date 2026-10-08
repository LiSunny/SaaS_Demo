<template>
  <div class="widget-grid" :data-row-count="rows.length">
    <WidgetRow
      v-for="row in rows"
      :key="row.id"
      :row="row"
      :editable="editable"
      @reorder="onReorder"
      @move="onSlotMove"
      @slot-remove="onSlotRemove"
      @slot-size-change="onSlotSizeChange"
    />
    <div v-if="rows.length === 0" class="grid-empty">
      <span class="grid-empty-text">暂无组件，点击"添加组件"开始配置</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WidgetRow as RowData, WidgetSlot } from '@/config/dashboard-presets'
import WidgetRow from './WidgetRow.vue'

defineProps<{
  rows: RowData[]
  editable: boolean
}>()

const emit = defineEmits<{
  /** 同 row 内换位 */
  'reorder': [rowId: string, slots: WidgetSlot[]]
  /** 跨 row 移动 */
  'slot-move': [slotId: string, toRowId: string, toIndex: number]
  /** 移除 slot */
  'slot-remove': [slotId: string]
  /** 切换 slot size */
  'slot-size-change': [slotId: string, size: WidgetSlot['size']]
}>()

function onReorder(rowId: string, slots: WidgetSlot[]) {
  emit('reorder', rowId, slots)
}
function onSlotMove(slotId: string, toRowId: string, toIndex: number) {
  emit('slot-move', slotId, toRowId, toIndex)
}
function onSlotRemove(slotId: string) {
  emit('slot-remove', slotId)
}
function onSlotSizeChange(slotId: string, size: WidgetSlot['size']) {
  emit('slot-size-change', slotId, size)
}
</script>

<style scoped>
/*
 * v3 垂直行式布局：每个 WidgetRow 是独立的水平 flex 容器，
 * 多 row 垂直堆叠成网格。
 *
 * gap: 16px — row 间垂直间距
 * width: 100% — 占满容器宽度，让子 row 内部 flex 自然填充
 */
.widget-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

/*
 * 空状态（首次进入 + 已删除全部 widget）
 */
.grid-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.grid-empty-text {
  color: var(--text-placeholder);
  font-size: 14px;
}
</style>