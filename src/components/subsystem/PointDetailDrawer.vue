<template>
  <el-drawer
    :model-value="modelValue"
    :title="point?.code ?? ''"
    size="480px"
    @update:model-value="(v: boolean) => !v && emit('update:modelValue', false)"
  >
    <template v-if="point && runtime">
      <div class="pdd">
        <!-- 头部状态 -->
        <div class="pdd__hero" :class="`pdd__hero--${runtime.status}`">
          <div class="pdd__hero-left">
            <PointStatusDot :status="runtime.status" size="lg" show-label />
            <span class="pdd__type">{{ profile?.name ?? point.typeKey }}</span>
          </div>
          <span class="pdd__updated">{{ formatTime(runtime.updatedAt) }}</span>
        </div>

        <!-- 异常清单导航：处理几十个异常时不用反复关抽屉重找 -->
        <div v-if="hasSiblings" class="pdd__nav">
          <span class="pdd__nav-text">异常 {{ siblingIndex + 1 }} / {{ siblings.length }}</span>
          <div class="pdd__nav-actions">
            <button
              type="button"
              class="pdd__nav-btn"
              :disabled="siblingIndex <= 0"
              @click="gotoSibling(-1)"
            >
              <AppIcon name="chevron-left" />上一个
            </button>
            <button
              type="button"
              class="pdd__nav-btn"
              :disabled="siblingIndex >= siblings.length - 1"
              @click="gotoSibling(1)"
            >
              下一个<AppIcon name="chevron-right" />
            </button>
          </div>
        </div>

        <!-- 异常原因：直接给出"哪个量、超了哪条限"，不要求用户自己比对 -->
        <div v-if="reason" class="pdd__reason">
          <AppIcon name="tips" class="pdd__reason-icon" />
          <div class="pdd__reason-body">
            <div class="pdd__reason-title">报警原因</div>
            <div class="pdd__reason-text">{{ reason }}</div>
            <div class="pdd__reason-range">
              量程 {{ reasonDetail?.metric.range?.[0] }} ~ {{ reasonDetail?.metric.range?.[1] }}
              <span v-if="reasonDetail?.metric.highLimit != null" class="pdd__lim pdd__lim--hi">
                高限 {{ reasonDetail.metric.highLimit }}
              </span>
              <span v-if="reasonDetail?.metric.lowLimit != null" class="pdd__lim pdd__lim--lo">
                低限 {{ reasonDetail.metric.lowLimit }}
              </span>
            </div>
          </div>
        </div>

        <!-- 基本信息 -->
        <el-descriptions :column="1" size="small" border class="pdd__desc">
          <el-descriptions-item label="设备编号">{{ point.code }}</el-descriptions-item>
          <el-descriptions-item label="安装位置">{{ point.location }}</el-descriptions-item>
          <el-descriptions-item label="所属主机">{{ hostLabel }}</el-descriptions-item>
          <el-descriptions-item v-if="point.videoChannel" label="视频通道">
            CH-{{ point.videoChannel }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 实时测点 -->
        <div class="pdd__section">
          <h4 class="pdd__title">实时测点</h4>
          <div v-for="m in point.metrics" :key="m.key" class="pdd__metric">
            <div class="pdd__metric-head">
              <span class="pdd__metric-label">{{ m.label }}</span>
              <span v-if="m.unit" class="pdd__metric-unit">({{ m.unit }})</span>
            </div>
            <MetricCell :metric="m" :value="runtime.values?.[m.key]" :status="runtime.status" />
            <div v-if="m.range" class="pdd__range">
              量程 {{ m.range[0] }} ~ {{ m.range[1] }}
              <span v-if="m.highLimit != null" class="pdd__lim pdd__lim--hi">高限 {{ m.highLimit }}</span>
              <span v-if="m.lowLimit != null" class="pdd__lim pdd__lim--lo">低限 {{ m.lowLimit }}</span>
            </div>
          </div>
        </div>

        <!-- 24h 趋势 -->
        <div v-if="hasTrend" class="pdd__section">
          <h4 class="pdd__title">24 小时趋势</h4>
          <div class="pdd__chart">
            <EChart :option="chartOption" autoresize />
          </div>
        </div>

        <!-- 联动控制（仅可控设备） -->
        <div v-if="point.controllable" class="pdd__section pdd__control">
          <h4 class="pdd__title">
            <AppIcon name="tips" /> 联动控制
          </h4>
          <el-alert type="warning" :closable="false" show-icon
            title="控制指令将真实动作于消防设施，需二次确认并全程留痕。" />
          <div class="pdd__control-actions">
            <el-button type="danger" plain size="small" @click="emit('control', { point, action: 'start' })">
              <AppIcon name="play" /> 远程启动
            </el-button>
            <el-button size="small" @click="emit('control', { point, action: 'stop' })">
              <AppIcon name="minus" /> 远程停止
            </el-button>
          </div>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import AppIcon from '@/components/base/AppIcon.vue'
import type { PointDef, PointRuntime, DeviceProfile, MetricDef } from '@/types/subsystem'
import PointStatusDot from './PointStatusDot.vue'
import MetricCell from './MetricCell.vue'
import { findAlarmReason, alarmReasonText } from './alarm-reason'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])
const EChart = VChart

