<template>
  <el-drawer
    :model-value="modelValue"
    :title="group?.title ?? ''"
    size="750px"
    class="smg-drawer"
    @update:model-value="(v: boolean) => !v && emit('update:modelValue', false)"
  >
    <div v-if="group" class="smg">
      <!-- ===== 头部：设备数量 + 异常/正常占比 ===== -->
      <header class="smg__head">
        <div class="smg__lead">
          <span class="smg__icon">
            <img class="smg__icon-img" :src="icon" alt="设备" />
          </span>
          <div class="smg__meta">
            <div class="smg__label">
              设备数量
              <AppIcon name="error-circle" size="12" class="smg__label-mark" />
            </div>
            <div class="smg__value">
              <span class="smg__num">{{ total }}</span>
              <span class="smg__unit">个</span>
            </div>
          </div>
        </div>

        <div class="smg__chart">
          <SubsystemKpiRing :segments="legend" :total="total" />
          <ul class="smg__legend">
            <li v-for="s in legend" :key="s.label" class="smg__legend-item">
              <span class="smg__legend-key">
                <i class="smg__legend-chip" :style="{ background: s.color }" />
                {{ s.label }}
              </span>
              <b class="smg__legend-value">{{ percent(s.value) }}%</b>
              <span class="smg__legend-count">{{ s.value }} 个</span>
            </li>
          </ul>
        </div>
      </header>

      <div class="smg__rule" />

      <!-- ===== 筛选行 ===== -->
      <div class="smg__filters">
        <div class="smg__filter-left">
          <div class="search-input-wrap smg__search">
            <input
              v-model="keyword"
              class="fi-input"
              placeholder="设备编号/位置"
              @keyup.enter="applyFilters"
            />
            <button v-if="keyword" class="fi-clear" @click="keyword = ''; applyFilters()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <div class="fi-select-wrap smg__select">
            <el-select
              v-model="statusFilter"
              placeholder="运行状态"
              clearable
              :teleported="false"
              popper-class="fi-popper"
              @change="applyFilters"
            >
              <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>

          <div class="fi-select-wrap smg__select">
            <el-select
              v-model="alarmFilter"
              placeholder="报警/故障"
              clearable
              :teleported="false"
              popper-class="fi-popper"
              @change="applyFilters"
            >
              <el-option v-for="a in ALARM_OPTIONS" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
          </div>
        </div>

        <button class="btn-primary smg__query" @click="applyFilters">查询</button>
      </div>

      <!-- ===== 设备表格 ===== -->
      <div class="smg__table-wrap">
        <table class="fi-table smg__table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-status"><span>运行状态</span></th>
              <th class="fi-th col-code"><span>设备编码</span></th>
              <th class="fi-th col-loc"><span>位置</span></th>
              <th class="fi-th col-value"><span>实时值</span></th>
              <th class="fi-th col-time"><span>更新时间</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in pageItems"
              :key="p.id"
              class="fi-tbody-tr smg__row"
              @click="emit('open', p)"
            >
              <td class="fi-td col-status">
                <PointStatusDot :status="statusOf(p)" size="sm" show-label />
              </td>
              <td class="fi-td col-code">{{ p.code }}</td>
              <td class="fi-td col-loc" :title="p.location">{{ shortLoc(p) }}</td>
              <td class="fi-td col-value">
                <MetricCell
                  v-if="primaryMetric(p)"
                  :metric="primaryMetric(p)!"
                  :value="getRuntime(p.id)?.values?.[primaryMetric(p)!.key]"
                  :status="statusOf(p)"
                  :show-bar="false"
                />
                <span v-else>—</span>
              </td>
              <td class="fi-td col-time">{{ timeText(p) }}</td>
            </tr>
            <tr v-if="!pageItems.length">
              <td class="fi-td smg__empty" colspan="5">没有匹配的设备</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap smg__pager">
        <span class="pagi-total">
          共 {{ visible.length }} 条记录 第 {{ page }}/{{ pageCount }} 页
        </span>
        <div class="smg__pager-right">
          <el-pagination
            v-model:current-page="page"
            :page-size="PAGE_SIZE"
            :total="visible.length"
            layout="prev, pager, next"
            background
          />
          <span class="smg__pages">共{{ pageCount }}页</span>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
