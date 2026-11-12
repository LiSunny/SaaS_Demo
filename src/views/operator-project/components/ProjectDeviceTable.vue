<template>
  <div class="device-table">
    <!-- ===== 筛选栏 ===== -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="search-input-wrap">
          <input v-model="query.keyword" class="fi-input" placeholder="设备名称 / 编码" @keyup.enter="applyFilter" />
          <button v-if="query.keyword" class="fi-clear" @click="query.keyword = ''; applyFilter()">
            <AppIcon name="clear" />
          </button>
          <AppIcon name="search" class="fi-icon" />
        </div>

        <el-select v-model="query.type" class="fi-select-wrap type-select" placeholder="设备类型" clearable>
          <el-option v-for="t in DEVICE_TYPE_OPTIONS" :key="t" :label="t" :value="t" />
        </el-select>

        <el-select v-model="query.unit" class="fi-select-wrap unit-select" placeholder="所属单位" clearable filterable>
          <el-option v-for="u in unitOptions" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>

        <el-select v-model="query.online" class="fi-select-wrap status-select" placeholder="在线状态" clearable>
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
        </el-select>

        <button class="btn-primary" @click="applyFilter">查询</button>
      </div>

      <div class="filter-right">
        <button class="btn-outline-primary" @click="$emit('add-device')">
          <AppIcon name="plus" class="btn-add-icon" />新增设备
        </button>
      </div>
    </div>

    <!-- ===== 单位筛选标记 ===== -->
    <div v-if="unitFilter" class="filter-chip">
      <span class="chip-text">按单位筛选：{{ unitFilterName }}</span>
      <button class="btn-link chip-clear" @click="$emit('clear-unit-filter')">清除</button>
    </div>

    <!-- ===== 批量操作条 ===== -->
    <div v-if="selected.length" class="batch-bar">
      <span class="batch-text">已选 {{ selected.length }} 项</span>
      <button class="btn-link batch-link" @click="clearSelection">清除</button>
      <button class="btn-outline-danger btn-sm" @click="openRemoveSelected">批量删除</button>
    </div>

    <!-- ===== 数据表格 ===== -->
    <div class="table-wrap">
      <table class="fi-table">
        <thead>
          <tr class="fi-thead-tr">
            <th class="fi-th col-check">
              <el-checkbox
                :model-value="allChecked"
                :indeterminate="someChecked"
                @change="toggleAll"
              />
            </th>
            <th class="fi-th col-name"><span>设备名称</span></th>
            <th class="fi-th col-type"><span>设备类型</span></th>
            <th class="fi-th col-code"><span>设备编码</span></th>
            <th class="fi-th col-unit"><span>所属单位</span></th>
            <th class="fi-th col-location"><span>安装位置</span></th>
            <th class="fi-th col-status"><span>在线状态</span></th>
            <th class="fi-th col-date"><span>接入时间</span></th>
            <th class="fi-th col-actions"><span>操作</span></th>
          </tr>
        </thead>
        <tbody v-loading="loading">
          <tr v-for="row in filteredRows" :key="row.id" class="fi-tbody-tr">
            <td class="fi-td col-check">
              <el-checkbox
                :model-value="selected.includes(row.id)"
                @change="(v: boolean | string | number) => toggleRow(row.id, v)"
              />
            </td>
            <td class="fi-td col-name">
              <el-tooltip :content="row.name" placement="top" :show-after="400">
                <span class="ellipsis">{{ row.name }}</span>
              </el-tooltip>
            </td>
            <td class="fi-td col-type">
              <span class="type-tag">{{ row.type }}</span>
            </td>
            <td class="fi-td col-code">{{ row.code }}</td>
            <td class="fi-td col-unit">
              <el-tooltip :content="row.nodePath" placement="top" :show-after="400">
                <span class="ellipsis">{{ row.unitName }}</span>
              </el-tooltip>
            </td>
            <td class="fi-td col-location">{{ row.location || '—' }}</td>
            <td class="fi-td col-status">
              <span class="status-tag" :class="row.online ? 'is-online' : 'is-offline'">
                {{ row.online ? '在线' : '离线' }}
              </span>
            </td>
            <td class="fi-td col-date">{{ row.connectedAt.slice(0, 10) }}</td>
            <td class="fi-td col-actions">
              <div class="action-cell">
                <button class="act-btn act-preview" title="查看详情" @click="$emit('view-device', row.id)">
                  <AppIcon name="browse" class="act-icon" />
                </button>
                <button class="act-btn act-edit" title="编辑设备" @click="$emit('edit-device', row.id)">
                  <AppIcon name="edit" class="act-icon" />
                </button>
                <button class="act-btn act-delete" title="删除设备" @click="removeOne(row)">
                  <AppIcon name="delete" class="act-icon" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !filteredRows.length">
            <td class="fi-td empty-cell" :colspan="9">
              {{ rows.length ? '没有符合筛选条件的设备' : '还没有接入设备，点击右上角「新增设备」开始录入' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== 批量删除 ===== -->
    <el-dialog v-model="removeVisible" title="删除设备" width="420px" append-to-body>
      <p class="dialog-tip">
        确定删除选中的 {{ selected.length }} 台设备？<br/>
        <span v-if="onlineSelectedCount > 0">其中 {{ onlineSelectedCount }} 台在线设备删除后将不再监测。</span>
      </p>
      <template #footer>
        <button class="btn-default" @click="removeVisible = false">取消</button>
        <button class="btn-danger" @click="confirmRemoveSelected">删除</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index.mjs'
import 'element-plus/es/components/message/style/css.mjs'
import { ElMessageBox } from 'element-plus/es/components/message-box/index.mjs'
import 'element-plus/es/components/message-box/style/css.mjs'
import AppIcon from '@/components/base/AppIcon.vue'
import { DEVICE_TYPE_OPTIONS, useProjectOpsStore } from '@/stores/project-ops'

/**
 * ProjectDeviceTable.vue — 项目「接入设备」页签表格
 *
 * 口径见 docs/项目管理/product-design.md §7.2.4、§6.5、§8.3
 *   列：勾选、设备名称、设备类型、设备编码、所属单位、安装位置、在线状态、接入时间、操作
 *   设备必须挂单位，不允许项目直属（§8.3）
 *   删除二次确认，在线设备提示「删除后不再监测」（§6.5.3）
 */

const props = defineProps<{
  projectId: string
  selectedNodeId: string | null
  includeChildren: boolean
  /** 按单位过滤（新增设备后「查看设备」跳转用） */
  unitFilter?: string | null
}>()

const emit = defineEmits<{
  (e: 'add-device', unitId?: string): void
  (e: 'clear-unit-filter'): void
  (e: 'edit-device', deviceId: string): void
  (e: 'view-device', deviceId: string): void
}>()

const store = useProjectOpsStore()

const loading = ref(false)
const query = ref({ keyword: '', type: '', unit: '', online: '' })
const applied = ref({ keyword: '', type: '', unit: '', online: '' })
const selected = ref<string[]>([])

/** 所属单位筛选项：项目内已接入的单位 */
const unitOptions = computed(() => store.unitRows(props.projectId).map(r => ({ id: r.id, name: r.name })))

const rows = computed(() => {
  const list = store.devicesOfNode(props.projectId, props.selectedNodeId, props.includeChildren)
  if (!props.unitFilter) return list
  return list.filter(r => r.unitId === props.unitFilter)
})

const unitFilterName = computed(() => {
  if (!props.unitFilter) return ''
  return store.units.find(u => u.id === props.unitFilter)?.name ?? ''
})

const filteredRows = computed(() => {
  const kw = applied.value.keyword.trim()
  return rows.value.filter(r => {
    if (kw && !r.name.includes(kw) && !r.code.includes(kw)) return false
    if (applied.value.type && r.type !== applied.value.type) return false
    if (applied.value.unit && r.unitId !== applied.value.unit) return false
    if (applied.value.online === 'online' && !r.online) return false
    if (applied.value.online === 'offline' && r.online) return false
    return true
  })
})

watch(() => [props.selectedNodeId, props.includeChildren], () => { selected.value = [] })

function applyFilter() {
  applied.value = { ...query.value }
}

const allChecked = computed(() => filteredRows.value.length > 0 && filteredRows.value.every(r => selected.value.includes(r.id)))
const someChecked = computed(() => !allChecked.value && filteredRows.value.some(r => selected.value.includes(r.id)))

function toggleAll(val: boolean | string | number) {
  const checked = Boolean(val)
  if (checked) {
    selected.value = Array.from(new Set([...selected.value, ...filteredRows.value.map(r => r.id)]))
  } else {
    const ids = new Set(filteredRows.value.map(r => r.id))
    selected.value = selected.value.filter(id => !ids.has(id))
  }
}

function toggleRow(id: string, val: boolean | string | number) {
  if (val) {
    if (!selected.value.includes(id)) selected.value = [...selected.value, id]
  } else {
    selected.value = selected.value.filter(x => x !== id)
  }
}

function clearSelection() {
  selected.value = []
}

const onlineSelectedCount = computed(() => rows.value.filter(r => selected.value.includes(r.id) && r.online).length)

async function removeOne(row: { id: string; name: string; online: boolean }) {
  try {
    await ElMessageBox.confirm(
      row.online
        ? `确定删除设备「${row.name}」？<br/>该设备当前在线，删除后不再监测。`
        : `确定删除设备「${row.name}」？`,
      '删除设备',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消', dangerouslyUseHTMLString: true },
    )
  } catch {
    return
  }
  store.removeDevice(row.id)
  selected.value = selected.value.filter(id => id !== row.id)
  ElMessage.success('删除成功')
}

const removeVisible = ref(false)

function confirmRemoveSelected() {
  const ids = [...selected.value]
  for (const id of ids) store.removeDevice(id)
  selected.value = []
  removeVisible.value = false
  ElMessage.success(`已删除 ${ids.length} 台设备`)
}

// 勾选后点批量条上的「删除」才允许（按钮在模板中按选中数显示）
function openRemoveSelected() {
  if (!selected.value.length) return
  removeVisible.value = true
}

defineExpose({ openRemoveSelected })
</script>

<style scoped>
.device-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 12px);
  min-height: 0;
  flex: 1;
}

