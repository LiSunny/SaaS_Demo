<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input v-model="query.keyword" class="fi-input" placeholder="设备名称" @keyup.enter="store.search()" />
            <button v-if="query.keyword" class="fi-clear" @click="query.keyword = ''; store.search()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <button class="btn-primary" @click="store.search()">查询</button>
        </div>

        <div class="filter-right">
          <button class="btn-outline-primary" @click="openCreate">
            <AppIcon name="plus" class="btn-add-icon" />新增设备
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th fi-th-sort col-status" @click="toggleStatusSort">
                <span>状态</span>
                <TableSortIcon :direction="statusSortDir" />
                <TableFilterPopover v-model="statusFilter" :options="statusFilterOptions" />
              </th>
              <th class="fi-th col-name"><span>设备名称</span></th>
              <th class="fi-th col-type"><span>设备类型</span></th>
              <th class="fi-th col-location"><span>所属位置</span></th>
              <th class="fi-th fi-th-sort col-date" @click="toggleDateSort">
                <span>创建日期</span>
                <TableSortIcon :direction="dateSortDir" />
              </th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-status">
                <StatusTag :status="statusKey(row)" :label="statusLabel(row)" />
              </td>
              <td class="fi-td col-name">{{ row.name }}</td>
              <td class="fi-td col-type">{{ row.type || '—' }}</td>
              <td class="fi-td col-location">{{ row.location || '—' }}</td>
              <td class="fi-td col-date">{{ row.createdAt.slice(0, 10) }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" title="查看详情">
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useDeviceStore } from '@/stores/device'
import type { DeviceItem } from '@/types/device'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'
import TableFilterPopover from '@/components/base/TableFilterPopover.vue'

const store = useDeviceStore()
const query = store.query

// ===== 排序 =====
const statusSortDir = ref<'none' | 'asc' | 'desc'>('none')
const dateSortDir = ref<'none' | 'asc' | 'desc'>('desc')

function toggleStatusSort() {
  if (statusSortDir.value === 'none') statusSortDir.value = 'desc'
  else if (statusSortDir.value === 'desc') statusSortDir.value = 'asc'
  else statusSortDir.value = 'none'
  dateSortDir.value = 'none'
  if (statusSortDir.value === 'none') {
    store.fetchList()
  } else {
    store.list.sort((a, b) => statusSortDir.value === 'asc' ? a.status - b.status : b.status - a.status)
  }
}

function toggleDateSort() {
  if (dateSortDir.value === 'none') dateSortDir.value = 'desc'
  else if (dateSortDir.value === 'desc') dateSortDir.value = 'asc'
  else dateSortDir.value = 'none'
  statusSortDir.value = 'none'
  if (dateSortDir.value === 'none') {
    store.fetchList()
  } else {
    store.list.sort((a, b) => dateSortDir.value === 'asc'
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
}

// ===== 列筛选 =====
const statusFilter = ref<string[]>([])
const statusFilterOptions = [
  { label: '启用', value: '1' },
  { label: '停用', value: '0' },
  { label: '维护中', value: '2' },
]
watch(statusFilter, (val) => {
  query.status = val.length > 0 ? val.join(',') : undefined
  store.search()
})

// ===== 字典 =====
const STATUS_MAP: Record<number, string> = { 0: 'ent_locked', 1: 'ent_active', 2: 'ent_pending' }
const STATUS_LABEL: Record<number, string> = { 0: '停用', 1: '启用', 2: '维护中' }
function statusKey(row: DeviceItem): string { return STATUS_MAP[row.status] || 'ent_active' }
function statusLabel(row: DeviceItem): string { return STATUS_LABEL[row.status] || '—' }

function openCreate() { /* TODO */ }

onMounted(async () => { await store.fetchList() })
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-lg, 12px); overflow: auto;
}

.btn-outline-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--info-bg); color: var(--accent-primary);
  border: 1px solid var(--accent-primary); cursor: pointer;
  white-space: nowrap; transition: all .2s;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }

.col-status { width: 90px; }
.col-name { min-width: 140px; }
.col-type { min-width: 120px; }
.col-location { min-width: 140px; }
.col-date { min-width: 110px; }
.col-actions { width: 70px; min-width: 70px; white-space: nowrap; }

@media (max-width: 1550px) { .col-type { display: none !important; } }
@media (max-width: 1250px) { .col-location { display: none !important; } }
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
}

:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; background-color: var(--bg-card); }
</style>