const props = withDefaults(defineProps<{
  modelValue: boolean
  point?: PointDef
  runtime?: PointRuntime
  profile?: DeviceProfile
  hostLabel?: string
  /** 异常点位清单（用于上一条/下一条导航） */
  siblings?: PointDef[]
  /** 当前点位在异常清单中的下标 */
  siblingIndex?: number
}>(), {
  siblings: () => [],
  siblingIndex: -1,
})

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'control': [payload: { point: PointDef; action: string }]
  'sibling': [point: PointDef]
}>()

const trendMetrics = computed<MetricDef[]>(() =>
  props.point?.metrics.filter(m => m.kind === 'analog') ?? [],
)

const hasTrend = computed(() =>
  trendMetrics.value.some(m => (props.runtime?.trend?.[m.key]?.length ?? 0) > 1),
)

/** 报警原因 */
const reasonDetail = computed(() =>
  props.point ? findAlarmReason(props.point, props.runtime) : null,
)
const reason = computed(() =>
  props.point ? alarmReasonText(props.point, props.runtime) : '',
)

/** 是否在异常清单中（正常点位不给导航） */
const hasSiblings = computed(() =>
  props.siblings.length > 0 && props.siblingIndex >= 0,
)

function gotoSibling(delta: number) {
  const next = props.siblings[props.siblingIndex + delta]
  if (next) emit('sibling', next)
}

const chartOption = computed<EChartsOption>(() => {
  const series = trendMetrics.value.map(m => {
    const [min, max] = m.range ?? [0, 100]
    return {
      name: m.label,
      type: 'line' as const,
      smooth: true,
      showSymbol: false,
      data: props.runtime?.trend?.[m.key] ?? [],
      lineStyle: { width: 2 },
      markLine: m.highLimit != null ? {
        silent: true,
        symbol: 'none' as const,
        data: [{ yAxis: m.highLimit, label: { formatter: `${m.label}高限`, fontSize: 10 } }],
        lineStyle: { color: 'var(--danger)', type: 'dashed' as const, width: 1 },
      } : undefined,
      areaStyle: m === trendMetrics.value[0] ? { opacity: 0.06 } : undefined,
      scale: true,
      yAxisMin: min,
      yAxisMax: max,
    }
  })
  return {
    grid: { left: 40, right: 12, top: 20, bottom: 24 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: Array.from({ length: 24 }, (_, i) => `${i}:00`), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', scale: true, axisLabel: { fontSize: 10 } },
    series,
  }
})

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
</script>

<style scoped>
.pdd { display: flex; flex-direction: column; gap: var(--spacing-xl); }

.pdd__hero {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--spacing-lg); border-radius: var(--radius-md);
  background: var(--bg-sub-card); border: 1px solid var(--border-default);
}
.pdd__hero--alarm { background: var(--danger-bg); border-color: var(--danger); }
.pdd__hero--fault { background: var(--warning-bg); border-color: var(--warning); }
.pdd__hero-left { display: flex; align-items: center; gap: var(--spacing-lg); }
.pdd__type { font-size: var(--font-small); color: var(--text-secondary); }
.pdd__updated { font-size: var(--font-xs); color: var(--text-muted); font-variant-numeric: tabular-nums; }

/* 异常清单导航 */
.pdd__nav {
  display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-sub-card);
  border: 1px solid var(--border-low);
  border-radius: var(--radius-md);
}
.pdd__nav-text { font-size: var(--font-xs); color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.pdd__nav-actions { display: flex; gap: var(--spacing-sm); }
.pdd__nav-btn {
  display: inline-flex; align-items: center; gap: 2px;
  font: inherit; font-size: var(--font-xs);
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 3px 8px; cursor: pointer;
  transition: border-color .2s ease, color .2s ease;
}
.pdd__nav-btn:not(:disabled):hover { border-color: var(--accent-primary); color: var(--accent-primary); }
.pdd__nav-btn:disabled { opacity: .45; cursor: not-allowed; }

/* 报警原因 */
.pdd__reason {
  display: flex; align-items: flex-start; gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--danger-bg);
  border: 1px solid var(--danger);
  border-radius: var(--radius-md);
}
.pdd__reason-icon { color: var(--danger-text); font-size: 16px; flex-shrink: 0; margin-top: 2px; }
.pdd__reason-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pdd__reason-title { font-size: var(--font-xs); font-weight: 600; color: var(--danger-text); }
.pdd__reason-text { font-size: var(--font-small); color: var(--text-primary); font-weight: 500; }
.pdd__reason-range { font-size: 10px; color: var(--text-muted); display: flex; gap: 8px; flex-wrap: wrap; }

.pdd__section { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.pdd__title { margin: 0; font-size: var(--font-small); font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 4px; }

.pdd__metric {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-sub-card); border-radius: var(--radius-md);
  border: 1px solid var(--border-low);
}
.pdd__metric-head { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
.pdd__metric-label { font-size: var(--font-xs); color: var(--text-secondary); }
.pdd__metric-unit { font-size: var(--font-xs); color: var(--text-muted); }
.pdd__range { margin-top: 6px; font-size: 10px; color: var(--text-muted); display: flex; gap: 8px; flex-wrap: wrap; }
.pdd__lim--hi { color: var(--danger-text); }
.pdd__lim--lo { color: var(--warning-text); }

.pdd__chart { height: 160px; }

.pdd__control-actions { display: flex; gap: var(--spacing-md); }
</style>
