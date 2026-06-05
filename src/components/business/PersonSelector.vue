<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择人员"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="ps-dialog"
    @close="onClosed"
  >
    <!-- ===== 顶部 Tab ===== -->
    <div class="ps-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="ps-tab"
        :class="{ active: activeTab === tab.key }"
        @click.stop="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="activeTab === tab.key" class="ps-tab-line" />
      </button>
    </div>

    <!-- ===== 全选 + 搜索 ===== -->
    <div class="ps-toolbar">
      <label class="ps-check-all">
        <input type="checkbox" :checked="isAllChecked" @change="toggleAll" />
        <span>全选</span>
      </label>
      <div class="ps-search">
        <input
          v-model="searchText"
          :placeholder="searchPlaceholder"
          class="ps-search-input"
        />
        <span class="ps-search-icon">🔍</span>
      </div>
    </div>

    <!-- ===== 列表 ===== -->
    <div class="ps-list">
      <!-- 按人员 -->
      <div v-show="activeTab === 'person'">
        <label
          v-for="p in filteredPersons"
          :key="p.id"
          class="ps-item"
          :class="{ checked: isChecked(p.id) }"
        >
          <input type="checkbox" :checked="isChecked(p.id)" class="ps-checkbox" @change="togglePerson(p.id)" />
          <div class="ps-avatar">{{ p.name[0] }}</div>
          <div class="ps-info">
            <p class="ps-name">{{ p.name }}</p>
            <div class="ps-meta">
              <span class="ps-meta-item">🏢 {{ getDeptName(p.deptId) }}</span>
              <span class="ps-meta-item">💼 {{ getPosName(p.posId) }}</span>
            </div>
          </div>
        </label>
        <div v-if="filteredPersons.length === 0" class="ps-empty">无匹配人员</div>
      </div>

      <!-- 按部门 -->
      <div v-show="activeTab === 'dept'">
        <label
          v-for="d in filteredDepts"
          :key="d.id"
          class="ps-item"
          :class="{ checked: isDeptChecked(d.id) }"
        >
          <input type="checkbox" :checked="isDeptChecked(d.id)" class="ps-checkbox" @change="toggleDept(d.id)" />
          <div class="ps-info">
            <p class="ps-name">{{ d.name }}</p>
            <p class="ps-meta-item">{{ getDeptPersonCount(d.id) }} 人</p>
          </div>
        </label>
        <div v-if="filteredDepts.length === 0" class="ps-empty">无匹配部门</div>
      </div>

      <!-- 按岗位 -->
      <div v-show="activeTab === 'position'">
        <label
          v-for="pos in filteredPositions"
          :key="pos.id"
          class="ps-item"
          :class="{ checked: isPosChecked(pos.id) }"
        >
          <input type="checkbox" :checked="isPosChecked(pos.id)" class="ps-checkbox" @change="togglePos(pos.id)" />
          <div class="ps-info">
            <p class="ps-name">{{ pos.name }}</p>
            <p class="ps-meta-item">{{ getDeptName(pos.deptId) }}</p>
          </div>
        </label>
        <div v-if="filteredPositions.length === 0" class="ps-empty">无匹配岗位</div>
      </div>
    </div>

    <!-- ===== 底部 ===== -->
    <div class="ps-footer">
      <span class="ps-selected-count">已选 {{ checkedIds.size }} 人</span>
      <div class="ps-footer-btns">
        <button class="btn-default" @click="emit('close')">取消</button>
        <button class="btn-primary" @click="confirm">确定</button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  DEPARTMENTS, POSITIONS, PERSONS,
  getDeptName, getPosName,
  type OrgPerson, type OrgDepartment, type OrgPosition,
} from '@/utils/org-data'

