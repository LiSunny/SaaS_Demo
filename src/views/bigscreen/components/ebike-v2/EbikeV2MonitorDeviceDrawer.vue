<template>
  <Transition name="md-mask">
    <!-- 遮罩：点击空白处收起抽屉 -->
    <div v-if="modelValue" class="md__mask" @click="close" />
  </Transition>

  <Transition name="md-slide">
    <aside v-if="modelValue" class="md" role="dialog" aria-modal="true" aria-label="设备清单">
      <!-- ===== 标题行 ===== -->
      <header class="md__head">
        <h3 class="md__title">{{ detail ? detail.code : (node?.label ?? '设备清单') }}</h3>
        <button
          v-if="detail"
          type="button"
          class="md__icon-btn md__icon-btn--back"
          title="返回设备清单"
          aria-label="返回设备清单"
          @click="detail = null"
        >
          ‹
        </button>
        <button type="button" class="md__icon-btn" title="关闭" aria-label="关闭" @click="close">
          ×
        </button>
      </header>

      <!-- ===== 二级：单台设备详情 ===== -->
      <div v-if="detail" class="md__detail">
        <div class="md__status" :class="`is-${statusOf(detail)}`">
          <span class="md__status-text">{{ statusLabel(detail) }}</span>
          <span class="md__status-time">更新于 {{ timeText(detail) }}</span>
        </div>

        <dl class="md__facts">
          <div class="md__fact">
            <dt class="md__fact-k">设备编号</dt>
            <dd class="md__fact-v">{{ detail.code }}</dd>
          </div>
          <div class="md__fact">
            <dt class="md__fact-k">设备类型</dt>
            <dd class="md__fact-v">{{ typeNameOf(detail) }}</dd>
          </div>
          <div class="md__fact">
            <dt class="md__fact-k">安装位置</dt>
            <dd class="md__fact-v">{{ detail.location || '位置未登记' }}</dd>
          </div>
          <div v-if="detail.videoChannel" class="md__fact">
            <dt class="md__fact-k">视频通道</dt>
            <dd class="md__fact-v">CH-{{ detail.videoChannel }}</dd>
          </div>
        </dl>

        <section class="md__section">
          <h4 class="md__section-title">实时测点</h4>
          <div v-for="m in detail.metrics" :key="m.key" class="md__metric">
            <div class="md__metric-head">
              <span class="md__metric-label">{{ m.label }}</span>
              <span v-if="m.unit" class="md__metric-unit">({{ m.unit }})</span>
            </div>
            <span class="md__metric-value" :class="{ 'is-abnormal': isAbnormal(statusOf(detail)) }">
              {{ valueText(detail, m.key) }}
            </span>
            <div v-if="m.range" class="md__metric-range">
              量程 {{ m.range[0] }} ~ {{ m.range[1] }}
              <span v-if="m.highLimit != null" class="md__lim md__lim--hi">高限 {{ m.highLimit }}</span>
              <span v-if="m.lowLimit != null" class="md__lim md__lim--lo">低限 {{ m.lowLimit }}</span>
            </div>
          </div>
          <p v-if="!detail.metrics.length" class="md__empty">该设备未登记测点</p>
        </section>
      </div>

      <!-- ===== 一级：设备清单（版式同「设备设施台账 › 运行监控 › 系统监测」的下钻抽屉） ===== -->
      <template v-else>
        <!-- 设备数量 + 异常 / 正常占比 -->
        <section class="md__stat">
          <div class="md__stat-lead">
            <span class="md__stat-icon">
              <img :src="deviceIcon" alt="" />
            </span>
            <div class="md__stat-meta">
              <div class="md__stat-label">
                设备数量
                <AppIcon name="error-circle" size="12" class="md__stat-info" />
              </div>
              <div class="md__stat-value">
                <span class="md__stat-num">{{ total }}</span>
                <span class="md__stat-unit">个</span>
              </div>
            </div>
          </div>

          <div class="md__chart">
            <!-- 占比环：异常段走全页唯一红，正常段走中性色（正常不占语义色） -->
            <svg
              class="md__ring"
              :width="RING_SIZE"
              :height="RING_SIZE"
              viewBox="0 0 56 56"
              role="img"
              :aria-label="`异常 ${abnormalCount} 个，正常 ${normalCount} 个`"
            >
              <circle class="md__ring-track" cx="28" cy="28" :r="RING_RADIUS" />
              <circle
                v-for="a in ringArcs"
                :key="a.key"
                class="md__ring-seg"
                cx="28"
                cy="28"
                :r="RING_RADIUS"
                :stroke="a.color"
                :stroke-dasharray="a.dash"
                :stroke-dashoffset="a.offset"
              />
            </svg>
            <ul class="md__legend">
              <li class="md__legend-item">
                <span class="md__legend-key"><i class="md__legend-chip" :style="{ background: ANOMALY_COLOR }" />异常</span>
                <b class="md__legend-value">{{ percent(abnormalCount) }}%</b>
                <span class="md__legend-count">{{ abnormalCount }} 个</span>
              </li>
              <li class="md__legend-item">
                <span class="md__legend-key"><i class="md__legend-chip" :style="{ background: NORMAL_COLOR }" />正常</span>
                <b class="md__legend-value">{{ percent(normalCount) }}%</b>
                <span class="md__legend-count">{{ normalCount }} 个</span>
              </li>
            </ul>
          </div>
        </section>

        <div class="md__rule" />

        <!-- 筛选行 -->
        <div class="md__filters">
          <div class="md__search">
            <input
              v-model="keyword"
              class="md__search-input"
              placeholder="设备编号/位置"
              @keyup.enter="applyFilters"
            />
            <button v-if="keyword" type="button" class="md__search-clear" title="清除" @click="keyword = ''; applyFilters()">
              ×
            </button>
            <AppIcon v-else name="search" class="md__search-icon" />
          </div>

          <select v-model="statusFilter" class="md__select" @change="applyFilters">
            <option value="">运行状态</option>
            <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>

          <select v-model="alarmFilter" class="md__select" @change="applyFilters">
            <option value="">报警/故障</option>
            <option v-for="a in ALARM_OPTIONS" :key="a.value" :value="a.value">{{ a.label }}</option>
          </select>

          <button type="button" class="md__query" @click="applyFilters">查询</button>
        </div>

        <!-- 设备表格 -->
        <div class="md__table-wrap">
          <table class="md__table">
            <thead>
              <tr>
                <th class="md__th md__th--status">运行状态</th>
                <th class="md__th md__th--code">设备编码</th>
                <th class="md__th md__th--loc">位置</th>
                <th class="md__th md__th--value">实时值</th>
                <th class="md__th md__th--time">更新时间</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pageRows"
                :key="row.point.id"
                class="md__tr"
                :class="{ 'is-abnormal': row.abnormal }"
                @click="openDetail(row.point)"
              >
                <td class="md__td md__td--status">
                  <span class="md__status-cell" :class="`is-${row.status}`">
                    <i class="md__status-dot" />
                    {{ row.statusText }}
                  </span>
                </td>
                <td class="md__td md__td--code">
                  <!-- 编码列做成按钮：整行可点，但键盘 / 读屏要有个真正的可聚焦入口 -->
                  <button type="button" class="md__code-btn" @click="openDetail(row.point)">
                    {{ row.point.code }}
                  </button>
                </td>
                <td class="md__td md__td--loc" :title="row.point.location">
                  {{ row.point.location || '—' }}
                </td>
                <td class="md__td md__td--value">
                  <span class="md__value" :class="{ 'is-abnormal': row.abnormal }">
                    {{ row.value }}<span class="md__value-unit">{{ row.unit }}</span>
                  </span>
                </td>
                <td class="md__td md__td--time">{{ row.clock }}</td>
              </tr>
              <tr v-if="!pageRows.length">
                <td class="md__td md__empty" colspan="5">没有匹配的设备</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="md__pager">
          <span class="md__pager-total">共 {{ visible.length }} 条记录 第 {{ page }}/{{ pageCount }} 页</span>
          <div class="md__pager-right">
            <button
              type="button"
              class="md__page-btn"
              :disabled="page <= 1"
              title="上一页"
              @click="page = Math.max(1, page - 1)"
            >
              ‹
            </button>
            <button
              v-for="p in pageNumbers"
              :key="p"
              type="button"
              class="md__page-num"
              :class="{ 'is-active': p === page }"
              @click="page = p"
            >
              {{ p }}
            </button>
            <button
              type="button"
              class="md__page-btn"
              :disabled="page >= pageCount"
              title="下一页"
              @click="page = Math.min(pageCount, page + 1)"
            >
              ›
            </button>
            <span class="md__pages">共{{ pageCount }}页</span>
          </div>
        </div>
      </template>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
