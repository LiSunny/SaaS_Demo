<template>
  <div class="fc-duty-records">
    <!-- 日期快捷筛选 -->
    <div class="fc-duty-records__filter">
      <button
        v-for="opt in dateOptions"
        :key="opt.key"
        class="fc-duty-records__filter-btn"
        :class="{ 'is-active': dateFilter === opt.key }"
        @click="dateFilter = opt.key"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 表格 -->
    <div class="fc-duty-records__table">
      <BigscreenListTable
        :columns="columns"
        :rows="filteredRecords"
        row-key="id"
      >
        <template #cell-status="{ row }">
          <span class="duty-status-tag" :class="`duty-status--${row.status}`">
            {{ statusLabel(row.status) }}
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
  shiftDate: string
  checkInTime: string
  checkOutTime: string | null
  status: 'on-time' | 'late' | 'absent'
  notes: string
}

const props = defineProps<{
  records: DutyRecord[]
}>()

const dateFilter = ref<'today' | 'week' | 'month'>('today')

const dateOptions = [
  { key: 'today' as const, label: '今日' },
  { key: 'week' as const, label: '本周' },
  { key: 'month' as const, label: '本月' },
]

const columns: BsColumn[] = [
  { key: 'shiftDate', label: '值班日期', width: 'calc(100 * var(--w))' },
  { key: 'roomName', label: '消控室', width: 'calc(90 * var(--w))' },
  { key: 'personnelName', label: '值班人员', width: 'calc(80 * var(--w))' },
  { key: 'checkInTime', label: '到岗', width: 'calc(60 * var(--w))' },
  { key: 'checkOutTime', label: '离岗', width: 'calc(60 * var(--w))' },
  { key: 'status', label: '状态', width: 'calc(80 * var(--w))' },
  { key: 'notes', label: '备注' },
]

const filteredRecords = computed(() => {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

  if (dateFilter.value === 'today') {
    return props.records.filter(r => r.shiftDate === todayStr)
  }

  if (dateFilter.value === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const cutoff = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth()+1).padStart(2,'0')}-${String(weekAgo.getDate()).padStart(2,'0')}`
    return props.records.filter(r => r.shiftDate >= cutoff)
  }

  // month
  const monthAgo = new Date(now)
  monthAgo.setDate(monthAgo.getDate() - 30)
  const cutoff = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth()+1).padStart(2,'0')}-${String(monthAgo.getDate()).padStart(2,'0')}`
  return props.records.filter(r => r.shiftDate >= cutoff)
})

function statusLabel(s: string): string {
  const map: Record<string, string> = { 'on-time': '正常到岗', 'late': '迟到', 'absent': '缺勤' }
  return map[s] || s
}
</script>

<style scoped>
.fc-duty-records {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--h));
}

.fc-duty-records__filter {
  display: flex;
  gap: calc(8 * var(--w));
  flex-shrink: 0;
}

.fc-duty-records__filter-btn {
  padding: calc(4 * var(--h)) calc(12 * var(--w));
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

.fc-duty-records__table {
  flex: 1;
  min-height: 0;
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
</style>
