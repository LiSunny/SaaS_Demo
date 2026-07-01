<template>
  <div v-if="currentPosition" class="position-switcher">
    <button class="ps-trigger" @click="open = !open">
      <span class="ps-org">{{ currentPosition.orgName }}</span>
      <span class="ps-sep">·</span>
      <span class="ps-name">{{ currentPosition.name }}</span>
      <svg class="ps-chevron" :class="{ rotated: open }" width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <Teleport to="body">
      <div v-if="open" class="ps-overlay" @click="open = false" />
      <div v-if="open" class="ps-dropdown" @click.stop>
        <div
          v-for="group in orgGroups"
          :key="group.name"
          class="ps-group"
        >
          <div class="ps-group-label">{{ group.name }}</div>
          <button
            v-for="pos in group.positions"
            :key="pos.key"
            :class="['ps-option', { active: pos.key === currentPosition.key }]"
            @click="select(pos.key)"
          >
            <span class="ps-option-name">{{ pos.name }}</span>
            <span class="ps-option-user">{{ pos.user.name }}</span>
            <span v-if="pos.key === currentPosition.key" class="ps-check">✓</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { groupPositionsByOrg, type PositionKey } from '@/config/positions'

const userStore = useUserStore()
const open = ref(false)

const currentPosition = computed(() => userStore.currentPosition!)
const orgGroups = computed(() => groupPositionsByOrg())

function select(key: PositionKey): void {
  userStore.switchPosition(key)
  open.value = false
}
</script>

<style scoped>
.position-switcher {
  position: relative;
  flex-shrink: 0;
}

.ps-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-sub-card);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  transition: border-color .15s, background .15s;
  white-space: nowrap;
}
.ps-trigger:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}

.ps-org {
  color: var(--text-muted);
  font-size: var(--font-xs, 12px);
}
.ps-sep {
  color: var(--text-placeholder);
}
.ps-name {
  font-weight: 500;
  color: var(--text-primary);
}

.ps-chevron {
  transition: transform .2s;
  color: var(--text-muted);
  margin-left: 2px;
}
.ps-chevron.rotated {
  transform: rotate(180deg);
}

/* ===== 下拉面板 ===== */
.ps-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}
.ps-dropdown {
  position: fixed;
  top: 52px;
  right: 100px;
  z-index: 1000;
  width: 280px;
  max-height: 480px;
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-high);
  border-radius: var(--radius-lg, 10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: var(--spacing-md, 8px);
}

/* ===== 分组 ===== */
.ps-group + .ps-group {
  margin-top: var(--spacing-xs, 4px);
}
.ps-group + .ps-group::before {
  content: '';
  display: block;
  border-top: 1px solid var(--border-low);
  margin: 0 8px var(--spacing-xs, 4px);
}

.ps-group-label {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  padding: 4px 10px 2px;
  font-weight: 500;
}

/* ===== 选项 ===== */
.ps-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-sm, 6px);
  font-family: inherit;
  font-size: var(--font-small, 14px);
  text-align: left;
  transition: background .15s;
}
.ps-option:hover {
  background: var(--accent-primary10);
}
.ps-option.active {
  background: var(--accent-primary10);
}

.ps-option-name {
  font-weight: 500;
  color: var(--text-primary);
}
.ps-option-user {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  margin-left: auto;
}
.ps-check {
  color: var(--accent-primary);
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}
</style>
