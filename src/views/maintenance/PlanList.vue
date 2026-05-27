<template>
  <div class="plan-page">
    <!-- ===== 内容卡片 ===== -->
    <div class="content-card">

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <!-- 搜索输入框 -->
          <div class="search-input-wrap">
            <input
              v-model="query.planName"
              class="fi-input"
              placeholder="计划名称"
              @keyup.enter="handleSearch"
            />
            <button v-if="query.planName" class="fi-clear" @click="query.planName='';handleSearch()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <!-- 状态下拉 -->
          <div class="fi-select-wrap">
            <el-select
              v-model="query.status"
              placeholder="状态"
              clearable
              class="fi-select"
              :teleported="false"
              popper-class="fi-popper"
            >
              <el-option label="执行中" value="running" />
              <el-option label="待生效" value="pending" />
              <el-option label="已停用" value="stopped" />
              <el-option label="已过期" value="expired" />
            </el-select>
          </div>

          <!-- 周期下拉 -->
          <div class="fi-select-wrap">
            <el-select
              v-model="query.cycle"
              placeholder="周期"
              clearable
              class="fi-select"
              :teleported="false"
              popper-class="fi-popper"
            >
              <el-option label="每日" value="daily" />
              <el-option label="每周" value="weekly" />
              <el-option label="每月" value="monthly" />
              <el-option label="每季" value="quarterly" />
              <el-option label="每年" value="yearly" />
            </el-select>
          </div>

          <!-- 查询按钮 -->
          <button class="btn-primary" @click="handleSearch">查询</button>
        </div>

        <!-- 新增按钮 -->
        <button class="btn-add" @click="handleAdd">
          <AppIcon name="plus" class="btn-add-icon" />
          新增保养计划
        </button>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th col-name"><span>计划名称</span></th>
              <th class="fi-th fi-th-sort col-count" @click="handleSortChange()"><span>设备总数</span><AppIcon name="sort" class="th-sort-icon" /></th>
              <th class="fi-th fi-th-sort col-items" @click="handleSortChange()"><span>保养项目</span><AppIcon name="sort" class="th-sort-icon" /></th>
              <th class="fi-th col-type"><span>保养类型</span></th>
              <th class="fi-th col-executor"><span>执行人</span></th>
              <th class="fi-th fi-th-sort col-time" @click="handleSortChange()"><span>下次生成时间</span><AppIcon name="sort" class="th-sort-icon" /></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr
              v-for="row in store.list"
              :key="row.id"
              class="fi-tbody-tr"
            >
              <td class="fi-td col-status" style="text-align:center">
                <StatusTag :status="row.status" />
              </td>
              <td class="fi-td col-name" style="text-align:center">{{ row.planName }}</td>
              <td class="fi-td col-count" style="text-align:center">{{ row.deviceCount }}</td>
              <td class="fi-td col-items" style="text-align:center">{{ row.maintenanceItems }}项</td>
              <td class="fi-td col-type" style="text-align:center">
                <span class="type-link">{{ cycleLabel(row.maintenanceType) }}</span>
              </td>
              <td class="fi-td col-executor" style="text-align:center">{{ row.executor }}</td>
              <td class="fi-td col-time" style="text-align:center">{{ row.nextGenTime }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" @click="handleView(row)" title="查看">
                    <AppIcon name="preview" class="act-icon" />
                  </button>
                  <button class="act-btn act-edit" @click="handleEdit(row)" title="编辑">
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button class="act-btn act-delete" @click="handleDelete(row)" title="删除">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                  <el-switch v-model="row.enabled" @change="store.toggleStatus(row)" />
                  <button class="act-btn act-copy" @click="handleCopy(row)" title="复制">
                    <AppIcon name="copy" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">
          共 {{ store.total }} 条记录 第 {{ store.query.page }}/{{
            Math.ceil(store.total / store.query.size) || 1
          }} 页
        </span>
        <el-pagination
          v-model:current-page="store.query.page"
          v-model:page-size="store.query.size"
          :total="store.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @change="store.fetchList()"
        />
      </div>

      <!-- ===== 新增/编辑弹窗 ===== -->
      <el-dialog
        v-model="dialogVisible"
        :title="isEdit ? '编辑保养计划' : '新增保养计划'"
        width="520px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="110px"
          label-position="right"
        >
          <el-form-item label="计划名称" prop="planName">
            <el-input v-model="form.planName" placeholder="请输入计划名称" maxlength="50" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" class="w-full">
              <el-option label="执行中" value="running" />
              <el-option label="待生效" value="pending" />
              <el-option label="已停用" value="stopped" />
              <el-option label="已过期" value="expired" />
            </el-select>
          </el-form-item>
          <el-form-item label="保养类型" prop="maintenanceType">
            <el-select v-model="form.maintenanceType" placeholder="请选择保养类型" class="w-full">
              <el-option label="每日保养" value="daily" />
              <el-option label="每周保养" value="weekly" />
              <el-option label="每月保养" value="monthly" />
              <el-option label="每季保养" value="quarterly" />
              <el-option label="每年保养" value="yearly" />
            </el-select>
          </el-form-item>
          <el-form-item label="执行人" prop="executor">
            <el-input v-model="form.executor" placeholder="请输入执行人" />
          </el-form-item>
          <el-form-item label="设备总数" prop="deviceCount">
            <el-input-number v-model="form.deviceCount" :min="0" placeholder="请输入设备总数" class="w-full" />
          </el-form-item>
          <el-form-item label="保养项目数" prop="maintenanceItems">
            <el-input-number v-model="form.maintenanceItems" :min="0" placeholder="请输入保养项目数" class="w-full" />
          </el-form-item>
        </el-form>
        <template #footer>
          <button class="btn-default" @click="dialogVisible = false">取消</button>
          <button class="btn-primary" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '提交中...' : '确定' }}
          </button>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useMaintenanceStore } from '@/stores/maintenance'
