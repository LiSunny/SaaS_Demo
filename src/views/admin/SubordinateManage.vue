<template>
  <div class="sub-tab">
    <!-- ===== 筛选栏 ===== -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="search-input-wrap">
          <input
            v-model="query.keyword"
            class="fi-input"
            placeholder="企业名称"
            @keyup.enter="handleSearch"
          />
          <button v-if="query.keyword" class="fi-clear" @click="query.keyword='';handleSearch()">
            <AppIcon name="clear" />
          </button>
          <AppIcon name="search" class="fi-icon" />
        </div>

        <button class="btn-primary" @click="handleSearch">查询</button>
      </div>

      <div class="filter-right">
        <button class="btn-outline-primary" @click="openBindDialog()">
          <AppIcon name="plus" class="btn-icon" />
          关联下级
        </button>
        <button
          class="btn-outline-danger"
          :disabled="selectedIds.size === 0"
          @click="handleBatchRemove"
        >
          <AppIcon name="delete" class="btn-icon" />
          关系解除
        </button>
      </div>
    </div>

    <!-- ===== 数据表格 ===== -->
    <div class="table-wrap">
      <table class="fi-table">
        <thead>
          <tr class="fi-thead-tr">
            <th class="fi-th col-check">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
              />
            </th>
            <th class="fi-th col-name"><span>企业名称</span></th>
            <th class="fi-th col-tags"><span>标签</span></th>
            <th class="fi-th fi-th-sort col-date" @click="handleSortChange()">
              <span>关联日期</span>
              <TableSortIcon :direction="sortDir" />
            </th>
            <th class="fi-th col-operator"><span>操作人</span></th>
            <th class="fi-th col-actions"><span>操作</span></th>
          </tr>
        </thead>
        <tbody v-loading="loading">
          <tr
            v-for="row in list"
            :key="row.id"
            class="fi-tbody-tr"
          >
            <td class="fi-td col-check">
              <input
                type="checkbox"
                :checked="selectedIds.has(row.id)"
                @change="toggleSelect(row.id)"
              />
            </td>
            <td class="fi-td col-name">{{ row.enterpriseName }}</td>
            <td class="fi-td col-tags">
              <span v-if="row.tags.length">{{ row.tags.join('、') }}</span>
              <span v-else class="text-muted">--</span>
            </td>
            <td class="fi-td col-date">{{ row.relatedAt?.slice(0, 10) || '--' }}</td>
            <td class="fi-td col-operator">{{ row.operatorName || '--' }}</td>
            <td class="fi-td col-actions">
              <div class="action-cell">
                <button class="act-btn act-edit" title="编辑" @click="openEditDialog(row)">
                  <AppIcon name="edit" class="act-icon" />
                </button>
                <button class="act-btn act-delete" title="关系解除" @click="handleRemoveSingle(row)">
                  <AppIcon name="delete" class="act-icon" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && list.length === 0">
            <td :colspan="6" class="fi-td empty-cell">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== 分页 ===== -->
    <div class="pagination-wrap">
      <span class="pagi-total">
        共 {{ total }} 条记录 第 {{ query.page }}/{{ Math.ceil(total / query.size) || 1 }} 页
      </span>
      <el-pagination
        v-model:current-page="query.page"
        :total="total"
        :page-size="query.size"
        :pager-count="5"
        layout="prev, pager, next"
        background
        @current-change="fetch"
      />
    </div>

    <!-- ===== 编辑弹窗 ===== -->
    <el-dialog
      v-model="editVisible"
      title="编辑下级关联"
      width="600px"
      :close-on-click-modal="false"
      @closed="resetEditForm"
    >
      <div class="dialog-form">
        <div class="dialog-field">
          <label class="dialog-label">企业名称</label>
          <el-select
            v-model="editForm.enterpriseId"
            placeholder="企业名称"
            disabled
            class="dialog-select"
            :teleported="false"
            popper-class="fi-popper"
          >
            <el-option
              v-for="e in editSearchResults"
              :key="e.id"
              :label="e.name"
              :value="e.id"
            />
          </el-select>
        </div>

        <div class="dialog-field">
          <label class="dialog-label">企业标签</label>
          <el-select
            v-model="editForm.tags"
            placeholder="选择标签"
            multiple
            class="dialog-select"
            :teleported="false"
            popper-class="fi-popper"
          >
            <el-option
              v-for="t in tagOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </div>
      </div>

      <template #footer>
        <button class="btn-default" @click="editVisible = false">取消</button>
        <button class="btn-primary" :disabled="editSubmitting" @click="handleEditConfirm">
          {{ editSubmitting ? '保存中...' : '保存' }}
        </button>
      </template>
    </el-dialog>
    <!-- ===== 关联弹窗 ===== -->
    <el-dialog
      v-model="bindVisible"
      title="关联下级"
      width="600px"
      :close-on-click-modal="false"
      @closed="resetBindForm"
    >
      <div class="dialog-form">
        <div class="dialog-field">
          <label class="dialog-label required">企业名称</label>
          <el-select
            v-model="bindForm.enterpriseId"
            placeholder="输入企业名称模糊搜索"
            filterable
            remote
            :remote-method="searchEnterprises"
            :loading="searchLoading"
            class="dialog-select"
            :teleported="false"
            popper-class="fi-popper"
            clearable
          >
            <el-option
              v-for="e in searchResults"
              :key="e.id"
              :label="e.name"
              :value="e.id"
            />
          </el-select>
        </div>

        <div class="dialog-field">
          <label class="dialog-label">企业标签</label>
          <el-select
            v-model="bindForm.tags"
            placeholder="选择标签"
            multiple
            class="dialog-select"
            :teleported="false"
            popper-class="fi-popper"
          >
            <el-option
              v-for="t in tagOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </div>
      </div>

      <template #footer>
        <button class="btn-default" @click="bindVisible = false">取消</button>
        <button class="btn-primary" :disabled="bindSubmitting" @click="handleBindConfirm">
          {{ bindSubmitting ? '保存中...' : '保存' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import {
  getSubordinates,
  addSubordinates,
  updateSubordinate,
  removeSubordinates,
  searchEnterprises as searchEntReq,
  getTagDict,
} from '@/api/enterprise'
import type { SubordinateItem } from '@/types/enterprise'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'

const props = defineProps<{
  enterpriseId: string
}>()

const { confirmRemove, confirmBatchRemove } = useConfirm()

// ===== 列表 =====
const sortDir = ref<'none' | 'asc' | 'desc'>('none')
const query = reactive({
  keyword: '',
  page: 1,
  size: 10,
  sortOrder: 'desc' as 'asc' | 'desc',
})

const list = ref<SubordinateItem[]>([])
const total = ref(0)
const loading = ref(false)

async function fetch() {
  loading.value = true
  try {
    const res = await getSubordinates(props.enterpriseId, {
      keyword: query.keyword,
      page: query.page,
      size: query.size,
    })
    list.value = res.data
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetch()
}

function handleSortChange() {
  if (sortDir.value === 'none') sortDir.value = 'desc'
  else if (sortDir.value === 'desc') sortDir.value = 'asc'
  else sortDir.value = 'none'
  query.sortOrder = sortDir.value === 'none' ? 'desc' : sortDir.value
  fetch()
}

// ===== 复选框 =====
const selectedIds = ref(new Set<string>())

const isAllSelected = computed(() =>
  list.value.length > 0 && list.value.every(r => selectedIds.value.has(r.id))
)
const isIndeterminate = computed(() =>
  list.value.some(r => selectedIds.value.has(r.id)) && !isAllSelected.value
)

function toggleSelectAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    list.value.forEach(r => selectedIds.value.add(r.id))
  } else {
    list.value.forEach(r => selectedIds.value.delete(r.id))
  }
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

// ===== 关联弹窗 =====
const bindVisible = ref(false)
const bindSubmitting = ref(false)

interface BindForm {
  enterpriseId: string
  tags: string[]
}
const bindForm = reactive<BindForm>({
  enterpriseId: '',
  tags: [],
})

const searchLoading = ref(false)
const searchResults = ref<{ id: string; name: string; tags: string[] }[]>([])

async function searchEnterprises(kw: string) {
  if (!kw || kw.length < 1) {
    searchResults.value = []
    return
  }
  searchLoading.value = true
  try {
    const res = await searchEntReq(props.enterpriseId, kw)
    searchResults.value = res
  } finally {
    searchLoading.value = false
  }
}

function openBindDialog() {
  bindForm.enterpriseId = ''
  bindForm.tags = []
  searchResults.value = []
  bindVisible.value = true
}

function resetBindForm() {
  bindForm.enterpriseId = ''
  bindForm.tags = []
  searchResults.value = []
}

async function handleBindConfirm() {
  if (!bindForm.enterpriseId) {
    ElMessage.warning('请选择企业')
    return
  }
  bindSubmitting.value = true
  try {
    await addSubordinates(props.enterpriseId, [bindForm.enterpriseId])
    ElMessage.success('关联成功')
    bindVisible.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    bindSubmitting.value = false
  }
}

// ===== 编辑弹窗 =====
const editVisible = ref(false)
const editSubmitting = ref(false)
const editingId = ref('')

interface EditForm {
  enterpriseId: string
  tags: string[]
}
const editForm = reactive<EditForm>({
  enterpriseId: '',
  tags: [],
})

const editSearchResults = ref<{ id: string; name: string }[]>([])

function openEditDialog(row: SubordinateItem) {
  editingId.value = row.id
  editForm.enterpriseId = String(row.enterpriseId)
  editForm.tags = [...(row.tags || [])]
  // 预填搜索结果，让 el-select 能正确显示企业名称而非原始 ID
  editSearchResults.value = [{ id: String(row.enterpriseId), name: row.enterpriseName }]
  editVisible.value = true
}

function resetEditForm() {
  editForm.enterpriseId = ''
  editForm.tags = []
  editSearchResults.value = []
  editingId.value = ''
}

async function handleEditConfirm() {
  editSubmitting.value = true
  try {
    await updateSubordinate(props.enterpriseId, editingId.value, {
      tags: editForm.tags,
    })
    ElMessage.success('编辑成功')
    editVisible.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    editSubmitting.value = false
  }
}

// ===== 删除 =====
async function handleRemoveSingle(row: SubordinateItem) {
  try {
    await confirmRemove(row.enterpriseName)
    await removeSubordinates(props.enterpriseId, [row.id])
    ElMessage.success('已解除关联')
    fetch()
  } catch { /* 取消 */ }
}

async function handleBatchRemove() {
  if (selectedIds.value.size === 0) {
    ElMessage.warning('请先选择下级企业')
    return
  }
  const ids = [...selectedIds.value]
  const names = list.value
    .filter(r => ids.includes(r.id))
    .map(r => r.enterpriseName)
    .join('、')
  try {
    await confirmBatchRemove(names)
    await removeSubordinates(props.enterpriseId, ids)
    ElMessage.success('已解除关联')
    selectedIds.value = new Set()
    fetch()
  } catch { /* 取消 */ }
}

// ===== 字典 =====
const tagOptions = ref<{ value: string; label: string }[]>([])

async function loadDicts() {
  try {
    const res = await getTagDict()
    tagOptions.value = res.data
  } catch (e: any) {
    console.error('加载标签字典失败', e)
  }
}

// ===== 初始加载 =====
onMounted(() => {
  loadDicts()
  fetch()
})

watch(() => props.enterpriseId, () => {
  query.page = 1
  fetch()
})
</script>

<style scoped>
/* ========== Tab 容器 ========== */
.sub-tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl, 16px);
  height: 100%;
}