const props = defineProps<{
  selectedIds: number[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', ids: number[]): void
}>()

// ===== 弹窗可见性：组件挂载即显示 =====
const dialogVisible = ref(true)

// 使用共享数据源
const departments = DEPARTMENTS
const positions = POSITIONS
const persons = PERSONS

// ===== 状态 =====
const activeTab = ref<'person' | 'dept' | 'position'>('person')
const searchText = ref('')
const checkedIds = ref<Set<number>>(new Set(props.selectedIds))

const tabs = [
  { key: 'person' as const, label: '按人员' },
  { key: 'dept' as const, label: '按部门' },
  { key: 'position' as const, label: '按岗位' },
]

// ===== 计算属性 =====
const searchPlaceholder = computed(() => {
  const map = { person: '人员姓名', dept: '部门名称', position: '岗位名称' }
  return map[activeTab.value]
})

const filteredPersons = computed(() => {
  const kw = searchText.value.toLowerCase()
  return persons.filter(p => !kw || p.name.toLowerCase().includes(kw))
})

const filteredDepts = computed(() => {
  const kw = searchText.value.toLowerCase()
  return departments.filter(d => !kw || d.name.toLowerCase().includes(kw))
})

const filteredPositions = computed(() => {
  const kw = searchText.value.toLowerCase()
  return positions.filter(pos => !kw || pos.name.toLowerCase().includes(kw))
})

const isAllChecked = computed(() => {
  if (activeTab.value === 'person') return filteredPersons.value.length > 0 && filteredPersons.value.every(p => checkedIds.value.has(p.id))
  if (activeTab.value === 'dept') return filteredDepts.value.length > 0 && filteredDepts.value.every(d => isDeptChecked(d.id))
  return filteredPositions.value.length > 0 && filteredPositions.value.every(p => isPosChecked(p.id))
})

// ===== 辅助方法（直接使用共享工具函数） =====
function getDeptPersonCount(deptId: number) { return PERSONS.filter(p => p.deptId === deptId).length }
function getDeptPersonIds(deptId: number) { return PERSONS.filter(p => p.deptId === deptId).map(p => p.id) }
function getPosPersonIds(posId: number) { return PERSONS.filter(p => p.posId === posId).map(p => p.id) }

function isChecked(id: number) { return checkedIds.value.has(id) }

function isDeptChecked(deptId: number) {
  const pids = getDeptPersonIds(deptId)
  return pids.length > 0 && pids.every(id => checkedIds.value.has(id))
}

function isPosChecked(posId: number) {
  const pids = getPosPersonIds(posId)
  return pids.length > 0 && pids.every(id => checkedIds.value.has(id))
}

// ===== 交互 =====
function togglePerson(id: number) {
  const next = new Set(checkedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  checkedIds.value = next
}

function toggleDept(deptId: number) {
  const pids = getDeptPersonIds(deptId)
  const allChecked = pids.every(id => checkedIds.value.has(id))
  const next = new Set(checkedIds.value)
  pids.forEach(id => allChecked ? next.delete(id) : next.add(id))
  checkedIds.value = next
}

function togglePos(posId: number) {
  const pids = getPosPersonIds(posId)
  const allChecked = pids.every(id => checkedIds.value.has(id))
  const next = new Set(checkedIds.value)
  pids.forEach(id => allChecked ? next.delete(id) : next.add(id))
  checkedIds.value = next
}

function toggleAll() {
  const next = new Set(checkedIds.value)
  if (isAllChecked.value) {
    if (activeTab.value === 'person') filteredPersons.value.forEach(p => next.delete(p.id))
    if (activeTab.value === 'dept') filteredDepts.value.forEach(d => getDeptPersonIds(d.id).forEach(id => next.delete(id)))
    if (activeTab.value === 'position') filteredPositions.value.forEach(pos => getPosPersonIds(pos.id).forEach(id => next.delete(id)))
  } else {
    if (activeTab.value === 'person') filteredPersons.value.forEach(p => next.add(p.id))
    if (activeTab.value === 'dept') filteredDepts.value.forEach(d => getDeptPersonIds(d.id).forEach(id => next.add(id)))
    if (activeTab.value === 'position') filteredPositions.value.forEach(pos => getPosPersonIds(pos.id).forEach(id => next.add(id)))
  }
  checkedIds.value = next
}

function confirm() {
  emit('confirm', [...checkedIds.value])
  emit('close')
}

function onClosed() {
  emit('close')
}
</script>

<style scoped>
/* ===== Tab ===== */
.ps-tabs {
  display: flex;
  gap: var(--spacing-sm, 6px);
  padding-bottom: 0;
}
.ps-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md, 8px);
  padding: var(--spacing-lg, 12px) 0 0;
  font-size: var(--font-body, 16px);
  color: var(--text-primary);
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
}
.ps-tab.active {
  color: var(--accent-primary);
  font-weight: 500;
}
.ps-tab-line {
  width: 56px;
  height: var(--spacing-xs, 4px);
  border-radius: var(--radius-sm, 6px);
  background: var(--accent-primary);
}

/* ===== 工具栏 ===== */
.ps-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg, 12px) 0;
  gap: var(--spacing-lg, 12px);
}
.ps-check-all {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
  font-size: var(--font-body, 16px);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
}
.ps-search {
  position: relative;
  flex: 1;
}
.ps-search-input {
  width: 100%;
  height: 32px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  padding: 0 var(--spacing-xxl, 24px) 0 var(--spacing-xl, 16px);
  font-size: var(--font-body, 16px);
  background: var(--bg-card);
  color: var(--text-primary);
}
.ps-search-input::placeholder { color: var(--text-placeholder); }
.ps-search-icon {
  position: absolute;
  right: var(--spacing-lg, 12px);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-small, 14px);
  pointer-events: none;
}

/* ===== 列表 ===== */
.ps-list {
  max-height: 360px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 4px);
}
.ps-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 12px);
  padding: var(--spacing-md, 8px);
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: background .15s;
}
.ps-item:hover { background: var(--accent-primary10); }
.ps-item.checked { background: var(--info-bg); }

.ps-checkbox {
  width: var(--spacing-xl, 16px);
  height: var(--spacing-xl, 16px);
  accent-color: var(--accent-primary);
  flex-shrink: 0;
}

.ps-avatar {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-h1, 24px);
  font-weight: 500;
  flex-shrink: 0;
}

.ps-info {
  flex: 1;
  min-width: 0;
}
.ps-name {
  font-size: var(--font-body, 16px);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm, 6px);
}
.ps-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 4px);
}
.ps-meta-item {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}

.ps-empty {
  text-align: center;
  padding: var(--spacing-xxl, 24px) 0;
  color: var(--text-muted);
  font-size: var(--font-small, 14px);
}

/* ===== 底部 ===== */
.ps-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-lg, 12px);
  border-top: 1px solid var(--border-low);
  margin-top: var(--spacing-md, 8px);
}
.ps-selected-count {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}
.ps-footer-btns {
  display: flex;
  gap: var(--spacing-md, 8px);
}
</style>