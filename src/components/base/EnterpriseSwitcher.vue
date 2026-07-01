<template>
  <div class="enterprise-switcher">
    <button class="es-trigger" @click="open = !open">
      <span class="es-label">当前企业</span>
      <span class="es-sep">·</span>
      <span class="es-name">{{ currentLabel || '未关联企业' }}</span>
      <svg class="es-chevron" :class="{ rotated: open }" width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <Teleport to="body">
      <div v-if="open" class="es-overlay" @click="open = false" />
      <div v-if="open" class="es-dropdown" @click.stop>
        <div v-if="loading" class="es-loading">加载中...</div>
        <template v-else-if="flatOptions.length > 0">
          <div
            v-for="group in enterpriseGroups"
            :key="group.enterpriseId"
            class="es-group"
          >
            <div class="es-group-label">{{ group.enterpriseName }}</div>
            <button
              v-for="pos in group.positions"
              :key="`${group.enterpriseId}-${pos}`"
              :class="['es-option', { active: selectedEnterpriseId === group.enterpriseId && selectedPosition === pos }]"
              @click="select(group.enterpriseId, pos)"
            >
              <span class="es-option-name">{{ getPositionLabel(pos) }}</span>
              <span v-if="selectedEnterpriseId === group.enterpriseId && selectedPosition === pos" class="es-check">✓</span>
            </button>
          </div>
        </template>
        <div v-else class="es-empty">暂无关联企业</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { getMyEnterprises } from '@/api/user-admin'
import { ALL_POSITIONS } from '@/config/positions'
import type { UserEnterpriseItem } from '@/types/user-admin'

/** 岗位 key → 中文名称映射 */
const positionLabelMap: Record<string, string> = Object.fromEntries(
  ALL_POSITIONS.map(p => [p.key, p.name])
)

/** 将英文岗位 key 转为中文，未知 key 原样返回 */
function getPositionLabel(key: string): string {
  // 直接匹配
  if (positionLabelMap[key]) return positionLabelMap[key]
  // 去掉命名空间前缀（如 "platform:org-admin" → "org-admin"）
  const stripped = key.replace(/^[a-z]+:/, '')
  return positionLabelMap[stripped] || key
}

const STORAGE_KEY_ENT = 'demo-enterprise-id'
const STORAGE_KEY_POS = 'demo-position-name'

const userStore = useUserStore()
const open = ref(false)
const loading = ref(false)
const enterprises = ref<UserEnterpriseItem[]>([])

const selectedEnterpriseId = ref<number>(loadSelectedEnterpriseId())
const selectedPosition = ref<string>(loadSelectedPosition())

// 按企业分组的扁平选项（用于展示）
const enterpriseGroups = computed(() => enterprises.value)

// 所有扁平选项用于快速查找
const flatOptions = computed(() =>
  enterprises.value.flatMap(e => e.positions.map(p => ({ enterpriseId: e.enterpriseId, position: p })))
)

const currentLabel = computed(() => {
  if (!selectedEnterpriseId.value || !selectedPosition.value) return ''
  const ent = enterprises.value.find(e => e.enterpriseId === selectedEnterpriseId.value)
  if (!ent) return ''
  return `${ent.enterpriseName} · ${getPositionLabel(selectedPosition.value)}`
})

function loadSelectedEnterpriseId(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENT)
    return raw ? +raw : 0
  } catch { return 0 }
}

function loadSelectedPosition(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_POS) || ''
  } catch { return '' }
}

function saveSelection(entId: number, pos: string) {
  localStorage.setItem(STORAGE_KEY_ENT, String(entId))
  localStorage.setItem(STORAGE_KEY_POS, pos)
}

function select(enterpriseId: number, position: string) {
  selectedEnterpriseId.value = enterpriseId
  selectedPosition.value = position
  saveSelection(enterpriseId, position)
  open.value = false
}

async function fetchEnterprises() {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    enterprises.value = await getMyEnterprises()
    // 如果当前没有选中或选中的企业不在列表中，自动选中第一个
    if (enterprises.value.length > 0) {
      const stillValid = enterprises.value.some(
        e => e.enterpriseId === selectedEnterpriseId.value && e.positions.includes(selectedPosition.value)
      )
      if (!stillValid) {
        const first = enterprises.value[0]
        selectedEnterpriseId.value = first.enterpriseId
        selectedPosition.value = first.positions[0]
        saveSelection(first.enterpriseId, first.positions[0])
      }
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchEnterprises)

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) fetchEnterprises()
})
</script>

<style scoped>
.enterprise-switcher {
  position: relative;
  flex-shrink: 0;
}

.es-trigger {
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
.es-trigger:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}

.es-label {
  color: var(--text-muted);
  font-size: var(--font-xs, 12px);
}
.es-sep {
  color: var(--text-placeholder);
}
.es-name {
  font-weight: 500;
  color: var(--text-primary);
}

.es-chevron {
  transition: transform .2s;
  color: var(--text-muted);
  margin-left: 2px;
}
.es-chevron.rotated {
  transform: rotate(180deg);
}

/* ===== 下拉面板 ===== */
.es-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}
.es-dropdown {
  position: fixed;
  top: 52px;
  right: 200px;
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

.es-loading,
.es-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-small, 14px);
}

/* ===== 分组 ===== */
.es-group + .es-group {
  margin-top: var(--spacing-xs, 4px);
}
.es-group + .es-group::before {
  content: '';
  display: block;
  border-top: 1px solid var(--border-low);
  margin: 0 8px var(--spacing-xs, 4px);
}

.es-group-label {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  padding: 4px 10px 2px;
  font-weight: 500;
}

/* ===== 选项 ===== */
.es-option {
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
.es-option:hover {
  background: var(--accent-primary10);
}
.es-option.active {
  background: var(--accent-primary10);
}

.es-option-name {
  font-weight: 500;
  color: var(--text-primary);
}
.es-check {
  color: var(--accent-primary);
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  margin-left: auto;
}
</style>
