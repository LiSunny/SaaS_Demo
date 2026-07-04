<template>
  <div class="fc-alerts">
    <!-- 预警类型统计卡片行 -->
    <div class="fc-alerts__stats">
      <button
        v-for="card in alertStats"
        :key="card.type"
        class="alert-stat-card"
        :class="{
          'is-active': selectedType === card.type,
          [`alert-stat-card--${card.colorClass}`]: true
        }"
        @click="toggleTypeFilter(card.type)"
      >
        <span class="alert-stat-card__count">{{ card.count }}</span>
        <span class="alert-stat-card__label">{{ card.label }}</span>
      </button>
    </div>

    <!-- 处置状态筛选 -->
    <div class="fc-alerts__filter">
      <button
        v-for="opt in statusOptions"
        :key="opt.key"
        class="fc-alerts__filter-btn"
        :class="{ 'is-active': statusFilter === opt.key }"
        @click="statusFilter = opt.key"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 预警表格 -->
    <div class="fc-alerts__table">
      <BigscreenListTable
        v-if="filteredAlerts.length > 0"
        :columns="columns"
        :rows="filteredAlerts"
        row-key="id"
      >
        <template #cell-alertType="{ row }">
          <span class="alert-type-tag" :class="`alert-type--${row.alertType}`">
            {{ alertTypeLabel(row.alertType) }}
          </span>
        </template>
        <template #cell-snapshotUrl="{ row }">
          <img
            class="alert-snapshot"
            :src="row.snapshotUrl"
            :alt="alertTypeLabel(row.alertType)"
            @click.stop="previewSnapshot(row as AlertRecord)"
          />
        </template>
        <template #cell-status="{ row }">
          <span class="alert-status-tag" :class="`alert-status--${row.status}`">
            {{ statusLabel(row.status) }}
          </span>
        </template>
      </BigscreenListTable>
      <div v-else class="fc-alerts__empty">暂无预警记录</div>
    </div>

    <!-- 截图预览弹窗 -->
    <Teleport to="body">
      <div v-if="previewVisible" class="snapshot-overlay" @click="previewVisible = false">
        <img :src="previewImage" class="snapshot-overlay__img" @click.stop />
        <button class="snapshot-overlay__close" @click="previewVisible = false">✕</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BigscreenListTable, { type BsColumn } from '../BigscreenListTable.vue'

// ============================================================
// Types
// ============================================================

interface FireControlEnterprise {
  id: number
  name: string
  address: string
  contactPerson: string
  contactPhone: string
  rooms: { id: number; name: string }[]
  status: 'normal' | 'alert'
}

interface AlertRecord {
  id: number
  enterpriseId: number
  roomName: string
  alertType: 'off-post' | 'sleeping' | 'substitution' | 'smoking' | 'fire'
  alertTime: string
  snapshotUrl: string
  status: 'pending' | 'confirmed' | 'false-alarm'
  handlerName: string | null
  handledAt: string | null
}

const props = defineProps<{
  enterprise: FireControlEnterprise
}>()

// ============================================================
// Mock 数据生成
// ============================================================

const camImgs = [
  new URL('@/assets/bigscreen/rsouce/them_1.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_2.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_3.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_4.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_5.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_6.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_7.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_8.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_9.png', import.meta.url).href,
]

const alertTypes: AlertRecord['alertType'][] = [
  'off-post', 'sleeping', 'substitution', 'smoking', 'fire',
]
const typeLabels: Record<string, string> = {
  'off-post': '脱岗',
  'sleeping': '睡岗',
  'substitution': '替岗',
  'smoking': '吸烟',
  'fire': '明火',
}
const statuses: AlertRecord['status'][] = ['pending', 'pending', 'pending', 'confirmed', 'confirmed', 'false-alarm']
const handlers = ['张华', '李明', '王强', null]

function generateMockAlerts(enterpriseId: number): AlertRecord[] {
  const records: AlertRecord[] = []
  const rooms = props.enterprise.rooms
  let id = 1

  for (let d = 0; d < 7; d++) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    // 每天 2~5 条预警
    const count = 2 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const type = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const room = rooms[Math.floor(Math.random() * rooms.length)]
      const hour = String(6 + Math.floor(Math.random() * 18)).padStart(2, '0')
      const min = String(Math.floor(Math.random() * 60)).padStart(2, '0')
      const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0')
      const handler = handlers[Math.floor(Math.random() * handlers.length)]

      records.push({
        id: id++,
        enterpriseId,
        roomName: room.name,
        alertType: type,
        alertTime: `${dateStr} ${hour}:${min}:${sec}`,
        snapshotUrl: camImgs[(id + d) % camImgs.length],
        status,
        handlerName: handler,
        handledAt: status !== 'pending' && handler
          ? `${dateStr} ${String(Number(hour) + 1).padStart(2, '0')}:${min}`
          : null,
      })
    }
  }
  return records
}

const allAlerts = ref<AlertRecord[]>(generateMockAlerts(props.enterprise.id))

// ============================================================
// 状态
// ============================================================

const selectedType = ref<string>('all')
const statusFilter = ref<string>('all')
const previewVisible = ref(false)
const previewImage = ref('')

// ============================================================
// 计算属性
// ============================================================

const columns: BsColumn[] = [
  { key: 'alertTime', label: '预警时间' },
  { key: 'alertType', label: '预警类型', width: 'calc(70 * var(--w))' },
  { key: 'roomName', label: '消控室' },
  { key: 'snapshotUrl', label: '截图', width: 'calc(70 * var(--w))' },
  { key: 'status', label: '处置状态', width: 'calc(80 * var(--w))' },
  { key: 'handlerName', label: '处置人' },
  { key: 'handledAt', label: '处置时间' },
]