/**
 * 大屏「系统监测」页 · 设备下钻抽屉
 *
 * **一级（设备清单）的版式与内容，与「设备设施台账 › 运行监控 › 系统监测」的下钻抽屉一致**：
 *   头部（设备数量 + 异常/正常占比环）→ 分隔线 → 筛选行（编号位置 / 运行状态 / 报警故障 / 查询）
 *   → 设备表格（运行状态 / 设备编码 / 位置 / 实时值 / 更新时间）→ 分页
 * 后台那份是浅色 Element Plus 抽屉，贴到大屏上会割裂，这里按同一版式重画成深色玻璃底。
 *
 * 二级（点行看单台详情）沿用大屏自己的深色卡片。
 *
 * 数据与后台同源：
 *   设备清单 = 该图元绑定的那批设备（各系统绑定表）
 *   实时值   = useSubsystemStore 的运行时值（3s 刷新）
 *   报警/故障筛选 = 各系统的报警记录 store（stores/{firewater,gas,smoke}-alarm.ts）
 * 所以大屏点开看到的台数与状态，和后台那边逐条对得上。
 *
 * 配色按大屏自己的口径：异常统一一个红（#FF8080），正常走中性色 —— 全页角标只留一个红，
 * 档位由状态文案承担。环上「正常」段因此是中性蓝而不是绿色。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSubsystemStore } from '@/stores/subsystem'
import { STATUS_LABELS, STATUS_ORDER } from '@/components/subsystem/status-labels'
import AppIcon from '@/components/base/AppIcon.vue'
import { deviceTypeName, type MonitorNodeView } from './monitor-data'
import type { MetricDef, PointDef, PointStatus } from '@/types/subsystem'
import type { SubsystemAlarmRecord } from '@/types/subsystem-scene'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 被点击的图元（其 members 即这批设备） */
    node?: MonitorNodeView | null
    /** 当前系统的报警记录（供「报警/故障」下拉筛选） */
    alarmRecords?: SubsystemAlarmRecord[]
  }>(),
  { node: null, alarmRecords: () => [] },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const store = useSubsystemStore()