import { copyPlan, createPlan, updatePlan } from '@/api/maintenance'
import type { PlanCycle, PlanStatus, MaintenancePlan } from '@/types/maintenance'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const store = useMaintenanceStore()
const { query } = store

const cycleMap: Record<PlanCycle, string> = {
  daily: '每日保养', weekly: '每周保养', monthly: '每月保养',
  quarterly: '每季保养', yearly: '每年保养',
}
const cycleLabel = (type: PlanCycle) => cycleMap[type] || type

const handleSearch = () => { query.page = 1; store.fetchList() }
const handleSortChange = () => { store.fetchList() }

// ===== 新增/编辑弹窗 =====
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const defaultForm = () => ({
  planName: '',
  status: 'pending' as PlanStatus,
  maintenanceType: 'daily' as PlanCycle,
  executor: '',
  deviceCount: 0,
  maintenanceItems: 0,
})
const form = reactive(defaultForm())

const rules: FormRules = {
  planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  maintenanceType: [{ required: true, message: '请选择保养类型', trigger: 'change' }],
  executor: [{ required: true, message: '请输入执行人', trigger: 'blur' }],
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

const handleEdit = (row: MaintenancePlan) => {
  isEdit.value = true
  editId.value = row.id
  form.planName = row.planName
  form.status = row.status
  form.maintenanceType = row.maintenanceType
  form.executor = row.executor
  form.deviceCount = row.deviceCount
  form.maintenanceItems = row.maintenanceItems
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value!.validate()
  submitting.value = true
  try {
    const data = { ...form }
    if (isEdit.value) {
      await updatePlan(editId.value!, data)
      ElMessage.success('编辑成功')
    } else {
      await createPlan(data)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    store.fetchList()
  } finally {
    submitting.value = false
  }
}

const router = useRouter()
const handleView = (row: MaintenancePlan) => { router.push(`/maintenance/plans/detail/${row.id}`) }
const handleDelete = async (row: MaintenancePlan) => {
  await ElMessageBox.confirm(`确认删除「${row.planName}」？`, '提示', { type: 'warning' })
  store.removePlan(row.id)
}
const handleCopy = async (row: MaintenancePlan) => {
  await copyPlan(row.id)
  ElMessage.success('复制成功')
  store.fetchList()
}
onMounted(() => { store.fetchList() })
</script>

<style scoped>
/* ===== 布局 ===== */
.plan-page { height: 100%; }

.content-card {
  background: var(--bg-card);
  border-radius: 4px;
  padding: var(--spacing-lg, 12px);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-xxl, 24px);
}

/* ===== 筛选栏 ===== */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.filter-left {
  display: flex;
  align-items: center;
  gap: 26px;
}

/* -- 搜索输入框 -- */
.search-input-wrap {
  position: relative;
  width: 208px;
}
.fi-input {
  width: 100%;
  height: 36px;
  border: 1px solid var(--border-high);
  border-radius: var(--radius-md, 8px);
  padding: 8px 32px 8px var(--spacing-xl, 16px);
  font-size: var(--font-small, 14px);
  font-weight: 400;
  color: var(--text-primary);
  background: var(--bg-card);
  outline: none;
}
.fi-input::placeholder { color: var(--text-placeholder); }
.fi-input:focus { border-color: var(--accent-primary); }
.fi-icon {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%);
  width: 18px; height: 18px; opacity: .4;
  pointer-events: none; color: var(--text-muted);
}
.fi-clear {
  position: absolute; right: 30px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;
  padding: 0; color: var(--text-muted);
}

