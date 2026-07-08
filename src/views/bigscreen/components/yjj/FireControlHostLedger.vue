<template>
  <div class="fc-host-ledger">
    <!-- 信号概览卡片 -->
    <div class="fc-host-ledger__stats">
      <button
        v-for="card in signalStats"
        :key="card.type"
        class="signal-stat-card"
        :class="{
          'is-active': selectedType === card.type,
          [`signal-stat-card--${card.cssClass}`]: true,
        }"
        @click="toggleTypeFilter(card.type)"
      >
        <span class="signal-stat-card__count">{{ card.count }}</span>
        <span class="signal-stat-card__label">{{ card.label }}</span>
      </button>
    </div>

    <!-- 信号类型筛选 -->
    <div class="fc-host-ledger__filter">
      <button
        v-for="opt in typeOptions"
        :key="opt.key"
        class="fc-host-ledger__filter-btn"
        :class="{ 'is-active': selectedType === opt.key }"
        @click="selectedType = opt.key"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 台账表格 -->
    <div class="fc-host-ledger__table">
      <BigscreenListTable
        v-if="filteredLedger.length > 0"
        :columns="columns"
        :rows="filteredLedger"
        row-key="id"
      >
        <template #cell-signalType="{ row }">
          <span class="signal-type-tag" :class="`signal-type--${row.signalType}`">
            {{ signalTypeLabel(row.signalType) }}
          </span>
        </template>
        <template #cell-status="{ row }">
          <span class="signal-status-tag" :class="`signal-status--${row.status}`">
            {{ statusLabel(row.status) }}
          </span>
        </template>
      </BigscreenListTable>
      <div v-else class="fc-host-ledger__empty">暂无主机信号记录</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BigscreenListTable, { type BsColumn } from '../BigscreenListTable.vue'

interface FireControlEnterprise {
  id: number
  name: string
  rooms: { id: number; name: string }[]
}

interface HostLedgerEntry {
  id: number
  enterpriseId: number
  roomName: string
  signalType: 'fire' | 'fault' | 'shield' | 'supervise' | 'comm-error'
  pointNo: string
  location: string
  alertTime: string
  status: 'pending' | 'processing' | 'resolved' | 'overdue'
  handlerName: string | null
  handledAt: string | null
  dutyPersonnel: string
}

const props = defineProps<{
  enterprise: FireControlEnterprise
}>()

// ============================================================
// Mock 数据
// ============================================================

const signalTypes: HostLedgerEntry['signalType'][] = [
  'fire', 'fault', 'shield', 'supervise', 'comm-error',
]
const typeLabels: Record<string, string> = {
  'fire': '火警', 'fault': '故障', 'shield': '屏蔽',
  'supervise': '监管', 'comm-error': '通讯异常',
}
const statuses: HostLedgerEntry['status'][] = [
  'pending', 'processing', 'resolved', 'resolved', 'resolved', 'overdue',
]
const handlers = ['张建国', '李明辉', '刘强', '孙鹏', null]
const points = ['01-003', '02-015', '03-007', '01-022', '04-011', '02-008']
const locations = ['1层大厅', '2层走廊东', '3层配电间', '地下车库B1', '4层办公区', '1层消控室']