const { getRuntime } = store

/** 设备数量图标：与后台统计卡「设备总数」同一个图标（kpi-device-total.svg） */
const deviceIcon = '/icons/fire-water/kpi-device-total.svg'

/** 环形图尺寸与半径（与后台 SubsystemKpiRing 同口径：直径 56 → r 22，留 6px 给描边） */
const RING_SIZE = 56
const RING_RADIUS = RING_SIZE / 2 - 6

/** 环上两段的颜色：异常走全页唯一红，正常走中性色 */
const ANOMALY_COLOR = '#ff8080'
const NORMAL_COLOR = '#5f96d4'

/** 状态下拉项：与全站状态词表同源 */
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
/** 二级详情当前查看的设备 */
const detail = ref<PointDef | null>(null)

/** 每页行数：与后台下钻抽屉一致（100 行 / 页） */
const PAGE_SIZE = 100

/** 换一批设备 / 收起抽屉时回到一级 */
watch(
  () => props.node?.id,
  () => {
    detail.value = null
    keyword.value = ''
    statusFilter.value = ''
    alarmFilter.value = ''
    page.value = 1
  },
)

watch(
  () => props.modelValue,
  (v) => {
    if (!v) detail.value = null
  },
)

/** Esc 关闭抽屉（模态的常规预期） */
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !props.modelValue) return
  close()
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
  { immediate: true },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

/** 该图元名下的设备 */
const members = computed<PointDef[]>(() => props.node?.members ?? [])

function statusOf(p: PointDef): PointStatus {
  return getRuntime(p.id)?.status ?? 'unknown'
}

function statusLabel(p: PointDef): string {
  return STATUS_LABELS[statusOf(p)]
}

function isAbnormal(s: PointStatus): boolean {
  return s !== 'normal'
}

const total = computed(() => members.value.length)
const abnormalCount = computed(() => members.value.filter((p) => isAbnormal(statusOf(p))).length)
const normalCount = computed(() => total.value - abnormalCount.value)

/** 占比（%），保留一位小数 */
function percent(v: number): string {
  if (!total.value) return '0.0'
  return ((v / total.value) * 100).toFixed(1)
}