/* -- 下拉选择 -- */
.fi-select-wrap { width: 193px; }
.fi-select-wrap :deep(.el-select) { width: 100%; }
.fi-select-wrap :deep(.el-select__wrapper) {
  border: 1px solid var(--border-high) !important;
  border-radius: var(--radius-md, 8px);
  padding: 8px var(--spacing-xl, 16px);
  box-shadow: none !important;
  background: var(--bg-card) !important;
  height: 36px;
}
.fi-select-wrap :deep(.el-select__wrapper:hover),
.fi-select-wrap :deep(.el-select__wrapper.is-focus) {
  border-color: var(--accent-primary) !important; box-shadow: none !important;
}
.fi-select-wrap :deep(.el-select__placeholder) { color: var(--text-placeholder); }
.fi-select-wrap :deep(.el-select__caret) { color: var(--text-placeholder); }

/* -- 新增按钮（PlanList 特有，含图标） -- */
.btn-add {
  height: 37px;
  background: var(--accent-primary10);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-md, 8px) var(--spacing-lg, 12px);
  font-size: var(--font-small, 14px);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}
.btn-add:hover { filter: brightness(0.95); }
.btn-add-icon { width: 20px; height: 20px; }

/* ===== 表格 ===== */
.table-wrap { flex: 1; overflow: auto; -webkit-overflow-scrolling: touch; }
.fi-table { width: 100%; border-collapse: collapse; table-layout: auto; }

/* 列宽基线 */
.col-status { width: 125px; min-width: 100px; }
.col-name { min-width: 140px; }
.col-count { width: 120px; }
.col-items { width: 120px; }
.col-type { width: 120px; }
.col-executor { width: 110px; }
.col-time { width: 180px; }
.col-actions { width: 200px; min-width: 180px; white-space: nowrap; }

/* ===== 响应式列隐藏 ===== */

/* ≤1550px 隐藏设备总数、执行人 */
@media (max-width: 1550px) {
  .col-count, .col-executor { display: none !important; }
}
/* ≤1250px 隐藏保养项目 */
@media (max-width: 1250px) {
  .col-items { display: none !important; }
}
/* ≤1050px 隐藏下次生成时间，操作列缩小 */
@media (max-width: 1050px) {
  .col-time { display: none !important; }
  .col-actions { width: 160px; min-width: 160px; }
  .action-cell { gap: 6px; }
}