/* ========== 筛选栏 ========== */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: var(--spacing-xl, 16px);
}

.filter-left,
.filter-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 12px);
}

.search-input-wrap {
  position: relative;
  width: 240px;
}

.fi-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 36px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 4px);
  font-size: var(--font-small);
  color: var(--text-primary);
  background: var(--bg-card);
  outline: none;
}

.fi-input:focus {
  border-color: var(--accent-primary);
}

.fi-input::placeholder {
  color: var(--text-placeholder);
}

.fi-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

.fi-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 2px;
  display: flex;
  align-items: center;
}

/* ========== 轮廓按钮 ========== */
.btn-outline-primary,
.btn-outline-danger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: var(--btn-height);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--btn-radius);
  font-size: var(--btn-font-size);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, opacity 0.2s;
  background: var(--semantic-danger-bg);
  color: var(--danger);
  border: 1px solid rgba(220, 38, 38, 0.2);
}
.btn-outline-danger:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.18);
}
.btn-outline-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-outline-primary {
  background: var(--accent-primary10);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}
.btn-outline-primary:hover {
  background: rgba(54, 120, 227, 0.15);
}

.btn-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* ========== 按钮 ========== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--btn-height, 36px);
  padding: 0 var(--spacing-lg, 16px);
  background: var(--accent-primary);
  color: #fff;
  border: none;
  border-radius: var(--btn-radius, 4px);
  font-size: var(--btn-font-size, 14px);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--btn-height, 36px);
  padding: 0 var(--spacing-lg, 16px);
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--btn-radius, 4px);
  font-size: var(--btn-font-size, 14px);
  cursor: pointer;
}