/** 环上分段：异常段在前、正常段在后 */
const ringArcs = computed(() => {
  const circumference = 2 * Math.PI * RING_RADIUS
  const segs = [
    { key: 'abnormal', value: abnormalCount.value, color: ANOMALY_COLOR },
    { key: 'normal', value: normalCount.value, color: NORMAL_COLOR },
  ]
  let acc = 0
  return segs.map((s) => {
    const frac = total.value > 0 ? s.value / total.value : 0
    const len = Math.max(0, frac * circumference)
    const arc = {
      key: s.key,
      color: s.color,
      dash: `${len} ${circumference - len}`,
      offset: -acc,
    }
    acc += len
    return arc
  })
})

/** 异常优先、其次按编号 */
const sorted = computed(() =>
  [...members.value].sort((a, b) => {
    const d = STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)]
    return d !== 0 ? d : a.code.localeCompare(b.code)
  }),
)

/** 该设备的告警台账处置状态 */
function alarmStateOf(p: PointDef): 'unhandled' | 'handled' | 'none' {
  const rows = props.alarmRecords.filter((r) => r.pointId === p.id)
  if (rows.some((r) => r.status === 'unhandled')) return 'unhandled'
  if (rows.length) return 'handled'
  return 'none'
}

const visible = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return sorted.value.filter((p) => {
    if (kw && !p.code.toLowerCase().includes(kw) && !p.location.toLowerCase().includes(kw)) {
      return false
    }
    if (statusFilter.value && statusOf(p) !== statusFilter.value) return false
    if (alarmFilter.value && alarmStateOf(p) !== alarmFilter.value) return false
    return true
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(visible.value.length / PAGE_SIZE)))

/** 表格行：状态 / 实时值在渲染前算好，模板里不再反复调函数 */
interface DrawerRow {
  point: PointDef
  status: PointStatus
  statusText: string
  abnormal: boolean
  value: string
  unit: string
  clock: string
}

const pageRows = computed<DrawerRow[]>(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return visible.value.slice(start, start + PAGE_SIZE).map((p) => {
    const status = statusOf(p)
    const mv = primaryValueOf(p)
    return {
      point: p,
      status,
      statusText: STATUS_LABELS[status],
      abnormal: isAbnormal(status),
      value: mv.value,
      unit: mv.unit,
      clock: clockText(p),
    }
  })
})

/** 页码按钮：最多显示 5 个（首页 / 尾页 + 当前页附近） */
const pageNumbers = computed(() => {
  const total_ = pageCount.value
  if (total_ <= 5) return Array.from({ length: total_ }, (_, i) => i + 1)
  const set = new Set([1, total_, page.value, page.value - 1, page.value + 1])
  return [...set].filter((n) => n >= 1 && n <= total_).sort((a, b) => a - b)
})

function applyFilters() {
  page.value = 1
}

function openDetail(p: PointDef) {
  detail.value = p
}

function close() {
  emit('update:modelValue', false)
}

/** 设备类型名（档案模板名） */
function typeNameOf(p: PointDef): string {
  return deviceTypeName(p.typeKey, store.activeKey)
}

/**
 * 主测点
 *
 * 优先模拟量（压力/水位/流量——值守最常看的数），其次开关量（阀门开/关）；
 * 状态量不重复展示（状态列已经表达）。
 */
function primaryMetric(p: PointDef): MetricDef | undefined {
  return p.metrics.find((m) => m.kind === 'analog') ?? p.metrics.find((m) => m.kind === 'switch')
}

/** 实时值文本 */
function valueText(p: PointDef, key: string): string {
  const m = p.metrics.find((x) => x.key === key)
  const v = getRuntime(p.id)?.values?.[key]
  if (v == null) return '--'
  // 状态量 / 开关量给的是枚举值（normal / open …）→ 取档案里的中文标签，
  // 直接把英文枚举甩到大屏上等于没做本地化
  if (m && (m.kind === 'status' || m.kind === 'switch')) {
    return m.states?.find((s) => s.value === v)?.label ?? String(v)
  }
  const num = typeof v === 'number' ? v.toFixed(m?.precision ?? 2) : String(v)
  return m?.unit ? `${num} ${m.unit}` : num
}

