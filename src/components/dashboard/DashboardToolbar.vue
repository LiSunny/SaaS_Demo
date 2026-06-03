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
  add: [type: WidgetType]
}>()

const addPopoverVisible = ref(false)

function onEdit() { emit('edit') }

function selectWidget(type: WidgetType) {
  addPopoverVisible.value = false
  emit('add', type)
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

/* 点击外部关闭 */
.pool-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}
</style>
