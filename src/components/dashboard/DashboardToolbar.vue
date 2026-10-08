<template>
  <div class="dashboard-toolbar">
    <div class="toolbar-left">
      <h3 class="toolbar-title">{{ title }}</h3>
    </div>
    <div class="toolbar-right">
      <template v-if="editable">
        <div class="add-widget-wrap">
          <button class="btn-add-widget" @click="addPopoverVisible = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            添加组件
          </button>
          <div v-if="addPopoverVisible" class="widget-pool-popover" @click.stop>
            <div class="widget-pool">
              <p class="widget-pool-title">可用组件（{{ availableCount }}）</p>
              <div class="widget-pool-grid">
                <button
                  v-for="t in availableTypes"
                  :key="t"
                  class="widget-pool-item"
                  @click="selectWidget(t)"
                >
                  <span class="pool-item-icon">{{ getIcon(t) }}</span>
                  <span class="pool-item-label">{{ getLabel(t) }}</span>
                </button>
              </div>
              <p v-if="availableTypes.length === 0" class="widget-pool-empty">所有可用组件已添加</p>

              <!-- 插入宽度选择（v3 新增） -->
              <div class="widget-pool-size">
                <span class="pool-size-label">插入宽度</span>
                <div class="pool-size-options">
                  <button
                    v-for="opt in SIZE_OPTIONS"
                    :key="opt.value"
                    :class="['pool-size-btn', { active: selectedSize === opt.value }]"
                    :title="opt.title"
                    @click="selectedSize = opt.value"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect
                        v-for="r in opt.rects"
                        :key="r.key"
                        :x="r.x" :y="r.y" :width="r.w" :height="r.h" rx="1"
                        fill="currentColor"
                      />
                    </svg>
                    <span class="pool-size-text">{{ opt.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn-save-layout" @click="$emit('save')">保存布局</button>
        <button class="btn-reset-layout" @click="$emit('reset')">恢复默认</button>
      </template>
      <button v-else class="btn-edit-layout" @click="onEdit">编辑布局</button>
    </div>
  </div>
  <!-- 点击外部关闭组件池 -->
  <div v-if="addPopoverVisible" class="pool-backdrop" @click="addPopoverVisible = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { WidgetType } from '@/config/widget-registry'
import { widgetLabels } from '@/config/widget-registry'
import type { WidgetSlot } from '@/config/dashboard-presets'

defineProps<{
  title: string
  editable: boolean
  availableCount: number
  availableTypes: WidgetType[]
}>()

const emit = defineEmits<{
  edit: []
  save: []
  reset: []
  /** v3：添加组件时携带 size（弹窗 Radio 选定） */
  add: [type: WidgetType, size: WidgetSlot['size']]
}>()

const addPopoverVisible = ref(false)

/** 插入宽度选择（默认 大=size:1 满行） */
const selectedSize = ref<WidgetSlot['size']>(1)

const SIZE_OPTIONS: Array<{
  value: WidgetSlot['size']
  label: string
  title: string
  rects: Array<{ key: string; x: number; y: number; w: number; h: number }>
}> = [
  // size:3 — 1/3 行（小）
  {
    value: 3,
    label: '小',
    title: '1/3 行宽（同行可放 3 个）',
    rects: [
      { key: 'a', x: 1, y: 3, w: 4, h: 10 },
      { key: 'b', x: 6, y: 3, w: 4, h: 10 },
      { key: 'c', x: 11, y: 3, w: 4, h: 10 },
    ],
  },
  // size:2 — 半行（中）
  {
    value: 2,
    label: '中',
    title: '半行宽（同行可放 2 个）',
    rects: [
      { key: 'a', x: 1, y: 3, w: 6, h: 10 },
      { key: 'b', x: 9, y: 3, w: 6, h: 10 },
    ],
  },
  // size:1 — 满行（大，默认）
  {
    value: 1,
    label: '大',
    title: '满行宽（同行仅放 1 个）',
    rects: [
      { key: 'a', x: 1, y: 3, w: 14, h: 10 },
    ],
  },
]

function onEdit() { emit('edit') }

function selectWidget(type: WidgetType) {
  addPopoverVisible.value = false
  emit('add', type, selectedSize.value)
}

function getLabel(type: WidgetType): string {
  return widgetLabels[type] || type
}

function getIcon(type: WidgetType): string {
  const iconMap: Record<string, string> = {
    'order-overview': '📋',
    'sla-overview': '⏱',
    'create-order': '➕',
    'plan-status': '📅',
    placeholder: '📦',
  }
  return iconMap[type] || '📌'
}
</script>

<style scoped>
.dashboard-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.toolbar-title {
  margin: 0;
  font-size: var(--font-h2, 20px);
  font-weight: 600;
  color: var(--text-primary);
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 按钮 */
.btn-edit-layout,
.btn-add-widget {
  background: none;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  padding: 6px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all .15s;
}
.btn-edit-layout:hover,
.btn-add-widget:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.btn-save-layout {
  background: var(--accent-primary);
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: var(--radius-sm, 6px);
  font-size: 13px;
  cursor: pointer;
}
.btn-save-layout:hover {
  opacity: 0.9;
}
.btn-reset-layout {
  background: none;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  padding: 6px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}
.btn-reset-layout:hover {
  border-color: #e54848;
  color: #e54848;
}

/* 组件池弹出 */
.add-widget-wrap {
  position: relative;
}
.widget-pool-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 16px;
  min-width: 320px;
}
.widget-pool-title {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--text-secondary);
}
.widget-pool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.widget-pool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  background: none;
  cursor: pointer;
  transition: all .15s;
}
.widget-pool-item:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}
.pool-item-icon {
  font-size: 20px;
}
.pool-item-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.widget-pool-empty {
  text-align: center;
  color: var(--text-placeholder);
  font-size: 13px;
  margin: 12px 0 0;
}

/* 插入宽度选择（v3 新增） */
.widget-pool-size {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
}
.pool-size-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.pool-size-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.pool-size-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
  transition: all .15s;
}
.pool-size-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.pool-size-btn.active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--accent-primary10, rgba(24, 144, 255, 0.1));
  font-weight: 500;
}
.pool-size-text {
  font-size: 12px;
}

/* 点击外部关闭 */
.pool-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}
</style>