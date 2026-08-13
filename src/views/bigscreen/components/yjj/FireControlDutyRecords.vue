<template>
  <div class="fc-duty-records">
    <!-- 筛选行（商业街专题样式：el-select + el-button，暗色主题由 bigscreen-ep.scss 全局覆盖） -->
    <div class="fc-duty-records__filter">
      <el-select
        v-model="dateFilter"
        class="fc-duty-records__select"
        popper-class="bigscreen-el-select-dropdown"
      >
        <el-option
          v-for="opt in dateOptions"
          :key="opt.key"
          :label="opt.label"
          :value="opt.key"
        />
      </el-select>
      <el-select
        v-model="dutyTypeFilter"
        class="fc-duty-records__select"
        popper-class="bigscreen-el-select-dropdown"
      >
        <el-option value="all" label="全部类型" />
        <el-option value="check-in" label="到岗打卡" />
        <el-option value="handover" label="交接班打卡" />
        <el-option value="patrol" label="巡检打卡" />
      </el-select>
      <el-button type="primary" class="fc-duty-records__query-btn" @click="applyFilter">
        查询
      </el-button>
    </div>

    <!-- 表格（el-table stripe，替代 BigscreenListTable 自绘表格；无自动滚动） -->
    <div class="fc-duty-records__table">
      <el-table :data="displayRecords" stripe row-key="id">
        <el-table-column prop="shiftDate" label="值班日期" min-width="90" />
        <el-table-column prop="roomName" label="消控室" min-width="80" />
        <el-table-column prop="personnelName" label="值班人员" min-width="90" />
        <el-table-column label="打卡类型" width="100">
          <template #default="{ row }">
            <span class="duty-type-tag" :class="`duty-type--${row.dutyType}`">
              {{ dutyTypeLabel(row.dutyType) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="checkInTime" label="到岗" width="70" />
        <el-table-column prop="checkOutTime" label="离岗" width="70" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <span class="duty-status-tag" :class="`duty-status--${row.status}`">
              {{ statusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="100">
          <template #default="{ row }">
            <span :class="{ 'notes-emergency': row.isEscalated }">
              {{ row.notes }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器（el-pagination，样式由 bigscreen-ep.scss 全局覆盖） -->
    <div class="fc-duty-records__pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="filteredRecords.length"
        layout="total, sizes, prev, pager, next"
        :pager-count="5"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface DutyRecord {
  id: number
  enterpriseId: number
  roomName: string
  personnelName: string
  dutyType: 'check-in' | 'handover' | 'patrol'
  shiftDate: string
  checkInTime: string
  checkOutTime: string | null
  status: 'on-time' | 'late' | 'absent' | 'missed'
  notes: string
  isEscalated?: boolean
}

const props = defineProps<{
  records: DutyRecord[]
}>()

const dateFilter = ref<'today' | 'week' | 'month'>('today')
const dutyTypeFilter = ref<string>('all')
const page = ref(1)
const pageSize = ref(10)
const appliedFilter = ref<'today' | 'week' | 'month'>('today')
const appliedType = ref<string>('all')

const dateOptions = [
  { key: 'today' as const, label: '今日' },
  { key: 'week' as const, label: '本周' },
  { key: 'month' as const, label: '本月' },
]

function applyFilter() {
  appliedFilter.value = dateFilter.value
  appliedType.value = dutyTypeFilter.value
  page.value = 1
}

const filteredRecords = computed(() => {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

  let list = props.records

  // 日期筛选
  if (appliedFilter.value === 'today') {
    list = list.filter(r => r.shiftDate === todayStr)
  } else if (appliedFilter.value === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const cutoff = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth()+1).padStart(2,'0')}-${String(weekAgo.getDate()).padStart(2,'0')}`
    list = list.filter(r => r.shiftDate >= cutoff)
  } else {
    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)
    const cutoff = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth()+1).padStart(2,'0')}-${String(monthAgo.getDate()).padStart(2,'0')}`
    list = list.filter(r => r.shiftDate >= cutoff)
  }

  // 打卡类型筛选
  if (appliedType.value !== 'all') {
    list = list.filter(r => r.dutyType === appliedType.value)
  }

  return list
})

const displayRecords = computed(() => {
  const records = filteredRecords.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)

  // 按人员 + 日期排序
  const sorted = [...records].sort((a, b) => {
    const nameCompare = a.personnelName.localeCompare(b.personnelName)
    return nameCompare !== 0 ? nameCompare : b.shiftDate.localeCompare(a.shiftDate)
  })

  // 检测连续缺勤：同一人连续 3 日 absent → 标记
  const grouped: Record<string, DutyRecord[]> = {}
  sorted.forEach(r => {
    if (!grouped[r.personnelName]) grouped[r.personnelName] = []
    grouped[r.personnelName].push(r)
  })

  const escalated = new Set<number>()
  Object.values(grouped).forEach(personRecords => {
    let streak = 0
    // 已按日期倒序排列
    const dateSorted = [...personRecords].sort((a, b) => b.shiftDate.localeCompare(a.shiftDate))
    dateSorted.forEach((r, i) => {
      if (r.status === 'absent') {
        streak++
        if (streak >= 3) {
          // 标记最近的 3 条
          for (let j = i; j > i - 3 && j >= 0; j--) {
            escalated.add(dateSorted[j].id)
          }
        }
      } else {
        streak = 0
      }
    })
  })

  return sorted.map(r => ({
    ...r,
    notes: escalated.has(r.id) && !r.notes.includes('重点关注')
      ? `${r.notes ? r.notes + '；' : ''}连续3日缺勤→重点关注`
      : r.notes,
    isEscalated: escalated.has(r.id),
  }))
})

function dutyTypeLabel(t: string): string {
  const map: Record<string, string> = {
    'check-in': '到岗打卡',
    'handover': '交接班打卡',
    'patrol': '巡检打卡',
  }
  return map[t] || t
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    'on-time': '正常到岗',
    'late': '迟到',
    'absent': '缺勤',
    'missed': '漏检',
  }
  return map[s] || s
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.fc-duty-records {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(10);
}

/* ===== 筛选行 ===== */
.fc-duty-records__filter {
  display: flex;
  gap: vw(8);
  flex-shrink: 0;
  align-items: center;
}

.fc-duty-records__select {
  width: vw(140);
  flex-shrink: 0;
}

.fc-duty-records__query-btn {
  flex-shrink: 0;
}

/* ===== 表格容器（el-table 撑满 + 内部滚动） ===== */
.fc-duty-records__table {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;

  :deep(.el-table) {
    flex: 1;
  }

  :deep(.el-table__body-wrapper) {
    overflow-y: auto;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }
  }
}

/* ===== 打卡类型标签（4px 矩形淡底，与状态标签统一） ===== */
.duty-type-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 4px;
  line-height: 1.55;
  font-weight: 600;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  white-space: nowrap;
}

.duty-type--check-in {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
}

.duty-type--handover {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
}

.duty-type--patrol {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

/* ===== 状态标签（Figma 501:3359：圆角 4px 矩形 + 淡底 + 实色文字） ===== */
.duty-status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 4px;
  line-height: 1.55;
  font-weight: 500;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 14px);
  white-space: nowrap;
}

.duty-status--on-time {
  color: #00c951;
  background: rgba(120, 255, 105, 0.2);
}

.duty-status--late {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
}

.duty-status--absent {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
}

.duty-status--missed {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
}

/* ===== 重点关注备注 ===== */
.notes-emergency {
  color: #ef4444;
  font-weight: 600;
  animation: emergency-blink 1s ease-in-out infinite;
}

@keyframes emergency-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ===== 分页器（仅容器，组件样式由 bigscreen-ep.scss 覆盖） ===== */
.fc-duty-records__pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
