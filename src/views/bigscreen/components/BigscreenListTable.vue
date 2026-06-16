<template>
  <div class="bs-list-table">
    <!-- 表头（Figma: bg #0457a7, text #aedaff） -->
    <div class="bs-header">
      <div
        v-for="col in columns"
        :key="col.key"
        class="bs-header-cell"
        :style="col.width ? { flex: `0 0 ${col.width}`, minWidth: col.width } : {}"
      >
        {{ col.label }}
      </div>
    </div>

    <!-- 数据行（Figma: 交替斑马纹 rgba(0,73,142,0.14)） -->
    <div
      v-for="(row, i) in rows"
      :key="rowKey ? row[rowKey] : i"
      class="bs-row"
      :class="{ 'bs-row-stripe': i % 2 === 1 }"
    >
      <div
        v-for="col in columns"
        :key="col.key"
        class="bs-cell"
        :style="col.width ? { flex: `0 0 ${col.width}`, minWidth: col.width } : {}"
      >
        <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="i">
          {{ row[col.key] }}
        </slot>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!rows || rows.length === 0" class="bs-empty">
      暂无数据
    </div>
  </div>
</template>

<script setup lang="ts">
export interface BsColumn {
  /** 列标识（对应 row 的字段名，也用于 slot 名 cell-{key}） */
  key: string
  /** 列表头文字 */
  label: string
  /** 可选固定宽度（CSS 值，如 "90px" 或 "calc(90 * var(--w))"），不设则等分 */
  width?: string
}

defineProps<{
  columns: BsColumn[]
  rows: Record<string, any>[]
  /** 行唯一键字段名，用于 v-for key；不传则用 index */
  rowKey?: string
}>()
</script>

<style scoped>
.bs-list-table {
  width: 100%;
  overflow: hidden;
}

/* ===== 表头（Figma: bg #0457a7, text #aedaff, 16px） ===== */
.bs-header {
  display: flex;
  align-items: center;
  background: #0457a7;
}

.bs-header-cell {
  flex: 1 0 0;
  min-width: 0;
  padding: calc(10 * var(--h)) calc(8 * var(--w));
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(8px, calc(12 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #aedaff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 数据行（Figma: text #f1f1f1, 16px） ===== */
.bs-row {
  display: flex;
  align-items: center;
}

.bs-row-stripe {
  background: rgba(0, 73, 142, 0.14);
}

.bs-cell {
  flex: 1 0 0;
  min-width: 0;
  padding: calc(10 * var(--h)) calc(8 * var(--w));
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(8px, calc(12 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #f1f1f1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 空状态 ===== */
.bs-empty {
  padding: calc(24 * var(--h)) calc(8 * var(--w));
  text-align: center;
  font-size: clamp(8px, calc(12 * var(--min-scale)), 16px);
  color: rgba(255, 255, 255, 0.3);
}
</style>
