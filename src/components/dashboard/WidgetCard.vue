<template>
  <div :class="['widget-card', `size-${widget.size}`, { 'edit-mode': editable, bare }]" :data-slot-id="widget.id">
    <div class="widget-card-header">
      <span v-if="editable && !bare" class="drag-handle" title="拖拽排序">
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

      <!-- size 切换按钮（仅编辑模式 + 非 bare 显示） -->
      <div v-if="editable && !bare" class="size-switcher" @click.stop>
        <button
          v-for="opt in SIZE_OPTIONS"
          :key="opt.value"
          :class="['size-switcher-btn', { active: widget.size === opt.value }]"
          :title="opt.title"
          @click="onSizeClick(opt.value)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect v-for="r in opt.rects" :key="r.key" :x="r.x" :y="r.y" :width="r.w" :height="r.h" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>

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

const props = withDefaults(defineProps<{
  widget: WidgetSlot
  editable: boolean
  /** 裸卡模式：去掉外层背景和边框，仅保留内部子卡视觉（适用于「双指标统计卡」等多子卡平铺场景） */
  bare?: boolean
}>(), {
  bare: false,
})

const emit = defineEmits<{
  remove: []
  /** size 切换：用户点 ⊟⊞⊡ 按钮 */
  'size-change': [size: WidgetSlot['size']]
}>()

const widgetTitle = computed(() => {
  if (props.widget.config?.title) return props.widget.config.title
  return widgetLabels[props.widget.type as WidgetType] || props.widget.type
})

/** size 切换按钮定义（图标用矩形数量直观表达：1/3 / 2/2 / 1/1） */
const SIZE_OPTIONS: Array<{
  value: WidgetSlot['size']
  title: string
  rects: Array<{ key: string; x: number; y: number; w: number; h: number }>
}> = [
  // size:1 — 单个矩形占满（满行）
  {
    value: 1,
    title: '满行',
    rects: [{ key: 'a', x: 1, y: 2, w: 12, h: 10 }],
  },
  // size:2 — 两个矩形各占一半
  {
    value: 2,
    title: '半行',
    rects: [
      { key: 'a', x: 1, y: 2, w: 5, h: 10 },
      { key: 'b', x: 8, y: 2, w: 5, h: 10 },
    ],
  },
  // size:3 — 三个矩形各占 1/3
  {
    value: 3,
    title: '1/3 行',
    rects: [
      { key: 'a', x: 1, y: 2, w: 3, h: 10 },
      { key: 'b', x: 5.5, y: 2, w: 3, h: 10 },
      { key: 'c', x: 10, y: 2, w: 3, h: 10 },
    ],
  },
]

function onSizeClick(target: WidgetSlot['size']) {
  if (target === props.widget.size) return
  emit('size-change', target)
}
</script>

<style scoped>
.widget-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  transition: box-shadow .2s, border-color .2s, flex-basis .2s, flex-grow .2s;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 180px;
}
.widget-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/*
 * size 占用单位制（v3）：
 *   单行最多 6 单位。size:1=3 单位 / size:2=2 单位 / size:3=1 单位
 *
 * 视觉宽度 = 基础比例 × 当前屏宽单位数（maxUnits），由 .dashboard-responsive--{level} 控制。
 * 桌面端默认（level 0, 6 单位）：
 *   size:1 → 3/6 = 50% 基础 + flex-grow:3（多吃剩余空间）
 *   size:2 → 2/6 ≈ 33.33% 基础 + flex-grow:2
 *   size:3 → 1/6 ≈ 16.66% 基础 + flex-grow:1
 *
 * flex-grow 让 sum < 6 的行 stretch 满 100%（如 1+2=5 单位的两张卡，size:1 多吃一份变 60%，size:2 变 40%）。
 * 单行 sum=6 时无剩余空间，flex-grow 比例等于基础比例（即 50/33/17）。
 *
 * 跨 row 移动时，flex 比例不依赖子项数（widget > * { min-width: 0 } 在 row 容器处理），
 * 只取决于 widget 自身 size。
 */
.size-1 { flex: 3 1 50%; max-width: 100%; }
.size-2 { flex: 2 1 33.333%; max-width: 66.666%; }
.size-3 { flex: 1 1 16.666%; max-width: 33.333%; }

/*
 * 响应式降级（useResponsiveRows 控制 .dashboard-responsive--{level} 容器类）：
 *   level 1 (1024-1399px)：maxUnits=4，size 基础宽度按比例缩（×4/6）
 *   level 2 (<1024px)：maxUnits=2，size 基础宽度按比例缩（×2/6）
 *
 * 在窄屏下 size-3 的卡会变得很窄（≈8%），由用户决定是否拖走 / 切换 size。
 */
.dashboard-responsive--1 .size-1 { flex-basis: 75%; flex-grow: 3; }
.dashboard-responsive--1 .size-2 { flex-basis: 50%; flex-grow: 2; }
.dashboard-responsive--1 .size-3 { flex-basis: 25%; flex-grow: 1; }

.dashboard-responsive--2 .size-1 { flex-basis: 100%; flex-grow: 2; }
.dashboard-responsive--2 .size-2 { flex-basis: 66.666%; flex-grow: 1.333; }
.dashboard-responsive--2 .size-3 { flex-basis: 33.333%; flex-grow: 0.666; }

/* 裸卡模式：去掉外层背景/边框/圆角/标题/内边距，让内部子卡直接平铺于父容器背景之上 */
.widget-card.bare {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  min-height: 0;
}
.widget-card.bare:hover {
  box-shadow: none;
}
.widget-card.bare .widget-card-header {
  padding: 0;
  min-height: 0;
}
.widget-card.bare .widget-card-title {
  display: none;
}
.widget-card.bare .widget-card-body {
  padding: 0;
}

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

/* size 切换按钮组 */
.size-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.size-switcher-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  color: var(--text-placeholder);
  transition: all .15s;
}
.size-switcher-btn:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.size-switcher-btn.active {
  color: var(--accent-primary);
  background: var(--accent-primary10, rgba(24, 144, 255, 0.1));
  border-color: var(--accent-primary);
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