/* 内容卡片响应式 */
@media (max-width: 1280px) {
  .content-card { gap: var(--spacing-xl, 16px); }
  .filter-left { gap: var(--spacing-xl, 16px); flex-wrap: wrap; }
}
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: 12px; align-items: stretch; }
  .filter-left { flex-wrap: wrap; }
  .pagination-wrap { flex-direction: column; gap: 12px; align-items: flex-start; }
}

/* 表头 */
.fi-thead-tr { background: var(--table-header-bg); }
.fi-th {
  border-bottom: 1px solid var(--border-low);
  padding: 10px;
  font-size: var(--font-h4, 16px);
  font-weight: 400;
  color: var(--table-header-text);
  text-align: center;
  white-space: nowrap;
}
.fi-th-sort {
  display: table-cell;
  cursor: pointer;
  user-select: none;
}
.fi-th-sort span { vertical-align: middle; }
.th-sort-icon {
  width: 18px; height: 18px;
  margin-left: 2px;
  vertical-align: middle;
  opacity: .5;
  color: var(--table-header-text);
}

/* 表体 */
.fi-tbody-tr { border-bottom: 1px solid var(--border-low); }
.fi-tbody-tr:nth-child(even) { background: var(--bg-sub-card); }
.fi-tbody-tr:hover { background: var(--table-row-hover); }
.fi-td {
  padding: 10px;
  font-size: var(--font-body, 16px);
  font-weight: 400;
  color: var(--text-primary);
  white-space: nowrap;
}

/* 保养类型链接 */
.type-link { color: var(--accent-primary); cursor: pointer; font-size: var(--font-body, 16px); }

/* 操作列 */
.action-cell { display: flex; align-items: center; gap: 10px; }
/* 分页 */
.pagination-wrap {
  display: flex; align-items: center; justify-content: space-between;
}
.pagi-total { color: var(--pagi-text); font-size: var(--font-small, 14px); }

/* ===== Element Plus 组件 Dark 适配 ===== */
/* loading 遮罩 */
:deep(.el-loading-mask) {
  background-color: var(--bg-card); color: var(--accent-primary);
}
:deep(.el-loading-mask .el-loading-text) { color: var(--text-secondary); }
:deep(.el-loading-mask .path) { stroke: var(--accent-primary); }

/* switch 开关 */
:deep(.el-switch__core) { background-color: var(--border-high); }
:deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--accent-primary); border-color: var(--accent-primary);
}

/* 分页器 */
:deep(.el-pagination .el-pager li) {
  background-color: var(--pagi-bg); color: var(--pagi-text);
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .el-pager li.is-active) {
  background-color: var(--accent-primary); color: #fff;
  border-color: var(--accent-primary);
}
:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important;
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .btn-prev.is-disabled),
:deep(.el-pagination .btn-next.is-disabled) {
  color: var(--text-muted) !important; background-color: var(--pagi-bg) !important;
}

/* 每页条数选择器 */
:deep(.el-pagination .el-select .el-select__wrapper) {
  background-color: var(--bg-card) !important; color: var(--text-secondary);
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-select .el-select__placeholder) { color: var(--text-secondary); }

/* 前往页面输入框 */
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-pagination__jump .el-input__inner) {
  color: var(--text-primary) !important;
  background-color: var(--bg-card);
}

/* ===== 弹窗 Dark 适配 ===== */
.w-full { width: 100%; }

/* el-dialog 样式覆盖（Teleport 到 body，需全局 CSS 处理） */
/* 全局 CSS 在 style.css 中通过 html.dark 选择器处理 */
/* 此处做组件内可触及的样式覆盖 */

/* el-input-number 宽度填充 */
:deep(.el-input-number.w-full) { width: 100%; }

/* 弹窗内表单项间距 */
:deep(.el-dialog .el-form-item) { margin-bottom: 18px; }
:deep(.el-dialog .el-form-item:last-child) { margin-bottom: 0; }

</style>
