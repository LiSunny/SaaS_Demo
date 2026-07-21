<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 4 阶段统计卡片 ===== -->
      <div class="metric-row">
        <div class="metric-card metric-prepare">
          <span class="metric-value">{{ stats.prepare }}</span>
          <span class="metric-label">复工准备</span>
        </div>
        <div class="metric-card metric-review">
          <span class="metric-value">{{ stats.review }}</span>
          <span class="metric-label">复工审核</span>
        </div>
        <div class="metric-card metric-trial">
          <span class="metric-value">{{ stats.trial }}</span>
          <span class="metric-label">试产观察</span>
        </div>
        <div class="metric-card metric-production">
          <span class="metric-value">{{ stats.production }}</span>
          <span class="metric-label">正式复产</span>
        </div>
      </div>

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input v-model="query.keyword" class="fi-input" placeholder="复工场所" @keyup.enter="store.search()" />
            <button v-if="query.keyword" class="fi-clear" @click="query.keyword = ''; store.search()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <div class="fi-select-wrap">
            <el-select v-model="query.status" placeholder="全部状态" clearable :teleported="false" popper-class="fi-popper" @change="store.search()">
              <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </div>

          <button class="btn-primary" @click="store.search()">查询</button>
          <button v-if="hasFilter" class="btn-default" @click="handleReset">重置</button>
        </div>

        <div class="filter-right">
          <div class="view-toggle">
            <button :class="['toggle-btn', viewMode === 'card' ? 'active' : '']" @click="viewMode = 'card'" title="卡片视图">▦</button>
            <button :class="['toggle-btn', viewMode === 'list' ? 'active' : '']" @click="viewMode = 'list'" title="列表视图">☰</button>
          </div>
          <button class="btn-default" @click="goBigscreen">
            📊 可视化大屏
          </button>
          <button class="btn-outline-primary" @click="openCreateDialog">
            <AppIcon name="plus" class="btn-add-icon" />新建计划
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div v-if="viewMode === 'list'" class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-name"><span>复工场所</span></th>
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th fi-th-sort col-date" @click="toggleDateSort">
                <span>开始时间</span>
                <TableSortIcon :direction="dateSortDir" />
              </th>
              <th class="fi-th col-date2"><span>完成时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-name">{{ row.locationName }}</td>
              <td class="fi-td col-status">
                <StatusTag :status="planStatusKey(row)" />
              </td>
              <td class="fi-td col-date">{{ row.startedAt || '—' }}</td>
              <td class="fi-td col-date2">{{ row.completedAt || '—' }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" title="查看详情" @click="$router.push(`/resumption/${row.id}`)">
                    <AppIcon name="preview" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 卡片视图 ===== -->
      <div v-if="viewMode === 'card'" class="card-grid" v-loading="store.loading">
        <div v-for="plan in store.list" :key="plan.id" class="plan-card" @click="$router.push(`/resumption/${plan.id}`)">
          <div class="card-header">
            <h4 class="card-name">{{ plan.locationName }}</h4>
            <StatusTag :status="`plan_${plan.status}`" />
          </div>
          <div class="card-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: stepPercent(plan) + '%' }" :class="plan.status === 'production' ? 'fill-success' : ''" />
            </div>
            <span class="progress-text">{{ plan.currentStep }}/11 步</span>
          </div>
          <div class="card-meta">
            <span>开始：{{ plan.startedAt || '—' }}</span>
            <span v-if="plan.completedAt">完成：{{ plan.completedAt }}</span>
          </div>
        </div>
        <div v-if="!store.loading && store.list.length === 0" class="card-empty">暂无复工计划</div>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ store.total }} 条记录 第 {{ store.query.page }}/{{ Math.ceil(store.total / store.query.size) || 1 }} 页</span>
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

    </div>

    <!-- ===== 新建计划 Dialog ===== -->
    <el-dialog v-model="dialogVisible" title="新建复工计划" width="440px" @closed="dialogForm.locationName = ''; dialogForm.locationId = undefined">
      <el-form :model="dialogForm" label-width="80px">
        <el-form-item label="复工场所" required>
          <el-select
            v-model="dialogForm.locationId"
            filterable
            allow-create
            clearable
            placeholder="选择或输入复工场所"
            :teleported="false"
            popper-class="fi-popper"
            style="width: 100%"
            @change="onUnitSelect"
          >
            <el-option
              v-for="u in unitOptions"
              :key="u.id"
              :label="u.name"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn-default" @click="dialogVisible = false">取消</button>
        <button class="btn-primary" :disabled="!dialogForm.locationName.trim() || creating" @click="handleCreate">
          {{ creating ? '创建中...' : '确定' }}
        </button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useResumptionStore } from '@/stores/resumption'
import type { ResumptionPlanItem } from '@/types/resumption'
import { createResumptionPlan, getManagementUnits } from '@/api/adapters/resumption-dao'
import type { ManagementUnit } from '@/api/adapters/resumption-dao'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'

const router = useRouter()
const store = useResumptionStore()
const query = store.query

// ===== 统计 =====
const stats = computed(() => ({
  prepare: store.list.filter(p => p.status === 'prepare').length,
  review: store.list.filter(p => p.status === 'review').length,
  trial: store.list.filter(p => p.status === 'trial').length,
  production: store.list.filter(p => p.status === 'production').length,
}))

// ===== 视图切换 =====
const viewMode = ref<'card' | 'list'>('list')

function stepPercent(plan: ResumptionPlanItem): number {
  return Math.round((plan.currentStep / 11) * 100)
}

// ===== 筛选 =====
const statusOptions = [
  { label: '复工准备', value: 'prepare' },
  { label: '复工审核', value: 'review' },
  { label: '试产观察', value: 'trial' },
  { label: '正式复产', value: 'production' },
]

