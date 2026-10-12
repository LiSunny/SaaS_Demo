<script setup lang="ts">
/**
 * 发起事项（POC 骨架）
 * 仿 WorkOrderMonitor，结构与待办/已办一致
 * 右上角"发起事项"按钮 → 选模板快速发起
 */
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'

interface StartedItem {
  id: number
  code: string
  title: string
  status: 'in_progress' | 'closed' | 'cancelled'
  statusLabel: string
  priority: 'normal' | 'urgent'
  sla: 'timeout' | 'normal'
  startTime: string
}

const mockList: StartedItem[] = [
  { id: 1, code: 'WO-20260918-1', title: '火灾隐患排查上报', status: 'cancelled', statusLabel: '已取消', priority: 'urgent', sla: 'timeout', startTime: '2026-09-18 17:01:10' },
  { id: 2, code: 'WO-20260914-37', title: '故障处理-0914', status: 'in_progress', statusLabel: '进行中', priority: 'normal', sla: 'timeout', startTime: '2026-09-14 15:54:47' },
  { id: 3, code: 'WO-20260914-36', title: '故障处理-0914', status: 'in_progress', statusLabel: '进行中', priority: 'normal', sla: 'timeout', startTime: '2026-09-14 15:48:49' },
  { id: 4, code: 'WO-20260914-0', title: '测试0911', status: 'closed', statusLabel: '已关闭', priority: 'normal', sla: 'timeout', startTime: '2026-09-14 08:36:05' },
  { id: 5, code: 'WO-20260915-4', title: '故障处理-0914', status: 'closed', statusLabel: '已关闭', priority: 'normal', sla: 'normal', startTime: '2026-09-15 09:42:09' },
]

const query = reactive({
  code: '',
  title: '',
  status: '' as '' | 'in_progress' | 'closed' | 'cancelled',
  priority: '' as '' | 'normal' | 'urgent',
  sla: '' as '' | 'timeout' | 'normal',
  dateRange: '' as '' | [string, string],
  page: 1,
  size: 20,
})

const filteredList = computed(() => {
  let arr = [...mockList]
  if (query.code) arr = arr.filter(i => i.code.includes(query.code))
  if (query.title) arr = arr.filter(i => i.title.includes(query.title))
  if (query.status) arr = arr.filter(i => i.status === query.status)
  if (query.priority) arr = arr.filter(i => i.priority === query.priority)
  if (query.sla) arr = arr.filter(i => i.sla === query.sla)
  return arr.sort((a, b) => b.startTime.localeCompare(a.startTime))
})

const pagedList = computed(() => {
  const start = (query.page - 1) * query.size
  return filteredList.value.slice(start, start + query.size)
})
const total = computed(() => filteredList.value.length)

function handleSearch() { query.page = 1 }
function handleReset() {
  query.code = ''; query.title = ''; query.status = ''; query.priority = ''; query.sla = ''; query.dateRange = ''
  query.page = 1
}
function handleView(row: StartedItem) { ElMessage.info(`查看工单：${row.code}（POC 占位）`) }
function handleLaunch() { ElMessage.info('打开模板抽屉，选模板发起（POC 占位）') }
</script>