.type-select { width: 130px; }
.unit-select { width: 160px; }
.status-select { width: 120px; }

.btn-outline-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 37px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  background: var(--info-bg);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  cursor: pointer;
  white-space: nowrap;
  transition: all .2s;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }

.filter-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: var(--accent-primary10);
  border-radius: var(--radius-sm, 6px);
}
.chip-text { font-size: var(--font-small, 14px); color: var(--accent-primary); }
.chip-clear { font-size: var(--font-small, 14px); }

.batch-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--accent-primary10);
  border-radius: var(--radius-sm, 6px);
}
.batch-text { font-size: var(--font-small, 14px); color: var(--accent-primary); }
.batch-link { font-size: var(--font-small, 14px); }
.btn-outline-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 4px 10px;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px);
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger);
  cursor: pointer;
}
.btn-sm { height: 30px; }

.col-check { width: 44px; }
.col-name { min-width: 160px; }
.col-type { width: 100px; }
.col-code { width: 130px; }
.col-unit { min-width: 140px; }
.col-location { min-width: 120px; }
.col-status { width: 90px; }
.col-date { width: 110px; }
.col-actions { width: 96px; min-width: 96px; white-space: nowrap; }

.ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.type-tag {
  display: inline-flex;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--normal-bg);
  border-radius: 4px;
  white-space: nowrap;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
}
.status-tag.is-online { color: var(--success-text); background: var(--success-bg); }
.status-tag.is-offline { color: var(--danger-text); background: var(--danger-bg); }

.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: 32px 0 !important;
}

.dialog-tip {
  margin: 0;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