const hasFilter = computed(() => !!query.keyword || !!query.status)

function handleReset() {
  query.keyword = ''
  query.status = ''
  store.search()
}

// ===== 排序 =====
const dateSortDir = ref<'none' | 'asc' | 'desc'>('desc')

function toggleDateSort() {
  if (dateSortDir.value === 'none') dateSortDir.value = 'desc'
  else if (dateSortDir.value === 'desc') dateSortDir.value = 'asc'
  else dateSortDir.value = 'none'
  if (dateSortDir.value === 'none') {
    store.fetchList()
  } else {
    store.list.sort((a, b) => dateSortDir.value === 'asc'
      ? new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
      : new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  }
}

// ===== 状态映射 =====
function planStatusKey(row: ResumptionPlanItem): string {
  return `plan_${row.status}`
}

// ===== 管理单元数据 =====
const unitOptions = ref<ManagementUnit[]>([])

async function loadUnits() {
  unitOptions.value = await getManagementUnits(1) // light 阶段固定 enterpriseId=1
}

// ===== 新建计划 =====
const dialogVisible = ref(false)
const dialogForm = ref({ locationName: '', locationId: undefined as number | undefined })
const creating = ref(false)

function onUnitSelect(id: number | string | undefined) {
  if (id === undefined || id === '') {
    dialogForm.value.locationName = ''
    dialogForm.value.locationId = undefined
    return
  }
  if (typeof id === 'number') {
    // 选择了已有管理单元
    const unit = unitOptions.value.find(u => u.id === id)
    dialogForm.value.locationName = unit?.name || ''
    dialogForm.value.locationId = id
  } else {
    // allow-create：用户输入了新名称
    dialogForm.value.locationName = id
    dialogForm.value.locationId = undefined
  }
}

function goBigscreen() {
  router.push('/resumption-bigscreen')
}

function openCreateDialog() {
  dialogForm.value.locationName = ''
  dialogForm.value.locationId = undefined
  dialogVisible.value = true
}

async function handleCreate() {
  const name = dialogForm.value.locationName.trim()
  if (!name) return
  creating.value = true
  try {
    await createResumptionPlan(name, 1, dialogForm.value.locationId)
    ElMessage.success(`复工计划「${name}」已创建`)
    dialogVisible.value = false
    store.fetchList()
  } finally {
    creating.value = false
  }
}

onMounted(async () => { await loadUnits(); await store.fetchList() })
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-lg, 12px); overflow: hidden;
}

/* 固定表头 */
.fi-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* ===== 统计卡片 ===== */
.metric-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; flex-shrink: 0;
}
.metric-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 20px;
  display: flex; flex-direction: column; gap: 4px;
}
.metric-value { font-size: 32px; font-weight: 700; color: var(--text-primary); }
.metric-label { font-size: var(--font-small, 14px); color: var(--text-muted); }
.metric-prepare { border-left: 3px solid var(--accent-primary); }
.metric-review { border-left: 3px solid var(--warning, #D97706); }
.metric-trial { border-left: 3px solid #F59E0B; }
.metric-production { border-left: 3px solid var(--success, #059669); }

/* ===== 视图切换按钮 ===== */
.view-toggle { display: flex; gap: 4px; margin-right: 8px; }
.toggle-btn {
  width: 32px; height: 32px; border: 1px solid var(--border-default); border-radius: 6px;
  background: var(--bg-card); color: var(--text-muted); cursor: pointer;
  font-size: 16px; display: flex; align-items: center; justify-content: center;
}
.toggle-btn.active { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
.toggle-btn:hover:not(.active) { border-color: var(--accent-primary); color: var(--accent-primary); }

/* ===== 卡片视图 ===== */
.card-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px; overflow: auto; align-content: start;
}
.plan-card {
  background: var(--bg-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px); padding: 16px; cursor: pointer;
  display: flex; flex-direction: column; gap: 12px; transition: box-shadow .15s;
}
.plan-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-name { font-size: var(--font-body, 16px); font-weight: 500; color: var(--text-primary); margin: 0; }
.card-progress { display: flex; align-items: center; gap: 10px; }
.progress-bar { flex: 1; height: 6px; background: var(--bg-sub-card); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent-primary); border-radius: 3px; transition: width .3s; }
.progress-fill.fill-success { background: var(--success, #059669); }
.progress-text { font-size: var(--font-xs, 12px); color: var(--text-muted); white-space: nowrap; }
.card-meta { display: flex; gap: 16px; font-size: var(--font-xs, 12px); color: var(--text-muted); }
.card-empty { text-align: center; padding: 48px; color: var(--text-muted); font-size: var(--font-body, 16px); }

/* ===== 筛选栏 ===== */
.fi-select-wrap { width: 130px; flex-shrink: 0; }

.btn-outline-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--info-bg); color: var(--accent-primary);
  border: 1px solid var(--accent-primary); cursor: pointer;
  white-space: nowrap; transition: all .2s;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }

/* ===== 列宽 ===== */
.col-status { width: 90px; }
.col-name { min-width: 140px; }
.col-step { min-width: 100px; }
.col-date { min-width: 110px; }
.col-date2 { min-width: 110px; }
.col-actions { width: 70px; min-width: 70px; white-space: nowrap; }

/* ===== 响应式 ===== */
@media (max-width: 1550px) { .col-date2 { display: none !important; } }
@media (max-width: 1250px) { .col-step { display: none !important; } }
@media (max-width: 1050px) {  }
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
  .metric-row { grid-template-columns: repeat(2, 1fr); }
}

/* ===== 分页器 ===== */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; background-color: var(--bg-card); }

/* ===== Dialog ===== */
:deep(.el-dialog) {
  border-radius: var(--radius-xl, 14px);
}
</style>
