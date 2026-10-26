<template>
  <div class="monitor-page">
    <div class="content-card">

      <!-- ===== 统计卡片行（4 卡：前 3 张数字卡 + 第 4 张带环形占比） ===== -->
      <div class="stat-row">
        <button
          v-for="card in simpleStats"
          :key="card.key"
          :class="['stat-card', { active: store.activeStatFilter === card.filterValue }]"
          @click="store.toggleStatFilter(card.filterValue)"
        >
          <div class="stat-card-icon">
            <img :src="card.icon" alt="" class="stat-card-icon-img" />
          </div>
          <div class="stat-card-body">
            <div class="stat-card-head">
              <span class="stat-card-label">{{ card.label }}</span>
              <AppIcon name="help-circle" class="stat-card-tip" />
            </div>
            <div class="stat-card-num-row">
              <span class="stat-card-num">{{ card.value }}</span>
              <span class="stat-card-unit">{{ card.unit }}</span>
            </div>
          </div>
        </button>

        <!-- 第 4 张：进行中事项 + 环形占比 -->
        <div class="stat-card stat-card-ring">
          <div class="stat-card-icon">
            <img :src="activeIcon" alt="" class="stat-card-icon-img" />
          </div>
          <div class="stat-card-body">
            <div class="stat-card-head">
              <span class="stat-card-label">进行中事项</span>
              <AppIcon name="help-circle" class="stat-card-tip" />
            </div>
            <div class="stat-card-num-row">
              <span class="stat-card-num">{{ activeStats.total }}</span>
              <span class="stat-card-unit">件</span>
            </div>
          </div>
          <div class="ring-wrap">
            <svg class="ring-svg" viewBox="0 0 66 66" aria-hidden="true">
              <circle cx="33" cy="33" r="27" class="ring-track" />
              <circle
                v-if="activeStats.total > 0"
                cx="33" cy="33" r="27"
                class="ring-arc ring-arc-timeout"
                :stroke-dasharray="`${timeoutCirc} ${fullCirc}`"
                stroke-dashoffset="0"
              />
              <circle
                v-if="activeStats.total > 0"
                cx="33" cy="33" r="27"
                class="ring-arc ring-arc-normal"
                :stroke-dasharray="`${normalCirc} ${fullCirc}`"
                :stroke-dashoffset="-timeoutCirc"
              />
            </svg>
            <div class="ring-legend">
              <div class="ring-legend-item">
                <span class="ring-dot ring-dot-timeout" />
                <span class="ring-legend-label">超时</span>
                <span class="ring-legend-value">{{ activeStats.timeoutPct }}%</span>
              </div>
              <div class="ring-legend-item">
                <span class="ring-dot ring-dot-normal" />
                <span class="ring-legend-label">正常</span>
                <span class="ring-legend-value">{{ activeStats.normalPct }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input v-model="query.keyword" class="fi-input" placeholder="工单编号 / 发起人" @keyup.enter="store.search()" />
            <button v-if="query.keyword" class="fi-clear" @click="query.keyword = ''; store.search()">
              <AppIcon name="close" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <div class="fi-select-wrap">
            <el-select v-model="query.priority" placeholder="优先级" clearable class="fi-select" :teleported="false" popper-class="fi-popper" @change="store.search()">
              <el-option label="紧急" value="urgent" />
              <el-option label="高" value="high" />
              <el-option label="普通" value="normal" />
              <el-option label="低" value="low" />
            </el-select>
          </div>

          <div class="fi-select-wrap">
            <el-select v-model="query.slaStatus" placeholder="SLA状态" clearable class="fi-select" :teleported="false" popper-class="fi-popper" @change="store.search()">
              <el-option label="正常" value="normal" />
              <el-option label="预警" value="warning" />
              <el-option label="超时" value="timeout" />
            </el-select>
          </div>

          <div class="fi-date-range-wrap">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :teleported="false" popper-class="fi-popper" :shortcuts="dateShortcuts" @change="onDateChange" />
          </div>

          <button class="btn-primary" @click="store.search()">查询</button>
          <button class="btn-default" @click="handleReset">重置</button>
        </div>

        <div class="filter-right">
          <button class="btn-primary" @click="openCreate">
            <AppIcon name="plus" class="btn-add-icon" />
            发起工单
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th fi-th-sort col-sla" @click="toggleSlaSort">
                <span>SLA</span>
                <TableSortIcon :direction="slaSortDir" />
              </th>
              <th class="fi-th col-order"><span>工单编号</span></th>
              <th class="fi-th col-title"><span>工单标题</span></th>
              <th class="fi-th col-pri"><span>优先级</span></th>
              <th class="fi-th fi-th-sort col-time" @click="toggleSort">
                <span>发起时间</span>
                <TableSortIcon :direction="timeSortDir" />
              </th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr
              v-for="row in sortedList"
              :key="row.id"
              class="fi-tbody-tr"
            >
              <td class="fi-td col-status">
                <StatusTag :status="row.status" :label="statusLabel(row.status)" />
              </td>
              <td class="fi-td col-sla">
                <span :class="['sla-pill', `sla-${row.slaStatus}`]">
                  <span class="sla-dot" />
                  {{ slaLabel(row.slaStatus) }}
                </span>
              </td>
              <td class="fi-td col-order">
                <button class="btn-link" @click="router.push(`/system/order/${row.id}`)">{{ row.orderNo }}</button>
              </td>
              <td class="fi-td col-title">{{ row.title }}</td>
              <td class="fi-td col-pri">
                <StatusTag :status="row.priority" :label="priorityLabel(row.priority)" />
              </td>
              <td class="fi-td col-time">{{ row.createdAt }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" title="查看" @click="router.push(`/system/order/${row.id}`)">
                    <AppIcon name="preview" class="act-icon" />
                  </button>
                  <button
                    v-if="canTransfer(row.status)"
                    class="act-btn act-transfer"
                    title="转交"
                    @click="onTransfer(row)"
                  >
                    <AppIcon name="swap" class="act-icon" />
                  </button>
                  <button
                    v-if="canRevoke(row.status)"
                    class="act-btn act-revoke"
                    title="撤销"
                    @click="onRevoke(row)"
                  >
                    <AppIcon name="rollback" class="act-icon" />
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import { useWorkOrderStore } from '@/stores/work-order'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'

const store = useWorkOrderStore()
const { confirm } = useConfirm()
const router = useRouter()
const query = store.query

// ===== Mock 5 条数据（设计稿示意）=====
// 真实数据接入后由 store.fetchList() 覆盖；保留本地态仅用于首次渲染/无数据兜底
const MOCK_ROWS = [
  { id: 1, orderNo: 'WO20260604-011', title: '故障报修', status: 'manual_closed', priority: 'urgent', slaStatus: 'timeout', createdAt: '2025-10-09 09:40' },
  { id: 2, orderNo: 'WO20260604-012', title: '隐患整改工单', status: 'active', priority: 'low', slaStatus: 'timeout', createdAt: '2025-10-09 09:40' },
  { id: 3, orderNo: 'WO20260604-013', title: '设备维修工单', status: 'cancelled', priority: 'normal', slaStatus: 'normal', createdAt: '2025-10-09 09:40' },
  { id: 4, orderNo: 'WO20260604-014', title: '安全生产督办', status: 'active', priority: 'high', slaStatus: 'normal', createdAt: '2025-10-09 09:40' },
  { id: 5, orderNo: 'WO20260604-015', title: '故障报修', status: 'closed', priority: 'low', slaStatus: 'normal', createdAt: '2025-10-09 09:40' },
] as const

type MockRow = typeof MOCK_ROWS[number]
type SlaStatus = 'normal' | 'warning' | 'timeout'

// 展示用列表：store 没数据时降级到 mock（让设计稿还原）
const displayList = computed<MockRow[]>(() => {
  const real = store.list
  if (real && real.length > 0) {
    return real.map((r: any) => ({
      id: r.id,
      orderNo: r.orderNo,
      title: r.title,
      status: r.status,
      priority: r.priority,
      slaStatus: (r.sla?.slaStatus || 'normal') as SlaStatus,
      createdAt: r.createdAt,
    })) as MockRow[]
  }
  return [...MOCK_ROWS]
})

// ===== 统计（前端聚合 mock 数据）=====
const computedStats = computed(() => {
  const list = displayList.value
  const total = list.length
  const closed = list.filter(r => r.status === 'closed' || r.status === 'manual_closed').length
  const cancelled = list.filter(r => r.status === 'cancelled').length
  const active = list.filter(r => r.status === 'active').length
  const activeTimeout = list.filter(r => r.status === 'active' && r.slaStatus === 'timeout').length
  const activeNormal = list.filter(r => r.status === 'active' && r.slaStatus !== 'timeout').length
  return { total, closed, cancelled, active, activeTimeout, activeNormal }
})

// ===== 顶部统计卡 icon（Figma 导出 SVG，存于 public/icons/） =====
const STAT_ICONS = {
  all: '/icons/icon-handbag.svg',
  closed: '/icons/icon-inbox-success-2.svg',
  cancelled: '/icons/icon-folder-failed.svg',
  active: '/icons/icon-folder-upload.svg',
}

const simpleStats = computed(() => [
  { key: 'all', label: '累计协同事项', value: computedStats.value.total, unit: '件', icon: STAT_ICONS.all, filterValue: '' },
  { key: 'closed', label: '已关闭事项', value: computedStats.value.closed, unit: '件', icon: STAT_ICONS.closed, filterValue: 'closed' },
  { key: 'cancelled', label: '已取消事项', value: computedStats.value.cancelled, unit: '件', icon: STAT_ICONS.cancelled, filterValue: 'cancelled' },
])

// 第 4 卡（带环形）icon
const activeIcon = STAT_ICONS.active

const activeStats = computed(() => {
  const t = computedStats.value.active
  const timeout = computedStats.value.activeTimeout
  const normal = computedStats.value.activeNormal
  return {
    total: t,
    timeout,
    normal,
    timeoutPct: t > 0 ? Math.round((timeout / t) * 100) : 0,
    normalPct: t > 0 ? Math.round((normal / t) * 100) : 0,
  }
})

// 环形图周长：2πr = 2π×27 ≈ 169.65
const R = 27
const fullCirc = computed(() => Math.round(2 * Math.PI * R * 100) / 100)
const timeoutCirc = computed(() => {
  const t = activeStats.value.total
  if (t <= 0) return 0
  return Math.round((activeStats.value.timeout / t) * fullCirc.value * 100) / 100
})
const normalCirc = computed(() => {
  const t = activeStats.value.total
  if (t <= 0) return 0
  return Math.round((activeStats.value.normal / t) * fullCirc.value * 100) / 100
})

// ===== 筛选 =====
const dateShortcuts = [
  { text: '今天', value: () => { const d = new Date(); return [d, d] as [Date, Date] } },
  { text: '本周', value: () => { const d = new Date(); const s = new Date(d); s.setDate(d.getDate() - d.getDay() + 1); return [s, d] as [Date, Date] } },
  { text: '本月', value: () => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); return [s, d] as [Date, Date] } },
  { text: '近30天', value: () => { const d = new Date(); const s = new Date(d.getTime() - 30 * 86400000); return [s, d] as [Date, Date] } },
]
function last30Days(): [Date, Date] {
  const d = new Date()
  const s = new Date(d.getTime() - 30 * 86400000)
  return [s, d]
}
const dateRange = ref<[Date, Date] | null>(last30Days())
function onDateChange(v: [Date, Date] | null) {
  if (v) {
    query.startDate = v[0].toISOString().slice(0, 10)
    query.endDate = v[1].toISOString().slice(0, 10)
  } else {
    query.startDate = ''
    query.endDate = ''
  }
  store.search()
}

