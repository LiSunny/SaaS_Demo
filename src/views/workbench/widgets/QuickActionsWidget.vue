<template>
  <div class="quick-actions-widget">
    <div class="actions-grid">
      <button
        v-for="action in availableActions"
        :key="action.key"
        class="action-item"
        @click="trigger(action.key)"
      >
        <span class="action-icon">{{ action.icon }}</span>
        <span class="action-label">{{ action.label }}</span>
      </button>
    </div>
    <CreateOrderDialog v-model:visible="createDialogVisible" @created="onCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CreateOrderDialog from '@/components/business/CreateOrderDialog.vue'

defineProps<{
  widgetId: string
  config?: Record<string, any>
}>()

const createDialogVisible = ref(false)

interface QuickAction {
  key: string
  label: string
  icon: string
  module: string
  ready: boolean
}

const allActions: QuickAction[] = [
  { key: 'create-order',  label: '发起工单', icon: '📋', module: '工单管理', ready: true },
  { key: 'report-hazard', label: '上报隐患', icon: '⚠',  module: '隐患管理', ready: false },
  { key: 'create-plan',   label: '创建维保计划', icon: '📅', module: '维保管理', ready: false },
]

const availableActions = computed(() => allActions.filter(a => a.ready))

function trigger(key: string) {
  switch (key) {
    case 'create-order':
      createDialogVisible.value = true
      break
    // 后续追加更多操作
  }
}

function onCreated() {
  createDialogVisible.value = false
}
</script>

<style scoped>
.quick-actions-widget {
  padding: 4px 0;
}
.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  background: none;
  cursor: pointer;
  transition: all .15s;
  text-align: left;
}
.action-item:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}
.action-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.action-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}
</style>
