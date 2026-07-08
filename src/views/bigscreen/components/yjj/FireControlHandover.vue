<template>
  <div class="fc-handover">
    <!-- 交接异常统计 -->
    <div class="fc-handover__alert" v-if="violationCount > 0">
      <span class="fc-handover__alert-icon">⚠️</span>
      <span>本次查询范围内发现 <strong>{{ violationCount }}</strong> 条交接班异常记录</span>
    </div>

    <!-- 筛选 -->
    <div class="fc-handover__filter">
      <button
        v-for="opt in filterOpts"
        :key="opt.key"
        class="fc-handover__filter-btn"
        :class="{ 'is-active': statusFilter === opt.key }"
        @click="statusFilter = opt.key"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 交接班记录表格 -->
    <div class="fc-handover__table">
      <BigscreenListTable
        v-if="filteredRecords.length > 0"
        :columns="columns"
        :rows="filteredRecords"
        row-key="id"
      >
        <template #cell-violations="{ row }">
          <span v-if="row.violations.length === 0" class="text-muted">正常</span>
          <span v-else class="handover-violation-tag">
            {{ row.violations.length }}项违规
          </span>
        </template>
        <template #cell-status="{ row }">
          <span class="handover-status-tag" :class="row.violations.length > 0 ? 'handover-status--abnormal' : 'handover-status--normal'">
            {{ row.violations.length > 0 ? '异常' : '正常' }}
          </span>
        </template>
      </BigscreenListTable>
      <div v-else class="fc-handover__empty">暂无交接班记录</div>
    </div>

    <!-- 违规详情展开面板 -->
    <div v-if="expandedRecord" class="fc-handover__detail">
      <div class="handover-detail__header">
        <span class="handover-detail__title">交接班详情 — {{ expandedRecord.shiftDate }} {{ expandedRecord.roomName }}</span>
        <button class="handover-detail__close" @click="expandedRecord = null">✕</button>
      </div>
      <div class="handover-detail__body">
        <div class="handover-detail__section">
          <h4>数据继承清单</h4>
          <div class="handover-detail__grid">
            <span class="handover-detail__item">
              <em>主机状态</em>{{ expandedRecord.hostStatus }}
            </span>
            <span class="handover-detail__item">
              <em>未处置事项</em>{{ expandedRecord.unresolvedCount }}项
            </span>
            <span class="handover-detail__item">
              <em>巡检记录</em>{{ expandedRecord.patrolCount }}次
            </span>
          </div>
        </div>
        <div class="handover-detail__section">
          <h4>交接信息</h4>
          <p>交班人：{{ expandedRecord.fromPersonnel.join('、') }}</p>
          <p>接班人：{{ expandedRecord.toPersonnel.join('、') }}</p>
          <p>交接时间：{{ expandedRecord.handoverTime }}</p>
        </div>
        <div v-if="expandedRecord.violations.length > 0" class="handover-detail__section handover-detail__violations">
          <h4>违规详情</h4>
          <ul>
            <li v-for="v in expandedRecord.violations" :key="v">{{ v }}</li>
          </ul>
        </div>
      </div>
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

interface HandoverRecord {
  id: number
  enterpriseId: number
  roomName: string
  shiftDate: string
  fromPersonnel: string[]
  toPersonnel: string[]
  handoverTime: string
  hostStatus: string
  unresolvedCount: number
  patrolCount: number
  violations: string[]
}

const props = defineProps<{
  enterprise: FireControlEnterprise
}>()

// ============================================================
// Mock 数据
// ============================================================

const violationOptions = [
  '单人交接', '无证人员交接', '未打卡直接交班', '提前离岗交接',
  '主机故障未交接', '隐患隐瞒不报', '超时未完成交接', '双人联签未存证',
]