/** 主测点实时值（表格列）：数值与单位分开渲染，单位小一号 */
function primaryValueOf(p: PointDef): { value: string; unit: string } {
  const m = primaryMetric(p)
  if (!m) return { value: '—', unit: '' }
  const v = getRuntime(p.id)?.values?.[m.key]
  if (v == null) return { value: '--', unit: '' }
  if (m.kind === 'status' || m.kind === 'switch') {
    return { value: m.states?.find((s) => s.value === v)?.label ?? String(v), unit: '' }
  }
  const num = typeof v === 'number' ? v.toFixed(m.precision ?? 2) : String(v)
  return { value: num, unit: m.unit ?? '' }
}

/** 更新时间：值守判断数据是否可信就看这个 */
function timeText(p: PointDef): string {
  const ts = getRuntime(p.id)?.updatedAt
  if (!ts) return '--'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 表格里的更新时间只要时分秒 */
function clockText(p: PointDef): string {
  const ts = getRuntime(p.id)?.updatedAt
  if (!ts) return '--:--:--'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire/fire-common.scss" as fire;

/* 遮罩：只压暗画面右侧，不挡画布交互（画布已点过一次，这里只是收拢注意力） */
.md__mask {
  position: fixed;
  top: vh(68);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10029;
  background: rgba(2, 14, 32, 0.32);
}

/* ===== 抽屉本体 ===== */
.md {
  position: fixed;
  top: vh(68);
  right: 0;
  bottom: 0;
  z-index: 10030;
  width: vw(760);
  display: flex;
  flex-direction: column;
  gap: vh(14);
  padding: vh(18) vw(20);
  border-left: 1px solid rgba(120, 190, 255, 0.22);
  background: rgba(2, 26, 58, 0.96);
  backdrop-filter: blur(9px) saturate(125%);
  -webkit-backdrop-filter: blur(9px) saturate(125%);
  box-shadow: -8px 0 26px rgba(0, 0, 0, 0.4);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
}

.md-mask-enter-active,
.md-mask-leave-active {
  transition: opacity 0.2s ease;
}
.md-mask-enter-from,
.md-mask-leave-to {
  opacity: 0;
}

.md-slide-enter-active,
.md-slide-leave-active {
  transition: transform 0.24s ease;
}
.md-slide-enter-from,
.md-slide-leave-to {
  transform: translateX(32px);
}

/* ===== 标题行 ===== */
.md__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(10);
}

.md__title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: clamp(14px, calc(20 * var(--min-scale)), 20px);
  font-weight: 700;
  line-height: 1.2;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.md__icon-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: 3px;
  background: rgba(0, 68, 130, 0.5);
  color: fire.$fire-text-title;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.md__icon-btn:hover {
  background: rgba(0, 104, 200, 0.75);
  color: #ffffff;
}

/* ===== 头部：设备数量 + 占比环 ===== */
.md__stat {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: vw(16);
}

.md__stat-lead {
  display: flex;
  align-items: center;
  gap: vw(10);
  min-width: 0;
}

/* 图标框：56×56（设计稿导出的图标自带底色与圆角，不再叠背景） */
.md__stat-icon {
  flex-shrink: 0;
  width: vh(56);
  height: vh(56);
  display: flex;
  align-items: center;
  justify-content: center;
}

.md__stat-icon img {
  width: 100%;
  height: 100%;
  display: block;
}

.md__stat-meta {
  min-width: 0;
}

.md__stat-label {
  display: flex;
  align-items: center;
  gap: vw(4);
  font-size: 14px;
  line-height: 1.2;
  color: fire.$fire-text-sub;
  white-space: nowrap;
}

.md__stat-info {
  color: fire.$fire-text-dim;
  flex-shrink: 0;
}

.md__stat-value {
  display: flex;
  align-items: baseline;
  gap: vw(4);
  margin-top: vh(4);
}

.md__stat-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(30 * var(--min-scale)), 30px);
  font-weight: 700;
  line-height: 1.1;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}

.md__stat-unit {
  font-size: 14px;
  color: fire.$fire-text-label;
}

/* 占比环 + 图例 */
.md__chart {
  display: flex;
  align-items: center;
  gap: vw(16);
  flex-shrink: 0;
}

.md__ring {
  display: block;
  flex-shrink: 0;
  transform: rotate(-90deg);
}

.md__ring-track {
  fill: none;
  stroke: rgba(120, 190, 255, 0.14);
  stroke-width: 8;
}