/* ========== 表格列宽 ========== */
.col-check { width: 50px; min-width: 50px; }
.col-name { min-width: 160px; }
.col-tags { min-width: 120px; }
.col-date { width: 183px; min-width: 120px; cursor: pointer; }
.col-operator { width: 110px; min-width: 80px; }
.col-actions { width: 110px; min-width: 110px; white-space: nowrap; }

.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: 48px 0;
}

.text-muted {
  color: var(--text-muted);
}

/* ========== 分页 ========== */
.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.pagi-total {
  font-size: var(--font-small);
  color: var(--pagi-text);
}

/* ===== 分页器 ===== */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }

/* ========== 操作按钮 ========== */
.action-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.act-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-sm, 4px);
  transition: background 0.15s;
  color: var(--text-tertiary);
}

.act-edit:hover {
  background: var(--accent-primary10);
  color: var(--accent-primary);
}

.act-delete:hover {
  background: var(--semantic-danger-bg);
  color: var(--danger);
}

.act-icon {
  width: 18px;
  height: 18px;
}

/* ========== 弹窗表单 ========== */
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxl, 24px);
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 8px);
  align-items: stretch;
}

.dialog-label {
  font-size: var(--font-body);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.dialog-label.required::before {
  content: '*';
  color: var(--danger);
  font-weight: 500;
  font-size: var(--font-h3);
}

.dialog-select {
  width: 100%;
}

/* ========== 响应式 ========== */
@media (max-width: 800px) {
  .filter-bar {
    flex-direction: column;
    gap: var(--spacing-lg);
    align-items: stretch;
  }
  .pagination-wrap {
    flex-direction: column;
    gap: var(--spacing-lg);
    align-items: flex-start;
  }
}
</style>