function generateMockLedger(enterpriseId: number): HostLedgerEntry[] {
  const entries: HostLedgerEntry[] = []
  const rooms = props.enterprise.rooms
  let id = 1

  for (let d = 0; d < 5; d++) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    const count = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const type = signalTypes[Math.floor(Math.random() * signalTypes.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const room = rooms[Math.floor(Math.random() * rooms.length)]
      const hour = String(6 + Math.floor(Math.random() * 18)).padStart(2, '0')
      const min = String(Math.floor(Math.random() * 60)).padStart(2, '0')
      const handler = status !== 'pending' ? handlers[Math.floor(Math.random() * (handlers.length - 1))] : null

      entries.push({
        id: id++,
        enterpriseId,
        roomName: room.name,
        signalType: type,
        pointNo: points[Math.floor(Math.random() * points.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        alertTime: `${dateStr} ${hour}:${min}:00`,
        status,
        handlerName: handler,
        handledAt: handler ? `${dateStr} ${String(Number(hour) + 1).padStart(2, '0')}:${min}` : null,
        dutyPersonnel: ['张建国', '李明辉', '刘强', '杨帆'][Math.floor(Math.random() * 4)],
      })
    }
  }
  return entries
}

const allLedger = ref<HostLedgerEntry[]>(generateMockLedger(props.enterprise.id))

// ============================================================
// 状态
// ============================================================

const selectedType = ref<string>('all')

const typeOptions = [
  { key: 'all', label: '全部' },
  { key: 'fire', label: '火警' },
  { key: 'fault', label: '故障' },
  { key: 'shield', label: '屏蔽' },
  { key: 'supervise', label: '监管' },
  { key: 'comm-error', label: '通讯异常' },
]

const columns: BsColumn[] = [
  { key: 'alertTime', label: '信号时间' },
  { key: 'signalType', label: '类型', width: 'vw(70)' },
  { key: 'pointNo', label: '点位编号' },
  { key: 'location', label: '位置' },
  { key: 'status', label: '处置状态', width: 'vw(80)' },
  { key: 'handlerName', label: '处置人' },
  { key: 'dutyPersonnel', label: '当班值班员' },
]

// ============================================================
// 计算属性
// ============================================================

const signalStats = computed(() => {
  const cssMap: Record<string, string> = {
    'fire': 'danger', 'fault': 'warning', 'shield': 'info',
    'supervise': 'normal', 'comm-error': 'danger',
  }
  return signalTypes.map(type => ({
    type,
    label: typeLabels[type],
    count: allLedger.value.filter(e => e.signalType === type).length,
    cssClass: cssMap[type],
  }))
})

const filteredLedger = computed(() => {
  let list = allLedger.value
  if (selectedType.value !== 'all') {
    list = list.filter(e => e.signalType === selectedType.value)
  }
  return [...list].sort((a, b) => b.alertTime.localeCompare(a.alertTime))
})

// ============================================================
// 方法
// ============================================================
function toggleTypeFilter(type: string) {
  selectedType.value = selectedType.value === type ? 'all' : type
}
function signalTypeLabel(t: string): string { return typeLabels[t] || t }
function statusLabel(s: string): string {
  const map: Record<string, string> = {
    'pending': '待处置', 'processing': '处置中', 'resolved': '已处置', 'overdue': '逾期未处置',
  }
  return map[s] || s
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.fc-host-ledger {
  flex: 1; min-height: 0; display: flex; flex-direction: column; gap: vh(10);
}

/* 统计卡片 */
.fc-host-ledger__stats {
  display: flex; gap: vw(10); flex-shrink: 0;
}
.signal-stat-card {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; align-items: center; gap: vh(4);
  padding: vh(10) vw(8);
  border: 1px solid rgba(71, 132, 232, 0.25); border-radius: 6px;
  background: linear-gradient(135deg, rgba(13, 33, 55, 0.85) 0%, rgba(8, 22, 42, 0.85) 100%);
  cursor: pointer; font-family: inherit; transition: all 0.2s;
}
.signal-stat-card:hover { border-color: rgba(71, 132, 232, 0.45); background: rgba(71, 132, 232, 0.12); }
.signal-stat-card.is-active {
  border-color: rgba(71, 132, 232, 0.7); background: rgba(71, 132, 232, 0.2);
  box-shadow: 0 0 12px rgba(71, 132, 232, 0.15);
}
.signal-stat-card--danger { border-left: 3px solid rgba(239, 68, 68, 0.6); }
.signal-stat-card--warning { border-left: 3px solid rgba(245, 158, 11, 0.6); }
.signal-stat-card--info { border-left: 3px solid rgba(59, 130, 246, 0.6); }
.signal-stat-card--normal { border-left: 3px solid rgba(107, 114, 128, 0.6); }
.signal-stat-card__count {
  font-family: 'DIN', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(22px, calc(28 * var(--min-scale)), 34px);
  font-weight: 700; color: #ffffff; line-height: 1.2;
}
.signal-stat-card--danger .signal-stat-card__count { color: #ef4444; }
.signal-stat-card--warning .signal-stat-card__count { color: #f59e0b; }
.signal-stat-card__label {
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px);
  color: rgba(137, 181, 255, 0.7); white-space: nowrap;
}

/* 筛选 */
.fc-host-ledger__filter {
  display: flex; gap: vw(8); flex-shrink: 0;
}
.fc-host-ledger__filter-btn {
  padding: vh(4) vw(12);
  border: 1px solid rgba(71, 132, 232, 0.35); border-radius: 4px;
  background: rgba(2, 20, 50, 0.55); color: #89b5ff;
  cursor: pointer; font-family: inherit;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px); transition: all 0.2s;
}
.fc-host-ledger__filter-btn:hover {
  border-color: rgba(71, 132, 232, 0.65); background: rgba(71, 132, 232, 0.15);
}
.fc-host-ledger__filter-btn.is-active {
  border-color: rgba(71, 132, 232, 0.7); background: rgba(71, 132, 232, 0.25); color: #ffffff;
}

/* 表格 */
.fc-host-ledger__table { flex: 1; min-height: 0; }
.fc-host-ledger__empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: rgba(137, 181, 255, 0.4);
  font-size: clamp(13px, calc(15 * var(--min-scale)), 17px);
}

/* 标签 */
.signal-type-tag {
  display: inline-block; font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 10px; border-radius: 10px; line-height: 1.55; font-weight: 600;
}
.signal-type--fire { color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); }
.signal-type--comm-error { color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); }
.signal-type--fault { color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.1); }
.signal-type--shield { color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.1); }
.signal-type--supervise { color: #6b7280; border: 1px solid rgba(107, 114, 128, 0.3); background: rgba(107, 114, 128, 0.1); }

.signal-status-tag {
  display: inline-block; font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 10px; border-radius: 10px; line-height: 1.55; font-weight: 600;
}
.signal-status--pending { color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.1); }
.signal-status--processing { color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.1); }
.signal-status--resolved { color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); background: rgba(34, 197, 94, 0.1); }
.signal-status--overdue { color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); }
</style>