function generateMockHandovers(enterpriseId: number): HandoverRecord[] {
  const records: HandoverRecord[] = []
  const rooms = props.enterprise.rooms
  const fromNames = ['张建国', '李明辉', '刘强', '杨帆']
  const toNames = ['王海涛', '赵刚', '陈伟', '孙鹏']
  let id = 1

  rooms.forEach(room => {
    for (let d = 1; d <= 5; d++) {
      const date = new Date()
      date.setDate(date.getDate() - d)
      const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      // 80% 概率正常，20% 有违规
      const hasViolations = Math.random() > 0.8
      const violations: string[] = hasViolations
        ? [violationOptions[Math.floor(Math.random() * violationOptions.length)]]
        : []
      // 偶尔 2 项违规
      if (hasViolations && Math.random() > 0.5) {
        violations.push(violationOptions[Math.floor(Math.random() * violationOptions.length)])
      }

      records.push({
        id: id++,
        enterpriseId,
        roomName: room.name,
        shiftDate: ds,
        fromPersonnel: [fromNames[Math.floor(Math.random() * fromNames.length)], fromNames[Math.floor(Math.random() * fromNames.length)]],
        toPersonnel: [toNames[Math.floor(Math.random() * toNames.length)], toNames[Math.floor(Math.random() * toNames.length)]],
        handoverTime: `${ds} ${String(7 + Math.floor(Math.random() * 2)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        hostStatus: Math.random() > 0.3 ? '正常' : '有故障',
        unresolvedCount: Math.floor(Math.random() * 3),
        patrolCount: 4 + Math.floor(Math.random() * 3),
        violations,
      })
    }
  })
  return records
}

const allRecords = ref<HandoverRecord[]>(generateMockHandovers(props.enterprise.id))
const statusFilter = ref<'all' | 'normal' | 'abnormal'>('all')
const expandedRecord = ref<HandoverRecord | null>(null)

const filterOpts = [
  { key: 'all' as const, label: '全部' },
  { key: 'normal' as const, label: '正常' },
  { key: 'abnormal' as const, label: '异常' },
]

const columns: BsColumn[] = [
  { key: 'shiftDate', label: '班次日期' },
  { key: 'roomName', label: '消控室' },
  { key: 'handoverTime', label: '交接时间' },
  { key: 'fromPersonnel', label: '交班人' },
  { key: 'toPersonnel', label: '接班人' },
  { key: 'violations', label: '违规', width: 'vw(70)' },
  { key: 'status', label: '状态' },
]

const filteredRecords = computed(() => {
  let list = allRecords.value
  if (statusFilter.value === 'normal') list = list.filter(r => r.violations.length === 0)
  if (statusFilter.value === 'abnormal') list = list.filter(r => r.violations.length > 0)
  return [...list].sort((a, b) => b.shiftDate.localeCompare(a.shiftDate))
})

const violationCount = computed(() => allRecords.value.filter(r => r.violations.length > 0).length)

</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.fc-handover {
  flex: 1; min-height: 0; display: flex; flex-direction: column; gap: vh(10);
}

/* 异常告警条 */
.fc-handover__alert {
  display: flex; align-items: center; gap: vw(8);
  padding: vh(8) vw(12);
  background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px; color: #fca5a5;
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px);
  flex-shrink: 0;
}
.fc-handover__alert strong { color: #ef4444; }
.fc-handover__alert-icon { flex-shrink: 0; }

/* 筛选 */
.fc-handover__filter {
  display: flex; gap: vw(8); flex-shrink: 0;
}
.fc-handover__filter-btn {
  padding: vh(4) vw(12);
  border: 1px solid rgba(71, 132, 232, 0.35); border-radius: 4px;
  background: rgba(2, 20, 50, 0.55); color: #89b5ff;
  cursor: pointer; font-family: inherit;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px); transition: all 0.2s;
}
.fc-handover__filter-btn:hover {
  border-color: rgba(71, 132, 232, 0.65); background: rgba(71, 132, 232, 0.15);
}
.fc-handover__filter-btn.is-active {
  border-color: rgba(71, 132, 232, 0.7); background: rgba(71, 132, 232, 0.25); color: #ffffff;
}

/* 表格 */
.fc-handover__table { flex: 1; min-height: 0; }
.fc-handover__empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: rgba(137, 181, 255, 0.4);
  font-size: clamp(13px, calc(15 * var(--min-scale)), 17px);
}

/* 标签 */
.handover-violation-tag {
  display: inline-block; font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 10px; border-radius: 10px; font-weight: 600;
  color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1);
  cursor: pointer;
}
.handover-status-tag {
  display: inline-block; font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 10px; border-radius: 10px; font-weight: 600;
}
.handover-status--normal { color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); background: rgba(34, 197, 94, 0.1); }
.handover-status--abnormal { color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); }

/* 详情展开 */
.fc-handover__detail {
  flex-shrink: 0;
  max-height: vh(200); overflow-y: auto;
  padding: vh(10) vw(12);
  background: linear-gradient(135deg, rgba(13, 33, 55, 0.9) 0%, rgba(8, 22, 42, 0.9) 100%);
  border: 1px solid rgba(71, 132, 232, 0.3); border-radius: 6px;
}
.handover-detail__header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: vh(8);
}
.handover-detail__title {
  font-size: clamp(13px, calc(15 * var(--min-scale)), 17px); font-weight: 700; color: #3cd3d7;
}
.handover-detail__close {
  border: none; background: none; color: rgba(137, 181, 255, 0.5);
  cursor: pointer; font-size: 16px;
}
.handover-detail__close:hover { color: #ef4444; }
.handover-detail__body { display: flex; flex-direction: column; gap: vh(8); }
.handover-detail__section h4 {
  margin: 0 0 vh(4) 0;
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px); color: #89b5ff;
}
.handover-detail__section p {
  margin: 0 0 2px 0;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px); color: rgba(255, 255, 255, 0.7);
}
.handover-detail__grid { display: flex; gap: vw(12); }
.handover-detail__item {
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px); color: rgba(255, 255, 255, 0.8);
}
.handover-detail__item em {
  display: block; font-style: normal;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px); color: rgba(137, 181, 255, 0.5);
}
.handover-detail__violations ul {
  margin: 0; padding-left: 16px; list-style: disc;
}
.handover-detail__violations li {
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px); color: #ef4444; margin-bottom: 2px;
}

.text-muted { color: rgba(137, 181, 255, 0.35); }
</style>
