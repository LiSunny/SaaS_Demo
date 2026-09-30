<template>
  <div class="shortcuts-grid-widget">
    <div
      v-if="items.length > 0"
      class="shortcuts-grid"
      :style="gridStyle"
    >
      <button
        v-for="item in items"
        :key="item.key"
        :class="['shortcut-item', { 'is-disabled': !isReady(item) }]"
        :disabled="!isReady(item)"
        @click="navigate(item)"
      >
        <!--
          图标：项目 MenuIcon-*-白色 SVG（命名虽"白色"，实际 fill=#505968 黑色）。
          7 个图标已用 Figma Frame 661 精确路径覆盖。
        -->
        <img
          v-if="item.icon"
          :src="`/icons/${item.icon}.svg`"
          class="shortcut-icon"
          :alt="item.label"
        />
        <span v-else class="shortcut-icon shortcut-icon-block" aria-hidden="true" />
        <span class="shortcut-label">{{ item.label }}</span>
      </button>
    </div>
    <div v-else class="empty-state">暂无入口</div>
  </div>
</template>

<script setup lang="ts">
// 应用入口 widget（Figma Frame 661 "常用功能" 1:1 复刻）
//
// 整体结构（精确值）：
//   外层卡片 + 标题"常用功能" 由 WidgetCard 提供，不在本 widget 重复。
//   列表容器：4 行 × 2 列（grid）
//     列间距 12px，行间距 6px
//   单条菜单：
//     bg #FBFBFB（var(--background/card)）
//     padding 10px
//     border-radius 8px
//     flex 1（行高自适应均分 4 行）
//     gap 10px（icon ↔ 文字）
//     align center / justify center
//     icon 24×24
//     文字 18px Medium / #505968 / flex:1
//
// 图标：7 个 MenuIcon 已用 Figma Frame 661 精确路径覆盖（建筑/重点部位/相关方/
//      上下级/人员/权限/岗位）；"管理单元"保留项目已有版本。
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Shortcut, ShortcutsGridConfig } from './types'
import { shortcutsGridMock } from './_mocks/shortcuts-grid.mock'

defineProps<{
  widgetId: string
  config?: ShortcutsGridConfig
}>()

const router = useRouter()

const items = computed<Shortcut[]>(() => shortcutsGridMock.items)
const columns = computed<number>(() => shortcutsGridMock.columns ?? 2)
const rows = computed<number | undefined>(() => shortcutsGridMock.rows)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
}))

function isReady(item: Shortcut): boolean {
  return item.ready !== false && !!item.route
}

function navigate(item: Shortcut) {
  if (!isReady(item)) return
  router.push(item.route!)
}
</script>

<style scoped>
.shortcuts-grid-widget {
  width: 100%;
  height: 100%;
}

/* 4 行 × 2 列 网格（设计稿） */
.shortcuts-grid {
  display: grid;
  grid-auto-flow: column; /* 按列填充：先填满左列 4 行，再填右列 4 行 */
  grid-template-rows: repeat(4, 1fr);
  gap: 6px 12px; /* 设计稿 row-gap 6 / column-gap 12 */
  width: 100%;
  height: 100%;
}

/* 单条菜单 */
.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #FBFBFB; /* var(--background/card) */
  cursor: pointer;
  transition: background .15s, transform .15s;
  min-height: 0;
}
.shortcut-item:hover:not(.is-disabled) {
  background: #f0f3f9; /* hover 加深一档 */
}
.shortcut-item:active:not(.is-disabled) {
  transform: scale(0.99);
}
.shortcut-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.shortcut-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: block;
}
.shortcut-icon-block {
  background: var(--border-default, #DEDEDE);
  border-radius: 4px;
}

.shortcut-label {
  flex: 1 1 0;
  min-width: 0;
  font-size: 18px;
  font-weight: 500; /* Medium */
  color: #505968;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-placeholder);
  font-size: 14px;
}
</style>