// ===== 排序 =====
const timeSortDir = computed<'none' | 'asc' | 'desc'>(() => {
  if (query.sortField === 'createdAt') return query.sortOrder as 'asc' | 'desc'
  return 'none'
})
const slaSortDir = computed<'none' | 'asc' | 'desc'>(() => {
  if (query.sortField === 'slaStatus') return query.sortOrder as 'asc' | 'desc'
  return 'none'
})
function toggleSort() {
  query.sortField = 'createdAt'
  query.sortOrder = query.sortOrder === 'asc' ? 'desc' : 'asc'
  store.search()
}
function toggleSlaSort() {
  if (query.sortField === 'slaStatus') {
    query.sortOrder = query.sortOrder === 'desc' ? 'asc' : 'desc'
  } else {
    query.sortField = 'slaStatus'
    query.sortOrder = 'desc' // 超时优先
  }
  store.search()
}

// 前端按 sla / time 排序（仅对 mock 列表生效；真实数据由后端排序）
const slaOrder: Record<SlaStatus, number> = { timeout: 0, warning: 1, normal: 2 }
const sortedList = computed(() => {
  const list = [...displayList.value]
  if (query.sortField === 'createdAt' && query.sortOrder) {
    list.sort((a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return query.sortOrder === 'asc' ? cmp : -cmp
    })
  } else if (query.sortField === 'slaStatus' && query.sortOrder) {
    list.sort((a, b) => {
      const cmp = slaOrder[a.slaStatus] - slaOrder[b.slaStatus]
      return query.sortOrder === 'asc' ? cmp : -cmp
    })
  }
  return list
})