/**
 * 组态下钻 · 设备列表面板
 *
 * 版式取自设计稿「设备管理/状态监控/消防水系统-系统总览-异常列表」：
 *   头部（设备数量 + 异常/正常占比环）→ 分隔线 → 筛选行 → 设备表格 → 分页
 *
 * 三系统（消防水 / 气体灭火 / 防排烟）共用本组件，
 * 差异只在各系统的点位与报警数据，由上层传入。
 */
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import MetricCell from './MetricCell.vue'
import PointStatusDot from './PointStatusDot.vue'
import SubsystemKpiRing from './SubsystemKpiRing.vue'
import { useSubsystemStore } from '@/stores/subsystem'
import { STATUS_LABELS, STATUS_ORDER } from './status-labels'
import type { PointDef, PointStatus } from '@/types/subsystem'
import type { SubsystemCardLegendItem, SubsystemPointGroup } from '@/types/subsystem-scene'
import type { SubsystemAlarmRecord } from '@/types/subsystem-scene'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    group?: SubsystemPointGroup
    /** 头部图标（统计卡「设备总数」的图标） */
    icon?: string
    /** 报警记录（供「报警/故障」下拉筛选） */
    alarmRecords?: SubsystemAlarmRecord[]
  }>(),
  { icon: '', alarmRecords: () => [] },
)

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  /** 点行 → 打开单点详情 */
  open: [point: PointDef]
}>()

const store = useSubsystemStore()
const { getRuntime } = store

/** 运行状态下拉项：与全站状态词表同源 */
const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as PointStatus[]).map((k) => ({
  value: k,
  label: STATUS_LABELS[k],
}))

/** 报警/故障下拉项：按告警台账的处置状态筛，与运行状态是不同维度 */
const ALARM_OPTIONS = [
  { value: 'unhandled', label: '有未处理报警' },
  { value: 'handled', label: '有已处理报警' },
  { value: 'none', label: '无报警' },
]

const keyword = ref('')
const statusFilter = ref<'' | PointStatus>('')
const alarmFilter = ref<'' | 'unhandled' | 'handled' | 'none'>('')
const page = ref(1)

/** 每页行数：几百台设备一次性渲染会把弹窗 DOM 撑到上万个节点 */
const PAGE_SIZE = 100

watch(
  () => props.group?.key,
  () => {
    keyword.value = ''
    statusFilter.value = ''
    alarmFilter.value = ''
    page.value = 1
  },
)

function statusOf(p: PointDef): PointStatus {
  return getRuntime(p.id)?.status ?? 'unknown'
}

/** 异常优先、其次按编号 */
const sorted = computed(() =>
  [...(props.group?.points ?? [])].sort((a, b) => {
    const d = STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)]
    return d !== 0 ? d : a.code.localeCompare(b.code)
  }),
)

const total = computed(() => sorted.value.length)
const abnormalCount = computed(() => sorted.value.filter(p => statusOf(p) !== 'normal').length)

/** 环上分段与图例同源：分母 = 设备总数 */
const legend = computed<SubsystemCardLegendItem[]>(() => [
  { label: '异常', value: abnormalCount.value, color: 'var(--danger)' },
  { label: '正常', value: total.value - abnormalCount.value, color: 'var(--success)' },
])

/** 占比（%），保留一位小数 */
function percent(v: number): string {
  if (!total.value) return '0.0'
  return ((v / total.value) * 100).toFixed(1)
}

