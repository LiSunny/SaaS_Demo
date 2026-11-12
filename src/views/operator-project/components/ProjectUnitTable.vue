<template>
  <div class="unit-table">
    <!-- ===== 筛选栏 ===== -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="search-input-wrap">
          <input v-model="query.keyword" class="fi-input" placeholder="单位名称" @keyup.enter="applyFilter" />
          <button v-if="query.keyword" class="fi-clear" @click="query.keyword = ''; applyFilter()">
            <AppIcon name="clear" />
          </button>
          <AppIcon name="search" class="fi-icon" />
        </div>

        <el-select v-model="query.nature" class="fi-select-wrap nature-select" placeholder="单位性质" clearable>
          <el-option v-for="n in UNIT_NATURE_OPTIONS" :key="n" :label="n" :value="n" />
        </el-select>

        <button class="btn-primary" @click="applyFilter">查询</button>
      </div>

      <div class="filter-right">
        <button class="btn-outline-primary" @click="$emit('add-unit')">
          <AppIcon name="plus" class="btn-add-icon" />接入单位
        </button>
      </div>
    </div>

    <!-- ===== 批量操作条 ===== -->
    <div v-if="selected.length" class="batch-bar">
      <span class="batch-text">已选 {{ selected.length }} 项</span>
      <button class="btn-link batch-link" @click="clearSelection">清除</button>
      <div class="batch-actions">
        <button class="btn-outline-primary btn-sm" @click="openMove">移动到层级</button>
        <button class="btn-outline-danger btn-sm" @click="removeSelected">批量移除</button>
      </div>
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
            <th class="fi-th col-name"><span>单位名称</span></th>
            <th class="fi-th col-nature"><span>单位性质</span></th>
            <th class="fi-th col-region"><span>所属层级</span></th>
            <th class="fi-th fi-th-sort col-date" @click="toggleDateSort">
              <span>添加日期</span>
              <TableSortIcon :direction="dateSortDir" />
            </th>
            <th class="fi-th col-operator"><span>操作人</span></th>
            <th class="fi-th col-device"><span>设备数</span></th>
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
              <span v-if="row.otherProjects.length" class="other-tag" :title="`已在 ${row.otherProjects.join('、')} 项目`">
                已在{{ row.otherProjects.length }}个项目
              </span>
            </td>
            <td class="fi-td col-nature">
              <span class="unit-tag" :class="natureClass(row.nature)">{{ row.nature }}</span>
            </td>
            <td class="fi-td col-region">
              <el-tooltip :content="nodePathText(row.nodeId)" placement="top" :show-after="400">
                <span class="ellipsis">{{ nodePathText(row.nodeId) }}</span>
              </el-tooltip>
            </td>
            <td class="fi-td col-date">{{ row.addedAt.slice(0, 10) }}</td>
            <td class="fi-td col-operator">{{ row.operator }}</td>
            <td class="fi-td col-device">{{ row.deviceCount }}</td>
            <td class="fi-td col-actions">
              <div class="action-cell">
                <button class="act-btn act-preview" title="查看详情" @click="$emit('view-unit', row.id)">
                  <AppIcon name="browse" class="act-icon" />
                </button>
                <button class="act-btn act-edit" title="编辑项目内信息" @click="$emit('edit-unit', row.id)">
                  <AppIcon name="edit" class="act-icon" />
                </button>
                <button class="act-btn act-add-device" title="添加设备" @click="$emit('add-device', row.id)">
                  <AppIcon name="plus" class="act-icon" />
                </button>
                <button class="act-btn act-delete" title="移出项目" @click="removeOne(row)">
                  <AppIcon name="delete" class="act-icon" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !filteredRows.length">
            <td class="fi-td empty-cell" :colspan="8">
              {{ rows.length ? '没有符合筛选条件的单位' : '还没有接入单位，点击右上角「接入单位」开始接入' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== 移动到层级 ===== -->
    <el-dialog v-model="moveVisible" title="移动到层级" width="420px" append-to-body>
      <p class="dialog-tip">将选中的 {{ selected.length }} 个单位移动到目标层级。</p>
      <div class="move-tree-wrap">
        <el-tree
          :data="moveTreeData"
          node-key="id"
          :props="{ label: 'label', children: 'children' }"
          :default-expand-all="true"
          highlight-current
          :current-node-key="moveTargetId"
          @node-click="onMoveTarget"
        />
      </div>
      <template #footer>
        <button class="btn-default" @click="moveVisible = false">取消</button>
        <button class="btn-primary" :disabled="!moveTargetId" @click="confirmMove">确认移动</button>
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
import TableSortIcon from '@/components/base/TableSortIcon.vue'
import { UNIT_NATURE_OPTIONS, UNASSIGNED_NODE_ID, useProjectOpsStore } from '@/stores/project-ops'

/**
 * ProjectUnitTable.vue — 项目「接入单位」页签表格
 *
 * 口径见 docs/项目管理/product-design.md §7.2.3、§6.4
 *   列：勾选、单位名称、单位性质、添加日期、操作人、设备数、操作
 *   表格按层级节点过滤（含下级开关由父级控制）
 *   移除只解除项目关联，单位与设备保留在台账（§6.4.4）
 */

const props = defineProps<{
  projectId: string
  selectedNodeId: string | null
  includeChildren: boolean
}>()

const emit = defineEmits<{
  (e: 'add-unit'): void
  (e: 'view-unit', unitId: string): void
  (e: 'edit-unit', unitId: string): void
  (e: 'add-device', unitId: string): void
}>()

const store = useProjectOpsStore()

const loading = ref(false)
const query = ref({ keyword: '', nature: '' })
const applied = ref({ keyword: '', nature: '' })
const selected = ref<string[]>([])
const dateSortDir = ref<'none' | 'asc' | 'desc'>('desc')

/** 当前层级范围内的单位 */
const rows = computed(() => store.unitsOfNode(props.projectId, props.selectedNodeId, props.includeChildren))

/** 叠加筛选与排序 */
const filteredRows = computed(() => {
  const kw = applied.value.keyword.trim()
  let list = rows.value.filter(r => {
    if (kw && !r.name.includes(kw)) return false
    if (applied.value.nature && r.nature !== applied.value.nature) return false
    return true
  })
  if (dateSortDir.value !== 'none') {
    list = [...list].sort((a, b) =>
      dateSortDir.value === 'asc'
        ? a.addedAt.localeCompare(b.addedAt)
        : b.addedAt.localeCompare(a.addedAt),
    )
  }
  return list
})

// 切换层级范围后清空勾选（§8.5 批量操作后清空勾选）
watch(() => [props.selectedNodeId, props.includeChildren], () => { selected.value = [] })

function applyFilter() {
  applied.value = { ...query.value }
}

function toggleDateSort() {
  dateSortDir.value = dateSortDir.value === 'none' ? 'desc' : dateSortDir.value === 'desc' ? 'asc' : 'none'
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

function nodePathText(nodeId: string | null): string {
  return store.nodePathText(nodeId)
}

function natureClass(nature: string): string {
  const map: Record<string, string> = {
    党政机关: 'party',
    社会单位: 'social',
    技术服务机构: 'service',
    '九小场所·个人': 'venue',
    家庭: 'family',
    其它: 'other',
  }
  return map[nature] ?? 'other'
}

// ===== 移除 =====
async function removeOne(row: { id: string; name: string }) {
  try {
    await ElMessageBox.confirm(
      `确定将「${row.name}」移出本项目？<br/>该单位的设备仍保留在台账，项目内将不再显示。`,
      '移出项目',
      { type: 'warning', confirmButtonText: '移除', cancelButtonText: '取消', dangerouslyUseHTMLString: true },
    )
  } catch {
    return
  }
  store.unlinkUnits(props.projectId, [row.id])
  selected.value = selected.value.filter(id => id !== row.id)
  ElMessage.success('已移出项目')
}

async function removeSelected() {
  const names = rows.value.filter(r => selected.value.includes(r.id)).map(r => r.name)
  const preview = names.slice(0, 3).join('、') + (names.length > 3 ? ` 等 ${names.length} 个单位` : '')
  try {
    await ElMessageBox.confirm(
      `确定将「${preview}」移出本项目？<br/>这些单位的设备仍保留在台账，项目内将不再显示。`,
      '批量移出项目',
      { type: 'warning', confirmButtonText: '移除', cancelButtonText: '取消', dangerouslyUseHTMLString: true },
    )
  } catch {
    return
  }
  const count = store.unlinkUnits(props.projectId, selected.value)
  selected.value = []
  ElMessage.success(`已移出 ${count} 个单位`)
}

// ===== 移动到层级 =====
const moveVisible = ref(false)
const moveTargetId = ref<string | null>(null)

interface MoveNodeData {
  id: string
  label: string
  children: MoveNodeData[]
}

const moveTreeData = computed<MoveNodeData[]>(() => {
  const build = (parentId: string | null): MoveNodeData[] =>
    store.childrenOf(props.projectId, parentId).map(n => ({
      id: n.id,
      label: n.name,
      children: build(n.id),
    }))
  const tree = build(null)
  return [
    ...tree,
    { id: UNASSIGNED_NODE_ID, label: '未分配', children: [] },
  ]
})

function openMove() {
  moveTargetId.value = null
  moveVisible.value = true
}

function onMoveTarget(data: MoveNodeData) {
  moveTargetId.value = data.id
}

function confirmMove() {
  if (!moveTargetId.value) return
  const count = store.moveUnits(props.projectId, selected.value, moveTargetId.value)
  const target = moveTargetId.value === UNASSIGNED_NODE_ID ? '未分配' : store.nodePathText(moveTargetId.value)
  selected.value = []
  moveVisible.value = false
  ElMessage.success(`已移动 ${count} 个单位到 ${target}`)
}
</script>

<style scoped>
.unit-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 12px);
  min-height: 0;
  flex: 1;
}

.nature-select { width: 150px; }

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
.batch-actions { margin-left: auto; display: flex; gap: 8px; }

.col-check { width: 44px; }
.col-name { min-width: 180px; }
.col-nature { width: 120px; }
.col-region { min-width: 150px; }
.col-date { width: 110px; }
.col-operator { width: 100px; }
.col-device { width: 80px; }
.col-actions { width: 120px; min-width: 120px; white-space: nowrap; }

.ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.other-tag {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 11px;
  color: var(--notice);
  background: var(--notice-bg);
  border-radius: 4px;
  white-space: nowrap;
}

.unit-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
}
.unit-tag.party { color: var(--accent-primary); background: var(--info-bg); }
.unit-tag.social { color: var(--success-text); background: var(--success-bg); }
.unit-tag.service { color: var(--purple-text, #6D28D9); background: var(--purple-bg); }
.unit-tag.venue { color: var(--warning-text); background: var(--warning-bg); }
.unit-tag.family { color: var(--notice); background: var(--notice-bg); }
.unit-tag.other { color: var(--normal); background: var(--normal-bg); }

.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: 32px 0 !important;
}

.dialog-tip {
  margin: 0 0 10px;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
}
.move-tree-wrap {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  padding: 6px;
}
</style>