// ===== 状态/标签映射 =====
const STATUS_LABEL_MAP: Record<string, string> = {
  draft: '草稿',
  active: '进行中',
  closed: '已关闭',
  cancelled: '已取消',
  manual_closed: '手动关闭',
}
const PRIORITY_LABEL_MAP: Record<string, string> = { urgent: '紧急', high: '高', normal: '普通', low: '低' }
const SLA_LABEL_MAP: Record<SlaStatus, string> = { timeout: '超时', warning: '预警', normal: '正常' }
function statusLabel(s: string) { return STATUS_LABEL_MAP[s] || s }
function priorityLabel(p: string) { return PRIORITY_LABEL_MAP[p] || p }
function slaLabel(s: SlaStatus) { return SLA_LABEL_MAP[s] || s }

// ===== 操作权限 =====
function canTransfer(status: string) {
  // 进行中可转交
  return status === 'active'
}
function canRevoke(status: string) {
  // 进行中可撤销
  return status === 'active'
}
async function onTransfer(row: MockRow) {
  try {
    await confirm(`确认将「${row.title}」转交给其他人？`, '转交确认')
    ElMessage.success('已转交（mock）')
  } catch { /* 用户取消 */ }
}
async function onRevoke(row: MockRow) {
  try {
    await confirm(`确认撤销「${row.title}」？撤销后将无法恢复`, '撤销确认', { type: 'error' })
    ElMessage.success('已撤销（mock）')
  } catch { /* 用户取消 */ }
}
function openCreate() {
  // 复用现有 CreateOrderDialog 入口：直接跳到创建页（与设计稿保持一致）
  router.push('/system/template-list?action=create')
}