/** 该设备的告警台账处置状态 */
function alarmStateOf(p: PointDef): 'unhandled' | 'handled' | 'none' {
  const rows = props.alarmRecords.filter(r => r.pointId === p.id)
  if (rows.some(r => r.status === 'unhandled')) return 'unhandled'
  if (rows.length) return 'handled'
  return 'none'
}

const visible = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return sorted.value.filter(p => {
    if (kw && !p.code.toLowerCase().includes(kw) && !p.location.toLowerCase().includes(kw)) {
      return false
    }
    if (statusFilter.value && statusOf(p) !== statusFilter.value) return false
    if (alarmFilter.value && alarmStateOf(p) !== alarmFilter.value) return false
    return true
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(visible.value.length / PAGE_SIZE)))

const pageItems = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return visible.value.slice(start, start + PAGE_SIZE)
})

/** 查询按钮 / 回车：筛选条件落到当前结果后回到第一页 */
function applyFilters() {
  page.value = 1
}

/**
 * 主测点：优先模拟量（压力/水位/流量——值守最常看的数），
 * 其次开关量（阀门开/关），状态量不重复展示（运行状态列已经表达）。
 */
function primaryMetric(p: PointDef) {
  const ms = p.metrics
  return ms.find(m => m.kind === 'analog') ?? ms.find(m => m.kind === 'switch')
}

/** 位置压缩：完整位置是 "A 区教学楼 3 层"，这里保留区域 + 楼层 */
function shortLoc(p: PointDef): string {
  let loc = (p.location ?? '').trim()
  if (!loc) return '—'
  const floor = loc.match(/^(.*?)(\d+)\s*层$/)
  if (floor) return `${floor[1].replace(/\s+/g, '')} ${floor[2]}层`
  return loc.replace(/^([A-Z])\s+/, '$1')
}

/** 数据更新时间：值守判断数据是否可信就看这个 */
function timeText(p: PointDef): string {
  const ts = getRuntime(p.id)?.updatedAt
  if (!ts) return '--:--:--'
  const d = new Date(ts)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
}
</script>

<style scoped>
.smg {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

/* ===== 头部 ===== */
.smg__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.smg__lead {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.smg__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
/* 设计稿导出的 SVG 自带底色与圆角，不再叠背景 */
.smg__icon-img {
  width: 48px;
  height: 48px;
  display: block;
}
.smg__meta { min-width: 0; }
.smg__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--text-muted);
  white-space: nowrap;
}
.smg__label-mark {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.smg__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 2px;
}
.smg__num {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.smg__unit {
  font-size: 10px;
  color: var(--text-primary);
}

/* 环形图 + 图例 */
.smg__chart {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.smg__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.smg__legend-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}
.smg__legend-key {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.smg__legend-chip {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.smg__legend-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.smg__legend-count {
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* 分隔线 */
.smg__rule {
  height: 1px;
  background: var(--border-default);
}

/* ===== 筛选行 ===== */
.smg__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.smg__filter-left {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-width: 0;
}
.smg__search { width: 166px; }
.smg__select { width: 166px; }
.smg__query { flex-shrink: 0; }

/* ===== 表格 ===== */
.smg__table-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--border-low);
  border-radius: var(--radius-md, 8px);
}
.smg__table { table-layout: fixed; }
.smg__row { cursor: pointer; }
.smg__empty {
  padding: 32px 12px;
  color: var(--text-muted);
  text-align: center;
}

.col-status { width: 110px; }
.col-code { width: 150px; }
.col-loc { width: auto; }
.col-value { width: 150px; }
.col-time { width: 110px; }

/* ===== 分页 ===== */
.smg__pager {
  padding-top: 4px;
}
.smg__pager-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.smg__pages {
  font-size: var(--font-small, 14px);
  color: var(--pagi-text);
  white-space: nowrap;
}
</style>

<style>
/* 抽屉内框：内容区不留默认外边距，间距由 .smg 自己控制 */
.smg-drawer .el-drawer__body {
  padding-top: 4px;
  padding-bottom: 0;
  overflow: hidden;
}
</style>
