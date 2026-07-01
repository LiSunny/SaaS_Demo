<template>
  <div class="operation-logs-tab">
    <!-- Error -->
    <div v-if="error" class="logs-error">
      <AppIcon name="warning" class="logs-error-icon" />
      <p class="logs-error-text">{{ error }}</p>
      <button class="btn-link" @click="$emit('refresh')">重试</button>
    </div>

    <!-- Empty（非 loading 且无数据） -->
    <div v-else-if="!loading && logs.length === 0" class="logs-empty">
      <AppIcon name="time" class="logs-empty-icon" />
      <p class="logs-empty-text">暂无操作日志</p>
    </div>

    <!-- 表格 + 分页 -->
    <template v-else>
      <div class="table-wrap">
        <table class="fi-table logs-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th fi-th-sort logs-col-time" @click="toggleTimeSort">
                <span>操作时间</span>
                <TableSortIcon :direction="timeSortDir" />
              </th>
              <th class="fi-th logs-col-op">
                <span>操作人</span>
              </th>
              <th class="fi-th logs-col-desc">
                <span>动作说明</span>
              </th>
            </tr>
          </thead>
          <tbody v-loading="loading">
            <tr v-for="log in sortedLogs" :key="log.id" class="fi-tbody-tr">
              <td class="fi-td logs-col-time">{{ formatTime(log.timestamp) }}</td>
              <td class="fi-td logs-col-op">{{ log.operatorName }}</td>
              <td class="fi-td logs-col-desc">{{ log.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页（不可协商） -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ total }} 条记录 第 {{ currentPage }}/{{ Math.ceil(total / pageSize) || 1 }} 页</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @change="onPageChange"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { OperationLogItem } from '@/types/enterprise'
import { vLoading } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'

const props = defineProps<{
  logs: OperationLogItem[]
  loading: boolean
  error: string | null
  page: number
  size: number
  total: number
}>()

const emit = defineEmits<{
  refresh: []
  pageChange: [page: number, size: number]
}>()

const currentPage = computed({
  get: () => props.page,
  set: (val) => emit('pageChange', val, props.size),
})

const pageSize = computed({
  get: () => props.size,
  set: (val) => emit('pageChange', 1, val),
})

function onPageChange() {
  emit('pageChange', currentPage.value, pageSize.value)
}

// ===== 排序（每列独立 ref，实际排序数据） =====
const timeSortDir = ref<'none' | 'asc' | 'desc'>('desc')
const originalLogs = ref<OperationLogItem[]>([])

// 缓存原始顺序
watch(() => props.logs, (val) => {
  originalLogs.value = [...val]
}, { immediate: true })

const sortedLogs = computed(() => {
  if (timeSortDir.value === 'none') return [...originalLogs.value]
  const list = [...props.logs]
  list.sort((a, b) => {
    const va = a.timestamp
    const vb = b.timestamp
    return timeSortDir.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
  })
  return list
})

function toggleTimeSort() {
  if (timeSortDir.value === 'none') { timeSortDir.value = 'desc' }
  else if (timeSortDir.value === 'desc') { timeSortDir.value = 'asc' }
  else { timeSortDir.value = 'none' }
}

/** 将 ISO 8601 / 日期字符串格式化为 YYYY-MM-DD HH:mm:ss */
function formatTime(raw: string): string {
  if (!raw) return '--'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
}
</script>

<style scoped>
.operation-logs-tab {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 12px);
}

/* Error / Empty */
.logs-error,
.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm, 8px);
  padding: var(--spacing-2xl, 48px) 0;
  color: var(--text-muted, #5e5e5e);
}

.logs-error-icon {
  font-size: 36px;
  color: var(--color-warning, #e6a23c);
}

.logs-error-text,
.logs-empty-text {
  margin: 0;
  font-size: var(--font-small, 14px);
}

.logs-empty-icon {
  font-size: 40px;
  opacity: 0.4;
}

/* ===== Scoped 只覆写列宽 ===== */
.logs-col-time {
  width: 228px;
  min-width: 228px;
}

.logs-col-op {
  width: 188px;
  min-width: 188px;
}

.logs-col-desc {
  width: auto;
  text-align: left;
}

/* ===== 分页器 ===== */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; background-color: var(--bg-card); }

/* ===== 响应式 ===== */
@media (max-width: 800px) {
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
}
</style>
