<template>
  <EbikeV2Card :title="title" class="list-panel">
    <!-- 筛选条：只出维度框架，数据接入前不联动 -->
    <div class="list-panel__toolbar">
      <span v-for="f in filters" :key="f" class="list-panel__filter">
        {{ f }}
        <i class="list-panel__caret" />
      </span>

      <slot name="toolbar" />

      <span class="list-panel__search">
        <i class="list-panel__search-icon" />
        <span class="list-panel__search-text">{{ searchPlaceholder }}</span>
      </span>
    </div>

    <!-- 表头 -->
    <div class="list-panel__head">
      <span
        v-for="c in columns"
        :key="c.label"
        class="list-panel__th"
        :style="{ flex: c.flex }"
      >
        {{ c.label }}
      </span>
    </div>

    <!-- 数据区：待接入 -->
    <div class="list-panel__body">
      <span class="list-panel__empty">{{ emptyText }}</span>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 主区列表面板
 *
 * 骨架形态：筛选条 + 表头 + 空数据区。
 * 数据源接入前，表头与筛选维度固定，行为留空。
 */
import EbikeV2Card from './EbikeV2Card.vue'

interface ListColumn {
  label: string
  /** 该列在表头中的宽度占比 */
  flex: number
}

withDefaults(
  defineProps<{
    /** 面板标题 */
    title: string
    /** 表头列 */
    columns: ListColumn[]
    /** 筛选维度（只出标签） */
    filters?: string[]
    /** 搜索框占位文案 */
    searchPlaceholder?: string
    /** 空数据区文案 */
    emptyText?: string
  }>(),
  {
    filters: () => [],
    searchPlaceholder: '搜索关键字',
    emptyText: '数据待接入',
  },
)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.list-panel {
  height: 100%;
}

/* 卡片内容区改为纵向排列：筛选条 / 表头 / 数据区依次落位 */
.list-panel :deep(.v2-card__body) {
  display: flex;
  flex-direction: column;
}

/* 筛选条 */
.list-panel__toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vh(10) vw(14) vh(6);
}

.list-panel__filter {
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  height: vh(30);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.42);
  color: var(--fire-text-label);
  font-size: 14px;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* 下拉箭头（静态：筛选项未接入） */
.list-panel__caret {
  width: 0;
  height: 0;
  border-left: vw(4) solid transparent;
  border-right: vw(4) solid transparent;
  border-top: vh(5) solid rgba(169, 201, 234, 0.75);
}

/* 搜索框（静态） */
.list-panel__search {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: vw(8);
  width: vw(220);
  height: vh(30);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 30, 68, 0.5);
}

.list-panel__search-icon {
  width: vw(12);
  height: vw(12);
  border: 1px solid rgba(143, 176, 216, 0.8);
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    right: vw(-4);
    bottom: vw(-3);
    width: vw(5);
    height: 1px;
    background: rgba(143, 176, 216, 0.8);
    transform: rotate(45deg);
  }
}

.list-panel__search-text {
  font-size: 14px;
  color: var(--fire-text-dim);
}

/* 表头 */
.list-panel__head {
  flex-shrink: 0;
  display: flex;
  gap: vw(12);
  margin: 0 vw(14);
  padding: 0 vw(12);
  height: vh(38);
  align-items: center;
  border-bottom: 1px solid rgba(120, 190, 255, 0.18);
}

.list-panel__th {
  font-size: 14px;
  color: var(--fire-text-title);
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 数据区 */
.list-panel__body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-panel__empty {
  font-size: 14px;
  color: var(--fire-text-dim);
  letter-spacing: 1px;
}
</style>
