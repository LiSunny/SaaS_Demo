<template>
  <el-drawer
    v-model="drawerVisible"
    :title="`权限配置 — ${positionName}`"
    size="680px"
    destroy-on-close
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    @open="fetchDetail"
  >
    <div v-loading="loading" class="drawer-body">
      <!-- ===== 岗位信息摘要 ===== -->
      <div class="drawer-header">
        <p class="pos-desc">{{ detail?.description || '暂无说明' }}</p>
      </div>

      <!-- ===== 模块访问权限 ===== -->
      <div class="section">
        <div class="section-title">
          <span class="section-bar"></span>
          <span>模块访问权限</span>
          <el-link type="primary" :underline="false" class="section-action" @click="toggleAllModuleAccess">
            {{ allModuleChecked ? '取消全选' : '全选' }}
          </el-link>
        </div>
        <p class="section-desc">勾选后，该岗位用户可进入对应业务模块</p>
        <div class="module-grid">
          <div v-for="group in MODULE_GROUPS" :key="group.label" class="module-group">
            <h4 class="group-label">{{ group.label }}</h4>
            <div class="group-items">
              <el-checkbox
                v-for="mod in group.modules"
                :key="mod.key"
                v-model="moduleAccess"
                :label="mod.key"
                :value="mod.key"
                class="module-check"
                @change="onModuleAccessChange(mod.key)"
              >
                {{ mod.name }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 数据操作权限 ===== -->
      <div class="section">
        <div class="section-title">
          <span class="section-bar"></span>
          <span>数据操作权限</span>
        </div>
        <p class="section-desc">勾选后，该岗位用户可在对应模块中执行该操作。仅展示已开启模块访问的模块。</p>
        <div v-if="enabledModuleRows.length > 0" class="ops-table-wrap">
          <table class="ops-table">
            <thead>
              <tr>
                <th class="ops-th-module">模块</th>
                <th v-for="op in DATA_OPERATIONS" :key="op.key" class="ops-th-op">
                  全选
                  <el-checkbox
                    :model-value="isModuleOpAllChecked(op.key)"
                    :indeterminate="isModuleOpIndeterminate(op.key)"
                    @change="(val: boolean) => toggleModuleOpAll(op.key, val)"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in enabledModuleRows" :key="row.key">
                <td class="ops-td-module">{{ row.name }}</td>
                <td v-for="op in DATA_OPERATIONS" :key="op.key" class="ops-td-op">
                  <el-checkbox
                    :model-value="row.checkState[op.key]"
                    :disabled="isOpDisabled(op.key, row)"
                    @change="(val: boolean) => onOpChange(row.key, op.key, val)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-hint">暂无已开启的模块</div>
      </div>

      <!-- ===== 管理操作权限 ===== -->
      <div class="section">
        <div class="section-title">
          <span class="section-bar"></span>
          <span>管理操作权限</span>
        </div>
        <p class="section-desc">勾选后，该岗位用户可执行对应系统管理功能</p>
        <div class="mgmt-list">
          <div v-for="op in MANAGEMENT_OPERATIONS" :key="op.key" class="mgmt-item">
            <el-checkbox v-model="managementOps" :label="op.key" :value="op.key">
              {{ op.name }}
            </el-checkbox>
            <span class="mgmt-desc">{{ op.description }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 底部按钮栏 ===== -->
    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPositionDetail } from '@/api/position-admin'
import { usePositionStore } from '@/stores/position-admin'
import {
  MODULE_GROUPS, DATA_OPERATIONS, MANAGEMENT_OPERATIONS,
  getAllModuleKeys, getModuleName,
} from '@/config/permission-modules'
import type { PermissionConfig, PositionDetail } from '@/types/position-admin'

// ===== Props & Emits =====
const props = defineProps<{
  visible: boolean
  positionId: number
  positionName: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'saved': []
}>()

const drawerVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

// ===== State =====
const store = usePositionStore()
const detail = ref<PositionDetail | null>(null)
const loading = ref(false)
const saving = ref(false)

const moduleAccess = ref<string[]>([])
const managementOps = ref<string[]>([])

// 数据操作权限：按模块 key 存储已选操作列表
const dataOps = ref<Record<string, string[]>>({})

// 初始快照（脏检测用）
let snapshot = ''

// ===== 数据操作启用模块行 =====
interface OpsRow {
  key: string
  name: string
  checkState: Record<string, boolean>
}

const enabledModuleRows = computed<OpsRow[]>(() => {
  return moduleAccess.value.map(key => {
    const current = dataOps.value[key] || []
    const checkState: Record<string, boolean> = {}
    for (const op of DATA_OPERATIONS) {
      checkState[op.key] = current.includes(op.key)
    }
    return { key, name: getModuleName(key), checkState }
  })
})

// ===== 初始化 =====
async function fetchDetail() {
  if (!props.positionId) return
  loading.value = true
  try {
    const d = await getPositionDetail(props.positionId)
    detail.value = d
    moduleAccess.value = [...(d.permissions.moduleAccess || [])]
    dataOps.value = JSON.parse(JSON.stringify(d.permissions.dataOperations || {}))
    managementOps.value = [...(d.permissions.managementOperations || [])]
    snapshot = JSON.stringify({ moduleAccess: moduleAccess.value, dataOps: dataOps.value, managementOps: managementOps.value })
  } catch {
    // API 错误由拦截器统一处理
  } finally {
    loading.value = false
  }
}

// ===== 脏检测 =====
const isDirty = computed(() => {
  return JSON.stringify({ moduleAccess: moduleAccess.value, dataOps: dataOps.value, managementOps: managementOps.value }) !== snapshot
})

async function handleBeforeClose(done: () => void) {
  if (isDirty.value) {
    try {
      await ElMessageBox.confirm('权限配置尚未保存，确定关闭吗？', '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    } catch {
      return // 用户取消关闭
    }
  }
  done()
}

function handleCancel() {
  if (isDirty.value) {
    ElMessageBox.confirm('权限配置尚未保存，确定关闭吗？', '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
      .then(() => { drawerVisible.value = false })
      .catch(() => { /* 用户取消 */ })
  } else {
    drawerVisible.value = false
  }
}

// ===== 模块访问操作 =====
const allModuleKeys = getAllModuleKeys()

const allModuleChecked = computed(() => {
  return allModuleKeys.every(k => moduleAccess.value.includes(k))
})

function toggleAllModuleAccess() {
  if (allModuleChecked.value) {
    moduleAccess.value = []
    dataOps.value = {}
  } else {
    moduleAccess.value = [...allModuleKeys]
  }
}

function onModuleAccessChange(moduleKey: string) {
  // 取消模块访问时，清除该模块的数据操作权限
  if (!moduleAccess.value.includes(moduleKey)) {
    delete dataOps.value[moduleKey]
  }
}

// ===== 数据操作级联 =====
function isOpDisabled(opKey: string, row: OpsRow): boolean {
  const opDef = DATA_OPERATIONS.find(o => o.key === opKey)
  if (opDef?.dependsOn) {
    return !row.checkState[opDef.dependsOn]
  }
  return false
}

function onOpChange(moduleKey: string, opKey: string, checked: boolean) {
  if (!dataOps.value[moduleKey]) {
    dataOps.value[moduleKey] = []
  }
  const current = dataOps.value[moduleKey]

  if (checked) {
    // 勾选时，自动勾选依赖项
    const opDef = DATA_OPERATIONS.find(o => o.key === opKey)
    if (opDef?.dependsOn && !current.includes(opDef.dependsOn)) {
      current.push(opDef.dependsOn)
    }
    if (!current.includes(opKey)) {
      current.push(opKey)
    }
  } else {
    // 取消勾选时，自动取消依赖此项的其他操作
    const dependents = DATA_OPERATIONS.filter(o => o.dependsOn === opKey).map(o => o.key)
    dataOps.value[moduleKey] = current.filter(k => k !== opKey && !dependents.includes(k))
  }

  // 清空空数组
  if (dataOps.value[moduleKey].length === 0) {
    delete dataOps.value[moduleKey]
  }
}

// ===== 数据操作列全选 =====
function isModuleOpAllChecked(opKey: string): boolean {
  if (enabledModuleRows.value.length === 0) return false
  return enabledModuleRows.value.every(r => r.checkState[opKey])
}

function isModuleOpIndeterminate(opKey: string): boolean {
  if (enabledModuleRows.value.length === 0) return false
  const checkedCount = enabledModuleRows.value.filter(r => r.checkState[opKey]).length
  return checkedCount > 0 && checkedCount < enabledModuleRows.value.length
}

function toggleModuleOpAll(opKey: string, checked: boolean) {
  for (const row of enabledModuleRows.value) {
    onOpChange(row.key, opKey, checked)
  }
}

// ===== 保存 =====
async function handleSave() {
  saving.value = true
  try {
    const config: PermissionConfig = {
      moduleAccess: [...moduleAccess.value],
      dataOperations: JSON.parse(JSON.stringify(dataOps.value)),
      managementOperations: [...managementOps.value],
    }
    await store.handleSavePermissions(props.positionId, config)
    emit('saved')
  } catch {
    // API 错误由拦截器统一处理
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.drawer-body {
  padding: 0 4px;
}

/* ===== 岗位信息摘要 ===== */
.drawer-header {
  padding: 0 0 16px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-default);
}
.pos-desc {
  margin: 0 0 8px;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
}
.pos-meta {
  margin: 0;
  display: flex; align-items: center; gap: 8px;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
}

/* ===== 分区标题 ===== */
.section {
  margin-top: 24px;
}
.section:first-of-type {
  margin-top: 0;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-default);
  font-size: var(--font-body, 16px);
  font-weight: 600;
  color: var(--text-primary);
}
.section-bar {
  display: inline-block;
  width: 3px; height: 16px;
  border-radius: 2px;
  background: var(--accent-primary);
}
.section-action {
  margin-left: auto;
  font-size: var(--font-small, 14px);
}
.section-desc {
  margin: 8px 0 0;
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
}

/* ===== 模块访问网格 ===== */
.module-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 12px;
}
.module-group {
  background: var(--normal-bg);
  border-radius: 8px;
  padding: 12px;
}
.group-label {
  margin: 0 0 8px;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  color: var(--text-secondary);
}
.group-items {
  display: flex; flex-direction: column; gap: 4px;
}
.module-check {
  margin-right: 0;
}

/* ===== 数据操作表格 ===== */
.ops-table-wrap {
  margin-top: 12px;
  overflow-x: auto;
}
.ops-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-small, 14px);
}
.ops-table th, .ops-table td {
  padding: 10px 8px;
  border: 1px solid var(--border-default);
}
.ops-th-module {
  text-align: left;
  min-width: 90px;
  font-weight: 500;
}
.ops-th-op {
  text-align: center;
  white-space: nowrap;
  font-weight: 400;
  font-size: var(--font-xs, 12px);
  color: var(--text-secondary);
}
.ops-th-op .el-checkbox {
  margin-left: 4px;
}
.ops-td-module {
  font-weight: 500;
  color: var(--text-primary);
}
.ops-td-op {
  text-align: center;
}
.ops-td-op .el-checkbox {
  justify-content: center;
}

/* ===== 管理操作列表 ===== */
.mgmt-list {
  margin-top: 12px;
}
.mgmt-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0;
}
.mgmt-item:not(:last-child) {
  border-bottom: 1px solid var(--border-light, rgba(0,0,0,.04));
}
.mgmt-desc {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
}

/* ===== 空状态 ===== */
.empty-hint {
  padding: 32px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-small, 14px);
}

/* ===== 底部按钮栏 ===== */
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
