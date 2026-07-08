<template>
  <div class="fc-duty-records">
    <!-- 筛选行 -->
    <div class="fc-duty-records__filter">
      <!-- 日期快捷筛选 -->
      <button
        v-for="opt in dateOptions"
        :key="opt.key"
        class="fc-duty-records__filter-btn"
        :class="{ 'is-active': dateFilter === opt.key }"
        @click="dateFilter = opt.key"
      >
        {{ opt.label }}
      </button>
      <!-- 打卡类型筛选 -->
      <select
        v-model="dutyTypeFilter"
        class="fc-duty-records__select"
      >
        <option value="all">全部类型</option>
        <option value="check-in">到岗打卡</option>
        <option value="handover">交接班打卡</option>
        <option value="patrol">巡检打卡</option>
      </select>
    </div>

    <!-- 表格 -->
    <div class="fc-duty-records__table">
      <BigscreenListTable
        :columns="columns"
        :rows="displayRecords"
        row-key="id"
      >
        <template #cell-dutyType="{ row }">
          <span class="duty-type-tag" :class="`duty-type--${row.dutyType}`">
            {{ dutyTypeLabel(row.dutyType) }}
          </span>
        </template>
        <template #cell-status="{ row }">
          <span class="duty-status-tag" :class="`duty-status--${row.status}`">
            {{ statusLabel(row.status) }}
          </span>
        </template>
        <template #cell-notes="{ row }">
          <span :class="{ 'notes-emergency': row.isEscalated }">
            {{ row.notes }}
          </span>
        </template>
      </BigscreenListTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BigscreenListTable, { type BsColumn } from '../BigscreenListTable.vue'

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

const dateOptions = [
  { key: 'today' as const, label: '今日' },
  { key: 'week' as const, label: '本周' },
  { key: 'month' as const, label: '本月' },
]

const columns: BsColumn[] = [
  { key: 'shiftDate', label: '值班日期' },
  { key: 'roomName', label: '消控室' },
  { key: 'personnelName', label: '值班人员' },
  { key: 'dutyType', label: '打卡类型', width: 'vw(80)' },
  { key: 'checkInTime', label: '到岗', width: 'vw(55)' },
  { key: 'checkOutTime', label: '离岗', width: 'vw(55)' },
  { key: 'status', label: '状态', width: 'vw(70)' },
  { key: 'notes', label: '备注' },
]

const filteredRecords = computed(() => {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

  let list = props.records

  // 日期筛选
  if (dateFilter.value === 'today') {
    list = list.filter(r => r.shiftDate === todayStr)
  } else if (dateFilter.value === 'week') {
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
  if (dutyTypeFilter.value !== 'all') {
    list = list.filter(r => r.dutyType === dutyTypeFilter.value)
  }

  return list
})

// 扩展显示数据：检测连续缺勤
const displayRecords = computed(() => {
  const records = filteredRecords.value

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

.fc-duty-records__filter {
  display: flex;
  gap: vw(8);
  flex-shrink: 0;
  align-items: center;
}

.fc-duty-records__filter-btn {
  padding: vh(4) vw(12);
  border: 1px solid rgba(71, 132, 232, 0.35);
  border-radius: 4px;
  background: rgba(2, 20, 50, 0.55);
  color: #89b5ff;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  transition: all 0.2s;
}
.fc-duty-records__filter-btn:hover {
  border-color: rgba(71, 132, 232, 0.65);
  background: rgba(71, 132, 232, 0.15);
}
.fc-duty-records__filter-btn.is-active {
  border-color: rgba(71, 132, 232, 0.7);
  background: rgba(71, 132, 232, 0.25);
  color: #ffffff;
}

.fc-duty-records__select {
  margin-left: auto;
  padding: vh(4) vw(10);
  border: 1px solid rgba(71, 132, 232, 0.35);
  border-radius: 4px;
  background: rgba(2, 20, 50, 0.55);
  color: #89b5ff;
  font-family: inherit;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  cursor: pointer;
  outline: none;
}
.fc-duty-records__select option {
  background: #0d2137;
  color: #89b5ff;
}

.fc-duty-records__table {
  flex: 1;
  min-height: 0;
}

/* 打卡类型标签 */
.duty-type-tag {
  display: inline-block;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 10px;
  border-radius: 10px;
  line-height: 1.55;
  font-weight: 600;
}

.duty-type--check-in {
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.1);
}

.duty-type--handover {
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.1);
}

.duty-type--patrol {
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.1);
}

/* 状态标签 */
.duty-status-tag {
  display: inline-block;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 10px;
  border-radius: 10px;
  line-height: 1.55;
  font-weight: 600;
}

.duty-status--on-time {
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.1);
}

.duty-status--late {
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.1);
}

.duty-status--absent {
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
}

.duty-status--missed {
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
}

/* 重点关注备注 */
.notes-emergency {
  color: #ef4444;
  font-weight: 600;
  animation: emergency-blink 1s ease-in-out infinite;
}

@keyframes emergency-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