function handleReset() {
  dateRange.value = last30Days()
  store.reset()
  if (dateRange.value) {
    query.startDate = dateRange.value[0].toISOString().slice(0, 10)
    query.endDate = dateRange.value[1].toISOString().slice(0, 10)
  }
  store.search()
}

// ===== 定时刷新 =====
let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (!query.sortField) {
    query.sortField = 'createdAt'
    query.sortOrder = 'desc'
  }
  store.setDataScope(null)
  if (dateRange.value) {
    query.startDate = dateRange.value[0].toISOString().slice(0, 10)
    query.endDate = dateRange.value[1].toISOString().slice(0, 10)
  }
  store.fetchList()
  refreshTimer = setInterval(() => { store.fetchList() }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.monitor-page { height: 100%; }

.content-card {
  background: var(--bg-card);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-xl, 16px);
  overflow: auto;
}

/* ===== 统计卡片行 ===== */
.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.5fr;
  gap: var(--spacing-xl, 16px);
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 12px);
  padding: var(--spacing-xl, 16px);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  cursor: pointer;
  transition: border-color .15s, background .15s;
  font-family: inherit;
  min-height: 90px;
}
.stat-card:hover { border-color: var(--accent-primary); }
.stat-card.active {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}
.stat-card-ring {
  cursor: default;
  justify-content: space-between;
}
.stat-card-ring:hover { border-color: var(--border-default); }

.stat-card-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md, 8px);
  background: rgba(54, 120, 227, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-card-icon-img {
  width: 28px;
  height: 28px;
  display: block;
  object-fit: contain;
}
.stat-card-icon-svg {
  font-size: 24px;
  color: var(--accent-primary);
}

.stat-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 4px);
}
.stat-card-head {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs, 4px);
}
.stat-card-label {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}
.stat-card-tip {
  font-size: 12px;
  color: var(--text-muted);
  opacity: .6;
}
.stat-card-num-row {
  display: inline-flex;
  align-items: baseline;
  gap: var(--spacing-md, 8px);
}
.stat-card-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.stat-card-unit {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  line-height: 1.2;
}

