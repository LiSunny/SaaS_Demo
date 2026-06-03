<template>
  <div class="app-shortcuts-widget">
    <div class="shortcuts-grid">
      <button
        v-for="app in apps"
        :key="app.key"
        class="shortcut-item"
        @click="navigate(app)"
      >
        <span class="shortcut-icon">{{ app.icon }}</span>
        <span class="shortcut-label">{{ app.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  widgetId: string
  config?: Record<string, any>
}>()

const router = useRouter()

interface AppShortcut {
  key: string
  label: string
  icon: string
  route: string
  ready: boolean
}

const apps = computed<AppShortcut[]>(() => [
  { key: 'device',    label: '设备管理', icon: '🏭', route: '/maintenance/plans', ready: true },
  { key: 'inspect',   label: '巡查检查', icon: '🔍', route: '',                    ready: false },
  { key: 'remote',    label: '远程值守', icon: '📡', route: '',                    ready: false },
  { key: 'maintain',  label: '维保应用', icon: '🔧', route: '/maintenance/plans', ready: true },
  { key: 'risk',      label: '隐患管理', icon: '⚠',  route: '',                    ready: false },
  { key: 'system',    label: '系统管理', icon: '⚙',  route: '/system/dashboard',  ready: true },
])

function navigate(app: AppShortcut) {
  if (app.ready && app.route) {
    router.push(app.route)
  }
}
</script>

<style scoped>
.app-shortcuts-widget {
  padding: 4px 0;
}
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  background: none;
  cursor: pointer;
  transition: all .15s;
}
.shortcut-item:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
  transform: translateY(-1px);
}
.shortcut-item:active {
  transform: translateY(0);
}
.shortcut-icon {
  font-size: 24px;
}
.shortcut-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}
</style>
