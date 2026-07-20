<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 引导说明卡片 ===== -->
      <div v-if="showHelp" class="help-card">
        <div class="help-illustration">
          <img :src="helpImg" alt="复工复产说明" class="help-img" />
        </div>
        <div class="help-content">
          <div class="help-section">
            <h3 class="help-title">什么是复工复产管理？</h3>
            <p class="help-text">工厂企业在节后/停产检修/临时停工后，按"六个一"法规要求，以车间为履责主体，完成"建组→签责→培训→排查→体检→整改→验收→复工令→试产→归档"全流程闭环管理。</p>
          </div>
          <div class="help-section">
            <h3 class="help-subtitle">如何使用？</h3>
            <ul class="help-list">
              <li><strong>新建复工计划：</strong>点击"新建计划"，填写复工场所（如车间、门店、库区），系统自动创建 11 个串行步骤。</li>
              <li><strong>查看流程进度：</strong>点击"查看详情"，查看每个步骤的执行状态和操作记录。</li>
              <li><strong>看板总览：</strong>点击"复工看板"，一屏查看全厂各车间复工进度。</li>
            </ul>
          </div>
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
          <button class="btn-outline-primary" @click="$router.push('/resumption/dashboard')">
            复工看板
          </button>
          <button class="btn-outline-primary" @click="openCreateDialog">
            <AppIcon name="plus" class="btn-add-icon" />新建计划
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-name"><span>复工场所</span></th>
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th col-step"><span>当前阶段</span></th>
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
                <StatusTag :status="planStatusKey(row)" :label="planStatusLabel(row)" />
              </td>
              <td class="fi-td col-step">{{ currentStepLabel(row) }}</td>
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
import { ElMessage } from 'element-plus'
import { useResumptionStore } from '@/stores/resumption'
import type { ResumptionPlanItem } from '@/types/resumption'
import { getStageLabel, createResumptionPlan, getManagementUnits } from '@/api/adapters/resumption-dao'
import type { ManagementUnit } from '@/api/adapters/resumption-dao'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'
import helpImg from '@/assets/zhuhu.png'

const store = useResumptionStore()
const query = store.query

// ===== 引导说明 =====
const showHelp = ref(true)

// ===== 筛选 =====
const statusOptions = [
  { label: '筹备中', value: 'preparing' },
  { label: '试产中', value: 'trial' },
  { label: '已归档', value: 'archived' },
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

function planStatusLabel(row: ResumptionPlanItem): string {
  const map: Record<string, string> = { preparing: '筹备中', trial: '试产中', archived: '已归档' }
  return map[row.status] || row.status
}

function currentStepLabel(row: ResumptionPlanItem): string {
  return getStageLabel(row)
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

/* ===== 引导卡片 ===== */
.help-card {
  background: var(--bg-sub-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px); padding: var(--spacing-lg, 12px);
  display: flex; gap: 10px; align-items: center; flex-shrink: 0;
}
.help-illustration { width: 242px; height: 156px; border-radius: 8px; flex-shrink: 0; overflow: hidden; }
.help-illustration img { display: block; width: 100%; height: 100%; object-fit: cover; }
.help-content { display: flex; flex-direction: column; gap: 10px; padding: 0 var(--spacing-lg, 12px); flex: 1; min-width: 0; }
.help-section { display: flex; flex-direction: column; gap: 6px; }
.help-title { font-size: var(--font-h4, 16px); font-weight: 600; color: var(--text-primary); margin: 0; }
.help-subtitle { font-size: var(--font-body, 16px); font-weight: 500; color: var(--text-primary); margin: 0; }
.help-text { font-size: var(--font-small, 14px); color: var(--text-secondary); line-height: 1.6; margin: 0; }
.help-list { margin: 0; padding-left: 20px; font-size: var(--font-small, 14px); color: var(--text-secondary); line-height: 1.8; }
.help-list li { margin-bottom: 0; }
.help-list li strong { color: var(--text-primary); }

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
  .help-card { flex-direction: column; }
  .help-illustration { width: 100%; }
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