<template>
  <div class="list-page">
    <div class="content-card">
      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input v-model="query.code" class="fi-input" placeholder="事项编号" @keyup.enter="handleSearch" />
            <button v-if="query.code" class="fi-clear" @click="query.code='';handleSearch()"><AppIcon name="clear" /></button>
            <AppIcon name="search" class="fi-icon" />
          </div>
          <div class="search-input-wrap">
            <input v-model="query.title" class="fi-input" placeholder="事项标题" @keyup.enter="handleSearch" />
            <button v-if="query.title" class="fi-clear" @click="query.title='';handleSearch()"><AppIcon name="clear" /></button>
            <AppIcon name="search" class="fi-icon" />
          </div>
          <div class="fi-select-wrap">
            <el-select v-model="query.status" placeholder="事项状态" clearable class="fi-select" :teleported="false" popper-class="fi-popper">
              <el-option label="全部" value="" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已关闭" value="closed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </div>
          <div class="fi-select-wrap">
            <el-select v-model="query.priority" placeholder="优先级" clearable class="fi-select" :teleported="false" popper-class="fi-popper">
              <el-option label="全部" value="" />
              <el-option label="普通" value="normal" />
              <el-option label="紧急" value="urgent" />
            </el-select>
          </div>
          <div class="fi-select-wrap">
            <el-select v-model="query.sla" placeholder="SLA状态" clearable class="fi-select" :teleported="false" popper-class="fi-popper">
              <el-option label="全部" value="" />
              <el-option label="正常" value="normal" />
              <el-option label="超时" value="timeout" />
            </el-select>
          </div>
          <div class="fi-select-wrap">
            <el-date-picker
              v-model="query.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :teleported="false"
              popper-class="fi-popper"
              class="fi-select"
            />
          </div>
          <button class="btn-primary" @click="handleSearch">查询</button>
          <button class="btn-default" @click="handleReset">重置</button>
        </div>
        <div class="filter-right">
          <button class="btn-primary" @click="handleLaunch">
            <AppIcon name="plus" class="btn-add-icon" />
            发起事项
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-status"><span>事项状态</span></th>
              <th class="fi-th col-sla"><span>SLA</span></th>
              <th class="fi-th col-code"><span>事项编号</span></th>
              <th class="fi-th col-title"><span>事项标题</span></th>
              <th class="fi-th col-priority"><span>优先级</span></th>
              <th class="fi-th col-time"><span>发起时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedList" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-status">
                <span :class="['status-tag', `status-tag-${row.status}`]">{{ row.statusLabel }}</span>
              </td>
              <td class="fi-td col-sla">
                <span :class="['sla-dot', `sla-${row.sla}`]"></span>
                {{ row.sla === 'timeout' ? '超时' : '正常' }}
              </td>
              <td class="fi-td col-code">{{ row.code }}</td>
              <td class="fi-td col-title">{{ row.title }}</td>
              <td class="fi-td col-priority">
                <span :class="['priority-tag', `priority-${row.priority}`]">
                  {{ row.priority === 'urgent' ? '紧急' : '普通' }}
                </span>
              </td>
              <td class="fi-td col-time">{{ row.startTime }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" @click="handleView(row)" title="查看"><AppIcon name="preview" class="act-icon" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ total }} 条记录 第 {{ query.page }}/{{ Math.ceil(total / query.size) || 1 }} 页</span>
        <el-pagination
          v-model:current-page="query.page" v-model:page-size="query.size" :total="total"
          :page-sizes="[10, 20, 50, 100]" layout="sizes, prev, pager, next, jumper" background
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-md, 12px); overflow: auto;
}

.col-status { width: 100px; }
.col-sla { width: 80px; }
.col-code { width: 160px; }
.col-title { min-width: 160px; }
.col-priority { width: 80px; }
.col-time { width: 160px; }
.col-actions { width: 80px; min-width: 60px; white-space: nowrap; }

.status-tag {
  display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px;
}
.status-tag-in_progress { background: rgba(64, 158, 255, 0.12); color: #409eff; }
.status-tag-closed { background: rgba(153, 153, 153, 0.12); color: #999; }
.status-tag-cancelled { background: rgba(245, 108, 108, 0.12); color: #f56c6c; }

.sla-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  margin-right: 6px; vertical-align: middle;
}
.sla-timeout { background: #f56c6c; }
.sla-normal { background: #67c23a; }

.priority-tag {
  display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px;
}
.priority-urgent { background: rgba(245, 108, 108, 0.12); color: #f56c6c; font-weight: 600; }
.priority-normal { color: var(--text-secondary); }

.date-sep { color: var(--text-secondary); margin: 0 4px; }

@media (max-width: 1250px) { .col-priority { display: none !important; } }
@media (max-width: 1050px) { .col-time { display: none !important; } }
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .filter-left { flex-wrap: wrap; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
}

:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: var(--bg-card); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; }
</style>
