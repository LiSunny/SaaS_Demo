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
  { key: 'device',    label: '设备设施管理', icon: '🏭', route: '/device-facility/ledger', ready: true },
  { key: 'inspect',   label: '巡查检查',     icon: '🔍', route: '/unit/patrol',             ready: true },
  { key: 'risk',      label: '隐患排查治理', icon: '⚠',  route: '/unit/hazards',            ready: true },
  { key: 'remote',    label: '值守与应急',   icon: '📡', route: '/unit/duty',               ready: true },
  { key: 'maintain',  label: '消防维保',     icon: '🔧', route: '/unit/maintenance',        ready: true },
  { key: 'special',   label: '特种作业管理', icon: '🔥', route: '/unit/special-work',       ready: true },
  { key: 'training',  label: '培训与演练',   icon: '📘', route: '/unit/training',           ready: true },
  { key: 'archive',   label: '安全档案',     icon: '🗂',  route: '/unit/safety-archive',      ready: true },
  { key: 'project',   label: '项目管理',     icon: '🏗',  route: '/unit/projects',           ready: true },
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