/* ===== 环形图 ===== */
.ring-wrap {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl, 16px);
  flex-shrink: 0;
}
.ring-svg {
  width: 66px;
  height: 66px;
  transform: rotate(-90deg);
  flex-shrink: 0;
}
.ring-track {
  fill: none;
  stroke: var(--border-low);
  stroke-width: 8;
}
.ring-arc {
  fill: none;
  stroke-width: 8;
  stroke-linecap: butt;
  transition: stroke-dasharray .3s;
}
.ring-arc-timeout { stroke: var(--semantic-danger); }
.ring-arc-normal { stroke: var(--accent-primary); }

.ring-legend {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 8px);
  padding-top: 2px;
}
.ring-legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
  font-size: var(--font-xs, 12px);
}
.ring-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.ring-dot-timeout { background: var(--semantic-danger); }
.ring-dot-normal { background: var(--accent-primary); }
.ring-legend-label { color: var(--text-muted); }
.ring-legend-value {
  color: var(--text-tertiary);
  font-weight: 700;
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ===== 筛选栏 ===== */
.filter-left .fi-select-wrap { width: 150px; flex-shrink: 0; }
.filter-left .search-input-wrap { width: 200px; flex-shrink: 0; }
.filter-left .fi-date-range-wrap { width: 270px; flex-shrink: 0; }

/* ===== SLA 列胶囊 ===== */
.sla-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
  padding: 2px var(--spacing-lg, 12px);
  border-radius: var(--radius-sm, 4px);
  font-size: var(--font-small, 14px);
  border: 1px solid transparent;
}
.sla-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sla-pill.sla-timeout {
  color: var(--semantic-danger);
  background: var(--semantic-danger-bg);
  border-color: var(--semantic-danger-bg);
}
.sla-pill.sla-timeout .sla-dot { background: var(--semantic-danger); }
.sla-pill.sla-warning {
  color: var(--notice);
  background: var(--notice-bg);
  border-color: var(--notice-bg);
}
.sla-pill.sla-warning .sla-dot { background: var(--notice); }
.sla-pill.sla-normal {
  color: var(--accent-primary);
  background: #DDEDFF;
  border-color: #DDEDFF;
}
.sla-pill.sla-normal .sla-dot { background: var(--accent-primary); }

/* ===== 表格列宽 ===== */
.col-status { width: 100px; }
.col-sla { width: 110px; }
.col-order { min-width: 160px; }
.col-title { min-width: 160px; }
.col-pri { width: 90px; }
.col-time { min-width: 170px; }
.col-actions { width: 130px; }

.col-status.fi-th, .col-status.fi-td,
.col-sla.fi-th, .col-sla.fi-td,
.col-pri.fi-th, .col-pri.fi-td,
.col-time.fi-th, .col-time.fi-td,
.col-actions.fi-th, .col-actions.fi-td { text-align: center; }
.col-order.fi-th, .col-order.fi-td,
.col-title.fi-th, .col-title.fi-td { text-align: left; }

.btn-link {
  color: var(--accent-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0;
  font: inherit;
}
.btn-link:hover { text-decoration: underline; }

/* 操作列 — 转交/撤销图标（弱化）*/
.act-btn.act-transfer { color: var(--text-secondary); }
.act-btn.act-revoke { color: var(--warning); }
.act-btn.act-revoke:hover { color: var(--warning); opacity: .85; }

/* ===== 排序列头 ===== */
.sortable { cursor: pointer; user-select: none; }
.fi-th-sort:hover { color: var(--accent-primary); }

/* ===== 分页器 EP 变量覆盖 ===== */
:deep(.el-pagination .el-pager li) {
  background-color: var(--pagi-bg); color: var(--pagi-text);
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .el-pager li.is-active) {
  background-color: var(--accent-primary); color: var(--btn-primary-color);
  border-color: var(--accent-primary);
}
:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important;
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .btn-prev.is-disabled),
:deep(.el-pagination .btn-next.is-disabled) {
  color: var(--text-muted) !important; background-color: var(--pagi-bg) !important;
}
:deep(.el-pagination .el-select .el-select__wrapper) {
  background-color: var(--bg-card) !important; color: var(--text-secondary);
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-pagination__jump .el-input__inner) {
  color: var(--text-primary) !important;
  background-color: var(--bg-card);
}

/* ===== 响应式 ===== */
@media (max-width: 1600px) {
  .stat-row { grid-template-columns: 1fr 1fr 1fr; }
  .stat-card-ring { grid-column: 1 / -1; }
}
</style>