const alertStats = computed(() => {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayAlerts = allAlerts.value.filter(a => a.alertTime.startsWith(todayStr))

  const colorMap: Record<string, string> = {
    'off-post': 'danger',
    'sleeping': 'danger',
    'substitution': 'warning',
    'smoking': 'warning',
    'fire': 'danger',
  }

  return alertTypes.map(type => ({
    type,
    label: typeLabels[type],
    count: todayAlerts.filter(a => a.alertType === type).length,
    colorClass: colorMap[type],
  }))
})

const filteredAlerts = computed(() => {
  let list = allAlerts.value

  if (selectedType.value !== 'all') {
    list = list.filter(a => a.alertType === selectedType.value)
  }
  if (statusFilter.value !== 'all') {
    list = list.filter(a => a.status === statusFilter.value)
  }

  return [...list].sort((a, b) => b.alertTime.localeCompare(a.alertTime))
})

const statusOptions = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待复核' },
  { key: 'confirmed', label: '确认违规' },
  { key: 'false-alarm', label: '误报归档' },
]

// ============================================================
// 方法
// ============================================================

function toggleTypeFilter(type: string) {
  selectedType.value = selectedType.value === type ? 'all' : type
}

function alertTypeLabel(type: string): string {
  return typeLabels[type] || type
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    'pending': '待复核',
    'confirmed': '确认违规',
    'false-alarm': '误报归档',
  }
  return map[s] || s
}

function previewSnapshot(row: AlertRecord) {
  previewImage.value = row.snapshotUrl
  previewVisible.value = true
}
</script>

<style scoped>
.fc-alerts {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--h));
}

/* ===== 统计卡片行 ===== */
.fc-alerts__stats {
  display: flex;
  gap: calc(10 * var(--w));
  flex-shrink: 0;
}

.alert-stat-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(4 * var(--h));
  padding: calc(10 * var(--h)) calc(8 * var(--w));
  border: 1px solid rgba(71, 132, 232, 0.25);
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(13, 33, 55, 0.85) 0%, rgba(8, 22, 42, 0.85) 100%);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.alert-stat-card:hover {
  border-color: rgba(71, 132, 232, 0.45);
  background: rgba(71, 132, 232, 0.12);
}

.alert-stat-card.is-active {
  border-color: rgba(71, 132, 232, 0.7);
  background: rgba(71, 132, 232, 0.2);
  box-shadow: 0 0 12px rgba(71, 132, 232, 0.15);
}

/* 颜色变体 */
.alert-stat-card--danger {
  border-left: 3px solid rgba(239, 68, 68, 0.6);
}
.alert-stat-card--warning {
  border-left: 3px solid rgba(245, 158, 11, 0.6);
}

.alert-stat-card__count {
  font-family: 'DIN', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(22px, calc(28 * var(--min-scale)), 34px);
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.alert-stat-card--danger .alert-stat-card__count {
  color: #ef4444;
}

.alert-stat-card--warning .alert-stat-card__count {
  color: #f59e0b;
}

.alert-stat-card__label {
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px);
  color: rgba(137, 181, 255, 0.7);
  white-space: nowrap;
}

/* ===== 处置状态筛选 ===== */
.fc-alerts__filter {
  display: flex;
  gap: calc(8 * var(--w));
  flex-shrink: 0;
}

.fc-alerts__filter-btn {
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

.fc-alerts__filter-btn:hover {
  border-color: rgba(71, 132, 232, 0.65);
  background: rgba(71, 132, 232, 0.15);
}

.fc-alerts__filter-btn.is-active {
  border-color: rgba(71, 132, 232, 0.7);
  background: rgba(71, 132, 232, 0.25);
  color: #ffffff;
}

/* ===== 表格区 ===== */
.fc-alerts__table {
  flex: 1;
  min-height: 0;
}

/* ===== 预警类型标签 ===== */
.alert-type-tag {
  display: inline-block;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 10px;
  border-radius: 10px;
  line-height: 1.55;
  font-weight: 600;
}

.alert-type--off-post,
.alert-type--sleeping,
.alert-type--fire {
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
}

.alert-type--substitution,
.alert-type--smoking {
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.1);
}

/* ===== 处置状态标签 ===== */
.alert-status-tag {
  display: inline-block;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 10px;
  border-radius: 10px;
  line-height: 1.55;
  font-weight: 600;
}

.alert-status--pending {
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.1);
}

.alert-status--confirmed {
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
}

.alert-status--false-alarm {
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.3);
  background: rgba(107, 114, 128, 0.1);
}

/* ===== 截图缩略图 ===== */
.alert-snapshot {
  width: 64px;
  height: 40px;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid rgba(71, 132, 232, 0.25);
  cursor: pointer;
  transition: border-color 0.2s;
}

.alert-snapshot:hover {
  border-color: rgba(60, 211, 215, 0.6);
}

/* ===== 空状态 ===== */
.fc-alerts__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(137, 181, 255, 0.4);
  font-size: clamp(13px, calc(15 * var(--min-scale)), 17px);
}

/* ===== 截图预览浮层 ===== */
.snapshot-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.snapshot-overlay__img {
  max-width: 80vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
}

.snapshot-overlay__close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.snapshot-overlay__close:hover {
  background: rgba(239, 68, 68, 0.5);
  border-color: rgba(239, 68, 68, 0.7);
}
</style>
