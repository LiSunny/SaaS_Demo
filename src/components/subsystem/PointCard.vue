<template>
  <div class="pc" :class="[`pc--${status}`, { 'pc--clickable': !!onSelect }]" @click="onSelect?.(point)">
    <div class="pc__head">
      <div class="pc__title">
        <!-- 点位状态：正常时只给色点（1099 个正常点位不需要文字），异常时必须出文字 -->
        <PointStatusDot :status="status" size="md" :show-label="isAbnormal" />
        <span class="pc__code">{{ point.code }}</span>
      </div>
      <AppIcon v-if="point.videoChannel" name="video" class="pc__video" title="已绑定视频通道" />
    </div>

    <div class="pc__loc" :title="point.location">
      <AppIcon name="location" class="pc__loc-icon" />
      <span>{{ point.location }}</span>
    </div>

    <!-- 异常原因直达：不等点开抽屉就知道超了哪个限 -->
    <div v-if="alarmReason" class="pc__reason">
      <AppIcon name="tips" class="pc__reason-icon" />
      <span>{{ alarmReason }}</span>
    </div>

    <div class="pc__metrics">
      <div v-for="m in point.metrics" :key="m.key" class="pc__metric">
        <span class="pc__metric-label">{{ m.label }}</span>
        <MetricCell :metric="m" :value="runtime?.values?.[m.key]" :status="status" />
      </div>
    </div>

    <!-- 迷你趋势线（仅模拟量） -->
    <div v-if="trendMetric && trendData.length > 1" class="pc__trend">
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" class="pc__trend-svg">
        <polyline :points="trendPoints" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      </svg>
      <span class="pc__trend-label">近 24h</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import type { PointDef, PointRuntime, MetricDef } from '@/types/subsystem'
import PointStatusDot from './PointStatusDot.vue'
import MetricCell from './MetricCell.vue'
import { alarmReasonText } from './alarm-reason'
import { isAbnormalStatus } from './status-labels'

const props = defineProps<{
  point: PointDef
  runtime?: PointRuntime
  onSelect?: (p: PointDef) => void
}>()

/** 点位状态（由阈值判定得出），与"设备状态"测点是两个概念 */
const status = computed(() => props.runtime?.status ?? 'unknown')
const isAbnormal = computed(() => isAbnormalStatus(status.value))

/** 异常原因：直接告诉用户超了哪条限，省掉一次点开 */
const alarmReason = computed(() => alarmReasonText(props.point, props.runtime))

/** 优先取第一个模拟量做趋势 */
const trendMetric = computed<MetricDef | undefined>(() =>
  props.point.metrics.find(m => m.kind === 'analog'),
)

const trendData = computed<number[]>(() => {
  const m = trendMetric.value
  if (!m) return []
  return props.runtime?.trend?.[m.key] ?? []
})

const trendPoints = computed(() => {
  const data = trendData.value
  if (data.length < 2) return ''
  const [min, max] = trendMetric.value?.range ?? [0, 100]
  const span = max - min || 1
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 24 - ((v - min) / span) * 24
      return `${x.toFixed(2)},${Math.max(0, Math.min(24, y)).toFixed(2)}`
    })
    .join(' ')
})
</script>

<style scoped>
.pc {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex; flex-direction: column; gap: 8px;
  transition: box-shadow .2s ease, border-color .2s ease;
}
.pc--clickable { cursor: pointer; }
.pc--clickable:hover { border-color: var(--accent-primary); box-shadow: 0 2px 8px rgba(0,0,0,.06); }

.pc--alarm  { border-color: var(--danger);  background: var(--danger-bg); }
.pc--fault  { border-color: var(--warning); background: var(--warning-bg); }
.pc--offline{ border-color: var(--border-high); }

.pc__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pc__title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.pc__code {
  font-size: var(--font-small); font-weight: 600; color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.pc__video { color: var(--accent-primary); font-size: 16px; flex-shrink: 0; }

.pc__loc {
  display: flex; align-items: center; gap: 4px;
  font-size: var(--font-xs); color: var(--text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pc__loc-icon { flex-shrink: 0; }

/* 异常原因条 */
.pc__reason {
  display: flex; align-items: flex-start; gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--danger-bg);
  border-left: 2px solid var(--danger);
  font-size: var(--font-xs); font-weight: 500; color: var(--danger-text);
  line-height: 1.5;
}
.pc__reason-icon { flex-shrink: 0; margin-top: 1px; }

.pc__metrics { display: flex; flex-direction: column; gap: 6px; }
.pc__metric { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pc__metric-label { font-size: var(--font-xs); color: var(--text-secondary); flex-shrink: 0; }

.pc__trend { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.pc__trend-svg {
  flex: 1; height: 24px; color: var(--success);
}
.pc--alarm .pc__trend-svg { color: var(--danger); }
.pc__trend-label { font-size: 10px; color: var(--text-muted); flex-shrink: 0; }
</style>