.md__ring-seg {
  fill: none;
  stroke-width: 8;
  stroke-linecap: butt;
}

.md__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

.md__legend-item {
  display: flex;
  align-items: baseline;
  gap: vw(8);
  font-size: 14px;
  color: fire.$fire-text-label;
  white-space: nowrap;
}

.md__legend-key {
  display: inline-flex;
  align-items: center;
  gap: vw(5);
}

.md__legend-chip {
  width: vw(8);
  height: vw(8);
  border-radius: 2px;
  flex-shrink: 0;
}

.md__legend-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}

.md__legend-count {
  font-size: 14px;
  color: fire.$fire-text-dim;
  font-variant-numeric: tabular-nums;
}

/* 分隔线 */
.md__rule {
  flex-shrink: 0;
  height: 1px;
  background: rgba(120, 190, 255, 0.16);
}

/* ===== 筛选行 ===== */
.md__filters {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(10);
}

.md__search {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.md__search-input {
  width: 100%;
  height: vh(34);
  padding: 0 vw(32) 0 vw(12);
  border: 1px solid rgba(120, 190, 255, 0.24);
  border-radius: 4px;
  background: rgba(0, 40, 86, 0.9);
  color: fire.$fire-text-bright;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  outline: none;
}

.md__search-input::placeholder {
  color: fire.$fire-text-dim;
}

.md__search-input:focus {
  border-color: rgba(120, 190, 255, 0.5);
}

.md__search-icon {
  position: absolute;
  right: vw(10);
  font-size: 16px;
  color: fire.$fire-text-dim;
  pointer-events: none;
}

.md__search-clear {
  position: absolute;
  right: vw(8);
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(120, 190, 255, 0.2);
  color: fire.$fire-text-title;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.md__select {
  flex-shrink: 0;
  width: vw(150);
  height: vh(34);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.24);
  border-radius: 4px;
  background: rgba(0, 40, 86, 0.9);
  color: fire.$fire-text-bright;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.md__select option {
  background: #002a5c;
  color: fire.$fire-text-bright;
}

.md__query {
  flex-shrink: 0;
  height: vh(34);
  padding: 0 vw(22);
  border: none;
  border-radius: 4px;
  background: rgba(0, 134, 228, 0.9);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.18s;
}

.md__query:hover {
  background: rgba(0, 158, 245, 0.95);
}

/* ===== 设备表格 ===== */
.md__table-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: 4px;
}

.md__table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.md__th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: vh(9) vw(10);
  border-bottom: 1px solid rgba(120, 190, 255, 0.2);
  background: #003569;
  color: #d4e3ff;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
}

.md__tr {
  cursor: pointer;
  transition: background 0.15s;
}

.md__tr:hover {
  background: rgba(0, 84, 160, 0.32);
}

.md__td {
  padding: vh(8) vw(10);
  border-bottom: 1px solid rgba(120, 190, 255, 0.1);
  font-size: 14px;
  line-height: 1.3;
  color: fire.$fire-text-label;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.md__th--status,
.md__td--status { width: vw(96); }
.md__th--code,
.md__td--code { width: vw(140); }
.md__th--value,
.md__td--value { width: vw(130); }
.md__th--time,
.md__td--time { width: vw(96); }

/* 运行状态：圆点 + 文案。异常统一一个红，正常走中性色 */
.md__status-cell {
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  white-space: nowrap;
}

.md__status-dot {
  width: vw(7);
  height: vw(7);
  border-radius: 50%;
  background: fire.$fire-neutral;
  flex-shrink: 0;
}

.md__status-cell.is-alarm,
.md__status-cell.is-fault,
.md__status-cell.is-offline,
.md__status-cell.is-unknown {
  color: fire.$fire-anomaly;
}

.md__status-cell.is-alarm .md__status-dot,
.md__status-cell.is-fault .md__status-dot,
.md__status-cell.is-offline .md__status-dot,
.md__status-cell.is-unknown .md__status-dot {
  background: fire.$fire-anomaly;
}

.md__status-cell.is-shielded {
  color: fire.$fire-text-dim;
}

.md__status-cell.is-shielded .md__status-dot {
  background: rgba(126, 166, 214, 0.5);
}

/* 实时值：数值 + 小一号单位 */
.md__value {
  font-variant-numeric: tabular-nums;
}

.md__value-unit {
  margin-left: vw(4);
  font-size: 14px;
  color: fire.$fire-text-dim;
}

.md__value.is-abnormal {
  color: fire.$fire-anomaly;
  font-weight: 500;
}

.md__value.is-abnormal .md__value-unit {
  color: rgba(255, 128, 128, 0.75);
}

/* 编码列的按钮：整行可点，但键盘 / 读屏需要真正可聚焦的入口 */
.md__code-btn {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.md__code-btn:hover {
  color: #ffffff;
  text-decoration: underline;
}

.md__code-btn:focus-visible {
  outline: 1px solid rgba(120, 190, 255, 0.7);
  outline-offset: 2px;
}

.md__empty {
  padding: vh(28) 0;
  text-align: center;
  color: fire.$fire-text-dim;
}

/* ===== 分页 ===== */
.md__pager {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(12);
}

.md__pager-total {
  font-size: 14px;
  color: fire.$fire-text-label;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.md__pager-right {
  display: flex;
  align-items: center;
  gap: vw(6);
}

.md__page-btn,
.md__page-num {
  min-width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 vw(4);
  border: 1px solid rgba(120, 190, 255, 0.24);
  border-radius: 3px;
  background: rgba(0, 68, 130, 0.56);
  color: fire.$fire-text-label;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.md__page-btn:hover:not(:disabled),
.md__page-num:hover:not(.is-active) {
  background: rgba(0, 104, 200, 0.75);
  color: #ffffff;
}

.md__page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.md__page-num.is-active {
  background: rgba(0, 134, 228, 0.9);
  border-color: rgba(0, 134, 228, 0.9);
  color: #ffffff;
}

.md__pages {
  margin-left: vw(6);
  font-size: 14px;
  color: fire.$fire-text-sub;
  white-space: nowrap;
}

/* ===== 二级：设备详情 ===== */
.md__detail {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: vh(12);
}

.md__status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(12);
  padding: vh(10) vw(12);
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: 3px;
  background: rgba(0, 40, 86, 0.6);
}

.md__status.is-alarm,
.md__status.is-fault,
.md__status.is-offline,
.md__status.is-unknown {
  border-color: rgba(255, 128, 128, 0.4);
}

.md__status-text {
  font-size: clamp(14px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  color: fire.$fire-text-title;
}

.md__status.is-alarm .md__status-text,
.md__status.is-fault .md__status-text,
.md__status.is-offline .md__status-text,
.md__status.is-unknown .md__status-text {
  color: fire.$fire-anomaly;
}

.md__status-time {
  font-size: 14px;
  color: fire.$fire-text-sub;
  font-variant-numeric: tabular-nums;
}

/* 基本信息 */
.md__facts {
  flex-shrink: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: 3px;
  overflow: hidden;
}

.md__fact {
  display: flex;
  align-items: baseline;
  gap: vw(12);
  padding: vh(7) vw(10);
  background: rgba(0, 40, 86, 0.45);
}

.md__fact-k {
  flex-shrink: 0;
  width: vw(72);
  font-size: 14px;
  color: fire.$fire-text-dim;
}

.md__fact-v {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 14px;
  color: fire.$fire-text-bright;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 实时测点 */
.md__section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

.md__section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: fire.$fire-text-title;
}

.md__metric {
  display: flex;
  flex-direction: column;
  gap: vh(4);
  padding: vh(8) vw(10);
  border: 1px solid rgba(120, 190, 255, 0.14);
  border-radius: 3px;
  background: rgba(0, 40, 86, 0.45);
}

.md__metric-head {
  display: flex;
  align-items: baseline;
  gap: vw(4);
}

.md__metric-label {
  font-size: 14px;
  color: fire.$fire-text-label;
}

.md__metric-unit {
  font-size: 14px;
  color: fire.$fire-text-dim;
}

.md__metric-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, calc(20 * var(--min-scale)), 20px);
  color: fire.$fire-text-bright;
  font-variant-numeric: tabular-nums;
}

.md__metric-value.is-abnormal {
  color: fire.$fire-anomaly;
}

.md__metric-range {
  font-size: 14px;
  color: fire.$fire-text-dim;
  display: flex;
  gap: vw(10);
  flex-wrap: wrap;
}

.md__lim--hi { color: fire.$fire-anomaly; }
.md__lim--lo { color: fire.$fire-text-sub; }
</style>
